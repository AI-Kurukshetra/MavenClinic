import { NextResponse } from "next/server";
import { getAuthenticatedRedirectPath } from "@/lib/auth";
import { publicEnv } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";

async function syncRoleMetadataForSessionUser(userId: string) {
  const supabase = await getSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.role) {
    await supabase.auth.updateUser({
      data: { role: profile.role },
    });
  }

  return profile?.role ?? null;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");
  const supabase = await getSupabaseServerClient();

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.redirect(new URL("/login", publicEnv.NEXT_PUBLIC_APP_URL));
  }

  const role = await syncRoleMetadataForSessionUser(session.user.id);
  const redirectPath = next && next.startsWith("/") && !next.startsWith("//")
    ? next
    : getAuthenticatedRedirectPath({
        role: role ?? (typeof session.user.user_metadata?.role === "string" ? session.user.user_metadata.role : null),
        onboarding_complete: Boolean(session.user.user_metadata?.onboardingComplete),
      });

  return NextResponse.redirect(new URL(redirectPath, publicEnv.NEXT_PUBLIC_APP_URL));
}
