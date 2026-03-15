import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getAuthenticatedRedirectPath as getRoleRedirectPath, type AppRole } from "@/lib/roles";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type { AppRole } from "@/lib/roles";

export type ProfileRow = {
  id: string;
  role: AppRole;
  full_name: string | null;
  date_of_birth?: string | null;
  onboarding_complete: boolean | null;
  employer_id?: string | null;
};

const validRoles = new Set<AppRole>([
  "patient",
  "provider",
  "employer_admin",
  "clinic_admin",
  "super_admin",
  "partner",
]);

function getUserDisplayName(user: User) {
  return (
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
    (typeof user.user_metadata?.name === "string" && user.user_metadata.name) ||
    user.email?.split("@")[0] ||
    "Maven user"
  );
}

function resolveRole(value: unknown): AppRole | null {
  return typeof value === "string" && validRoles.has(value as AppRole) ? (value as AppRole) : null;
}

function resolveRoleFromUser(user: User) {
  return resolveRole(user.user_metadata?.role) ?? resolveRole(user.app_metadata?.role);
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

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function getCurrentProfile(userId?: string): Promise<ProfileRow | null> {
  const currentUserId = userId ?? (await getCurrentUser())?.id;

  if (!currentUserId) {
    return null;
  }

  try {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select("id, role, full_name, date_of_birth, onboarding_complete, employer_id")
      .eq("id", currentUserId)
      .maybeSingle();

    if (error) {
      console.error("getCurrentProfile error:", error.message);
      return null;
    }

    return (data as ProfileRow | null) ?? null;
  } catch (err) {
    console.error("getCurrentProfile failed:", err);
    return null;
  }
}

export async function ensureProfileForUser(user: User) {
  const existingProfile = await getCurrentProfile(user.id);
  const onboardingComplete = existingProfile?.onboarding_complete === true || hasCompletedOnboardingMetadata(user);

  const profileWriter = (() => {
    try {
      return getSupabaseAdminClient();
    } catch {
      return null;
    }
  })();

  await (profileWriter ?? (await getSupabaseServerClient())).from("profiles").upsert({
    id: user.id,
    full_name: existingProfile?.full_name ?? getUserDisplayName(user),
    onboarding_complete: onboardingComplete,
    role: existingProfile?.role ?? resolveRoleFromUser(user) ?? "patient",
  });
}

export async function getCurrentProfileWithSync(user: User): Promise<ProfileRow | null> {
  const profile = await getCurrentProfile(user.id);

  if (!profile) {
    console.error("Profile not found for user:", user.id);
    return null;
  }

  const metaRole = typeof user.user_metadata?.role === "string" ? user.user_metadata.role : null;
  if (metaRole !== profile.role) {
    try {
      const supabase = await getSupabaseServerClient();
      await supabase.auth.updateUser({
        data: { role: profile.role },
      });
    } catch (syncErr) {
      console.error("Role sync failed:", syncErr);
    }
  }

  return profile;
}

export function getAuthenticatedRedirectPath(profile: {
  role?: string | null;
  onboarding_complete?: boolean | null;
} | null) {
  return getRoleRedirectPath(profile);
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
