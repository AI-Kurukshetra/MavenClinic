import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";
import {
  getAuthenticatedRedirectPath,
  patientRoutePrefixes,
  type AppRole,
} from "@/lib/roles";

type MiddlewareProfile = {
  role: AppRole | null;
  onboarding_complete: boolean | null;
};

type RouteRule = {
  prefix: string;
  roles: AppRole[];
};

const authEntryPrefixes = ["/login", "/signup", "/register"] as const;
const validRoles = new Set<AppRole>([
  "patient",
  "provider",
  "employer_admin",
  "clinic_admin",
  "super_admin",
  "partner",
]);

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

function resolveRole(value: unknown): AppRole | null {
  return typeof value === "string" && validRoles.has(value as AppRole) ? (value as AppRole) : null;
}

function hasCompletedOnboardingMetadata(user: User) {
  const metadata = user.user_metadata ?? {};

  if (metadata.onboardingComplete === true) {
    return true;
  }

  const keys = [
    "pronouns",
    "languagePreference",
    "healthGoals",
    "conditions",
    "medications",
    "insuranceCarrier",
    "memberId",
    "specialtyNeeded",
    "preferredLanguage",
    "genderPreference",
  ] as const;

  return keys.some((key) => {
    const value = metadata[key];

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return typeof value === "string" ? value.trim().length > 0 : Boolean(value);
  });
}

function buildPermissionsPolicy(pathname: string) {
  if (pathname.startsWith("/consultations")) {
    return "camera=(self), microphone=(self), geolocation=()";
  }

  return "camera=(), microphone=(), geolocation=()";
}

function buildContentSecurityPolicy(pathname: string) {
  const connectSources = [
    "'self'",
    "https://*.supabase.co",
    "wss://*.supabase.co",
  ];

  if (pathname.startsWith("/consultations")) {
    connectSources.push("https://api.daily.co", "https://*.daily.co", "wss://*.daily.co");
  }

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' data: blob: https://*.supabase.co",
    "font-src 'self' https://fonts.gstatic.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "script-src 'self' 'unsafe-inline'",
    `connect-src ${connectSources.join(" ")}`,
    "frame-src 'self' https://*.daily.co",
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join('; ');
}

function applySecurityHeaders(response: NextResponse, pathname: string) {
  response.headers.set("Content-Security-Policy", buildContentSecurityPolicy(pathname));
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", buildPermissionsPolicy(pathname));
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  return response;
}

function logMiddlewareDecision(path: string, role: AppRole | null, redirectPath: string | null) {
  console.log("Middleware:", {
    path,
    role,
    redirect: redirectPath,
  });
}

function withRedirectCount(response: NextResponse, redirectCount: number) {
  response.cookies.set("redirect_count", String(redirectCount + 1), { path: "/", sameSite: "lax" });
  return response;
}

function clearRedirectCount(response: NextResponse) {
  response.cookies.delete("redirect_count");
  return response;
}

function redirectTo(request: NextRequest, pathname: string, redirectCount: number, role: AppRole | null) {
  logMiddlewareDecision(request.nextUrl.pathname, role, pathname);
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  const response = applySecurityHeaders(NextResponse.redirect(url), request.nextUrl.pathname);
  return withRedirectCount(response, redirectCount);
}

function redirectToLogin(request: NextRequest, redirectCount: number, role: AppRole | null) {
  logMiddlewareDecision(request.nextUrl.pathname, role, "/login");
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  const response = applySecurityHeaders(NextResponse.redirect(url), request.nextUrl.pathname);
  return withRedirectCount(response, redirectCount);
}

function redirectLoopResponse(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  const response = applySecurityHeaders(NextResponse.redirect(url), request.nextUrl.pathname);
  response.cookies.delete("redirect_count");
  logMiddlewareDecision(request.nextUrl.pathname, null, "/login (loop protection)");
  return response;
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
  const redirectCount = Number.parseInt(request.cookies.get("redirect_count")?.value ?? "0", 10);

  if (redirectCount > 3) {
    return redirectLoopResponse(request);
  }

  const onboardingPath = matchesPath(pathname, "/onboarding");
  const patientAppPath = isProtectedPatientPath(pathname);
  const requiredRoles = getRequiredRoles(pathname);
  const protectedPath = onboardingPath || patientAppPath || Boolean(requiredRoles);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (protectedPath) {
      return redirectToLogin(request, redirectCount, null);
    }

    logMiddlewareDecision(pathname, null, null);
    return clearRedirectCount(applySecurityHeaders(response, pathname));
  }

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("role, onboarding_complete")
    .eq("id", user.id)
    .maybeSingle();

  const databaseRole = (profileData?.role as AppRole | null) ?? null;
  const metadataRole = resolveRole(user.user_metadata?.role);
  const role = databaseRole ?? (requiredRoles ? metadataRole : patientAppPath || onboardingPath ? "patient" : metadataRole);
  const profile: MiddlewareProfile | null = {
    role,
    onboarding_complete: profileData?.onboarding_complete ?? hasCompletedOnboardingMetadata(user),
  };

  if (profileError) {
    console.error("Middleware profile lookup error:", {
      path: pathname,
      userId: user.id,
      message: profileError.message,
    });
  }

  if (isAuthEntryPath(pathname)) {
    return redirectTo(request, getAuthenticatedRedirectPath(profile), redirectCount, profile.role);
  }

  if (onboardingPath) {
    if (profile.role && profile.role !== "patient") {
      return redirectTo(request, getAuthenticatedRedirectPath(profile), redirectCount, profile.role);
    }

    if (profile.onboarding_complete) {
      return redirectTo(request, "/dashboard", redirectCount, profile.role);
    }

    logMiddlewareDecision(pathname, profile.role, null);
    return clearRedirectCount(applySecurityHeaders(response, pathname));
  }

  if (patientAppPath) {
    if (profile.role === "patient") {
      if (!profile.onboarding_complete && pathname !== "/dashboard") {
        return redirectTo(request, "/onboarding", redirectCount, profile.role);
      }

      logMiddlewareDecision(pathname, profile.role, null);
      return clearRedirectCount(applySecurityHeaders(response, pathname));
    }

    if (databaseRole && databaseRole !== "patient") {
      return redirectTo(request, getAuthenticatedRedirectPath(profile), redirectCount, profile.role);
    }

    logMiddlewareDecision(pathname, profile.role, null);
    return clearRedirectCount(applySecurityHeaders(response, pathname));
  }

  if (requiredRoles && !requiredRoles.includes((profile.role as AppRole | null) ?? "patient")) {
    return redirectTo(request, getAuthenticatedRedirectPath(profile), redirectCount, profile.role);
  }

  logMiddlewareDecision(pathname, profile.role, null);
  return clearRedirectCount(applySecurityHeaders(response, pathname));
}
