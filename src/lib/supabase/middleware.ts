import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  getAuthenticatedRedirectPath,
  patientRoutePrefixes,
  type AppRole,
} from "@/lib/roles";
import { env } from "@/lib/env";

type MiddlewareProfile = {
  role: AppRole | null;
  onboarding_complete: boolean | null;
};

type RouteRule = {
  prefix: string;
  roles: AppRole[];
};

const authEntryPrefixes = ["/login", "/signup", "/register"] as const;

const roleRouteRules: RouteRule[] = [
  { prefix: "/provider", roles: ["provider"] },
  { prefix: "/employer", roles: ["employer_admin"] },
  { prefix: "/clinic", roles: ["clinic_admin", "super_admin"] },
  { prefix: "/admin", roles: ["clinic_admin", "super_admin"] },
  { prefix: "/super", roles: ["super_admin"] },
  { prefix: "/partner", roles: ["partner"] },
];

function matchesPath(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function isAuthEntryPath(pathname: string) {
  return authEntryPrefixes.some((prefix) => matchesPath(pathname, prefix));
}

function isProtectedPatientPath(pathname: string) {
  return patientRoutePrefixes.some((prefix) => matchesPath(pathname, prefix));
}

function getRequiredRoles(pathname: string) {
  return roleRouteRules.find((rule) => matchesPath(pathname, rule.prefix))?.roles ?? null;
}

function redirectTo(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return NextResponse.redirect(url);
}

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(url);
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const pathname = request.nextUrl.pathname;
  const onboardingPath = matchesPath(pathname, "/onboarding");
  const patientAppPath = isProtectedPatientPath(pathname);
  const requiredRoles = getRequiredRoles(pathname);
  const protectedPath = onboardingPath || patientAppPath || Boolean(requiredRoles);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return protectedPath ? redirectToLogin(request) : response;
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("role, onboarding_complete")
    .eq("id", user.id)
    .maybeSingle();

  const profile: MiddlewareProfile | null = profileData
    ? {
        role: (profileData.role as AppRole | null) ?? null,
        onboarding_complete: profileData.onboarding_complete ?? null,
      }
    : null;

  if (pathname === "/" || isAuthEntryPath(pathname)) {
    return redirectTo(request, getAuthenticatedRedirectPath(profile));
  }

  if (onboardingPath) {
    if (profile?.role && profile.role !== "patient") {
      return redirectTo(request, getAuthenticatedRedirectPath(profile));
    }

    if (profile?.onboarding_complete) {
      return redirectTo(request, "/dashboard");
    }

    return response;
  }

  if (patientAppPath) {
    if (profile?.role && profile.role !== "patient") {
      return redirectTo(request, getAuthenticatedRedirectPath(profile));
    }

    if (!profile?.onboarding_complete) {
      return redirectTo(request, "/onboarding");
    }
  }

  if (requiredRoles && !requiredRoles.includes((profile?.role as AppRole | null) ?? "patient")) {
    return redirectTo(request, getAuthenticatedRedirectPath(profile));
  }

  return response;
}
