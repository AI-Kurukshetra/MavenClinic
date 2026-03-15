import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";
import { patientRoutePrefixes, type AppRole } from "@/lib/roles";

type RouteRule = {
  prefix: string;
  roles: AppRole[];
};

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

function isProtectedPatientPath(pathname: string) {
  return patientRoutePrefixes.some((prefix) => matchesPath(pathname, prefix));
}

function getRequiredRoles(pathname: string) {
  return roleRouteRules.find((rule) => matchesPath(pathname, rule.prefix))?.roles ?? null;
}

function resolveRole(value: unknown): AppRole | null {
  return typeof value === "string" && validRoles.has(value as AppRole) ? (value as AppRole) : null;
}

function buildPermissionsPolicy(pathname: string) {
  if (pathname.startsWith("/consultations")) {
    return "camera=(self), microphone=(self), geolocation=()";
  }

  return "camera=(), microphone=(), geolocation=()";
}

function buildContentSecurityPolicy(pathname: string) {
  const connectSources = ["'self'", "https://*.supabase.co", "wss://*.supabase.co"];

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
  console.log("Middleware:", { path, role, redirect: redirectPath });
}

function withRedirectCount(response: NextResponse, redirectCount: number) {
  response.cookies.set("redirect_count", String(redirectCount + 1), { path: "/", sameSite: "lax" });
  return response;
}

function clearRedirectCount(response: NextResponse) {
  response.cookies.delete("redirect_count");
  return response;
}

function getDefaultRedirect(role: AppRole | undefined): string {
  switch (role) {
    case "provider":
      return "/provider/dashboard";
    case "employer_admin":
      return "/employer/dashboard";
    case "clinic_admin":
      return "/clinic/dashboard";
    case "super_admin":
      return "/super/dashboard";
    case "partner":
      return "/partner/dashboard";
    case "patient":
    default:
      return "/dashboard";
  }
}

function getSafeRedirect(role: AppRole | undefined, redirectTo: string) {
  if (redirectTo.includes("/provider") && role !== "provider") {
    console.error("Attempted wrong redirect:", role, redirectTo);
    return "/dashboard";
  }

  return redirectTo;
}

function redirectTo(request: NextRequest, pathname: string, redirectCount: number, role: AppRole | null) {
  const safePath = getSafeRedirect(role ?? undefined, pathname);
  logMiddlewareDecision(request.nextUrl.pathname, role, safePath);
  const url = request.nextUrl.clone();
  url.pathname = safePath;
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

  const supabase = createServerClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL, publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const pathname = request.nextUrl.pathname;
  const redirectCount = Number.parseInt(request.cookies.get("redirect_count")?.value ?? "0", 10);

  if (redirectCount > 3) {
    return redirectLoopResponse(request);
  }

  const patientAppPath = isProtectedPatientPath(pathname);
  const requiredRoles = getRequiredRoles(pathname);
  const protectedPath = patientAppPath || Boolean(requiredRoles);

  const { data } = await supabase.auth.getSession();
  const session = data.session;
  const user = session?.user ?? null;

  if (!user) {
    if (protectedPath) {
      return redirectToLogin(request, redirectCount, null);
    }

    logMiddlewareDecision(pathname, null, null);
    return clearRedirectCount(applySecurityHeaders(response, pathname));
  }

  const role = resolveRole(user.user_metadata?.role) ?? resolveRole(user.app_metadata?.role);

  if (!role) {
    logMiddlewareDecision(pathname, null, null);
    return clearRedirectCount(applySecurityHeaders(response, pathname));
  }

  if (pathname === "/" || pathname === "/login") {
    return redirectTo(request, getDefaultRedirect(role), redirectCount, role);
  }

  if (requiredRoles && !requiredRoles.includes(role)) {
    return redirectTo(request, getDefaultRedirect(role), redirectCount, role);
  }

  if (patientAppPath && pathname !== "/dashboard" && role !== "patient") {
    return redirectTo(request, getDefaultRedirect(role), redirectCount, role);
  }

  logMiddlewareDecision(pathname, role, null);
  return clearRedirectCount(applySecurityHeaders(response, pathname));
}
