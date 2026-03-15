import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  getAuthenticatedRedirectPath as getRoleRedirectPath,
  isRoleOnboardingExempt,
  type AppRole,
} from "@/lib/roles";
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

function hasCompletedOnboardingProfileData(profile: ProfileRow | null) {
  return Boolean(profile?.date_of_birth);
}

function buildFallbackProfile(user: User, profile?: ProfileRow | null): ProfileRow {
  return {
    id: user.id,
    role: profile?.role ?? resolveRole(user.user_metadata?.role) ?? "patient",
    full_name: profile?.full_name ?? getUserDisplayName(user),
    date_of_birth: profile?.date_of_birth ?? null,
    onboarding_complete: true,
  };
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

    if (!error) {
      return data as ProfileRow | null;
    }
  } catch {
    // Fall back to the session client when the service role is unavailable.
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, full_name, date_of_birth, onboarding_complete, employer_id")
    .eq("id", currentUserId)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data as ProfileRow | null;
}

export async function ensureProfileForUser(user: User) {
  const existingProfile = await getCurrentProfile(user.id);
  const onboardingComplete =
    existingProfile?.onboarding_complete === true ||
    hasCompletedOnboardingMetadata(user) ||
    hasCompletedOnboardingProfileData(existingProfile);

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
    role: existingProfile?.role ?? resolveRole(user.user_metadata?.role) ?? "patient",
  });
}

export async function getCurrentProfileWithSync(user: User): Promise<ProfileRow | null> {
  const profile = await getCurrentProfile(user.id);

  if (profile?.onboarding_complete || isRoleOnboardingExempt(profile?.role)) {
    return profile;
  }

  const metadataComplete = hasCompletedOnboardingMetadata(user);
  const profileDataComplete = hasCompletedOnboardingProfileData(profile);

  if (!metadataComplete && !profileDataComplete) {
    return profile;
  }

  const fallbackProfile = buildFallbackProfile(user, profile);
  const profileWriter = (() => {
    try {
      return getSupabaseAdminClient();
    } catch {
      return null;
    }
  })();

  await (profileWriter ?? (await getSupabaseServerClient())).from("profiles").upsert({
    id: fallbackProfile.id,
    full_name: fallbackProfile.full_name,
    date_of_birth: fallbackProfile.date_of_birth,
    onboarding_complete: true,
    role: fallbackProfile.role,
  });

  return (await getCurrentProfile(user.id)) ?? fallbackProfile;
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
