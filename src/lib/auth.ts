import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  getAuthenticatedRedirectPath as getRoleRedirectPath,
  isRoleOnboardingExempt,
  type AppRole,
} from "@/lib/roles";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type { AppRole } from "@/lib/roles";

export type ProfileRow = {
  id: string;
  role: AppRole;
  full_name: string | null;
  date_of_birth?: string | null;
  onboarding_complete: boolean | null;
};

function getUserDisplayName(user: User) {
  return (
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
    (typeof user.user_metadata?.name === "string" && user.user_metadata.name) ||
    user.email?.split("@")[0] ||
    "Maven user"
  );
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

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function getCurrentProfile(userId?: string): Promise<ProfileRow | null> {
  const supabase = await getSupabaseServerClient();
  const currentUserId = userId ?? (await getCurrentUser())?.id;

  if (!currentUserId) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, full_name, date_of_birth, onboarding_complete")
    .eq("id", currentUserId)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data as ProfileRow | null;
}

export async function ensureProfileForUser(user: User) {
  const supabase = await getSupabaseServerClient();
  const existingProfile = await getCurrentProfile(user.id);
  const onboardingComplete =
    existingProfile?.onboarding_complete ??
    hasCompletedOnboardingMetadata(user) ??
    hasCompletedOnboardingProfileData(existingProfile);

  await supabase.from("profiles").upsert({
    id: user.id,
    full_name: existingProfile?.full_name ?? getUserDisplayName(user),
    onboarding_complete: onboardingComplete,
    role: existingProfile?.role ?? "patient",
  });
}

export async function getCurrentProfileWithSync(user: User): Promise<ProfileRow | null> {
  const profile = await getCurrentProfile(user.id);

  if (profile?.onboarding_complete || isRoleOnboardingExempt(profile?.role)) {
    return profile;
  }

  if (!hasCompletedOnboardingMetadata(user) && !hasCompletedOnboardingProfileData(profile)) {
    return profile;
  }

  const supabase = await getSupabaseServerClient();
  await supabase.from("profiles").update({ onboarding_complete: true }).eq("id", user.id);
  return getCurrentProfile(user.id);
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
