export type AppRole =
  | "patient"
  | "provider"
  | "employer_admin"
  | "clinic_admin"
  | "super_admin"
  | "partner";

export type RoleAwareProfile = {
  role?: string | null;
  onboarding_complete?: boolean | null;
};

export const patientRoutePrefixes = [
  "/dashboard",
  "/appointments",
  "/consultations",
  "/symptoms",
  "/cycle",
  "/fertility",
  "/pregnancy",
  "/records",
  "/messages",
  "/care-plans",
  "/education",
  "/support-groups",
  "/wellness",
  "/referrals",
  "/insurance",
  "/settings",
] as const;

export function isRoleOnboardingExempt(role?: string | null) {
  return Boolean(
    role &&
      role !== "patient" &&
      ["provider", "employer_admin", "clinic_admin", "super_admin", "partner"].includes(role),
  );
}

export function getAuthenticatedRedirectPath(profile: RoleAwareProfile | null) {
  if (profile?.role === "patient") {
    return profile.onboarding_complete ? "/dashboard" : "/onboarding";
  }

  if (profile?.role === "provider") {
    return "/provider/dashboard";
  }

  if (profile?.role === "employer_admin") {
    return "/employer/dashboard";
  }

  if (profile?.role === "clinic_admin") {
    return "/clinic/dashboard";
  }

  if (profile?.role === "super_admin") {
    return "/super/dashboard";
  }

  if (profile?.role === "partner") {
    return "/partner/dashboard";
  }

  return profile?.onboarding_complete ? "/dashboard" : "/dashboard";
}
