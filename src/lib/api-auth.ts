import type { User } from "@supabase/supabase-js";
import type { AppRole } from "@/lib/roles";
import { apiError } from "@/lib/api-response";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type ApiProfile = {
  id: string;
  role: AppRole | null;
  employer_id?: string | null;
};

export type ApiAuthContext = {
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>;
  user: User;
  profile: ApiProfile | null;
};

async function getProfileForUser(userId: string) {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, employer_id")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return { supabase, profile: null as ApiProfile | null, error: apiError(500, "profile_lookup_failed", "Unable to verify your account.") };
  }

  return { supabase, profile: (data as ApiProfile | null) ?? null, error: null };
}

export async function requireApiUser() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { error: apiError(401, "unauthorized", "Unauthorized") };
  }

  const profileResult = await getProfileForUser(user.id);
  if (profileResult.error) {
    return { error: profileResult.error };
  }

  return {
    context: {
      supabase,
      user,
      profile: profileResult.profile,
    } satisfies ApiAuthContext,
  };
}

export async function requireApiRole(roles: AppRole[]) {
  const authResult = await requireApiUser();

  if ("error" in authResult) {
    return authResult;
  }

  if (!authResult.context.profile?.role || !roles.includes(authResult.context.profile.role)) {
    return { error: apiError(403, "forbidden", "Forbidden") };
  }

  return authResult;
}