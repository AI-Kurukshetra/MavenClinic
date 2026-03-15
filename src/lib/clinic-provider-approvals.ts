import { requireClinicAdminAccess } from "@/lib/clinic-admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/utils";

export type ClinicManagedProvider = {
  id: string;
  profileId: string | null;
  name: string;
  email: string;
  avatarUrl: string | null;
  specialty: string;
  status: "Active and accepting" | "Inactive" | "Pending approval" | "Rejected" | "Suspended";
  rating: number;
  totalReviews: number;
  patients: number;
  joinedDate: string;
  bio: string | null;
  licenseNumber: string | null;
  approvalStatus: "pending" | "approved" | "rejected";
  rejectionReason: string | null;
  suspendedReason: string | null;
};

export type ClinicPendingApproval = {
  id: string;
  profileId: string | null;
  name: string;
  email: string;
  specialty: string;
  licenseNumber: string | null;
  bio: string | null;
  appliedDate: string;
};

export type ClinicProvidersManagementData = {
  providers: ClinicManagedProvider[];
  pendingApprovals: ClinicPendingApproval[];
  pendingCount: number;
};

type ProviderRow = {
  id: string;
  profile_id: string | null;
  specialty: string;
  license_number: string | null;
  bio: string | null;
  accepting_patients: boolean | null;
  approval_status: string | null;
  rejection_reason: string | null;
  suspended: boolean | null;
  suspended_reason: string | null;
  rating: number | null;
  total_reviews: number | null;
};

function formatSpecialty(value: string | null | undefined) {
  return value ? value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase()) : "General";
}

function getProviderStatus(provider: ProviderRow): ClinicManagedProvider["status"] {
  if (provider.suspended) {
    return "Suspended";
  }

  if ((provider.approval_status ?? "pending") === "pending") {
    return "Pending approval";
  }

  if ((provider.approval_status ?? "pending") === "rejected") {
    return "Rejected";
  }

  if (provider.accepting_patients) {
    return "Active and accepting";
  }

  return "Inactive";
}

async function getProviderRows() {
  const admin = getSupabaseAdminClient();
  const primaryResult = await admin
    .from("providers")
    .select("id, profile_id, specialty, license_number, bio, accepting_patients, approval_status, rejection_reason, suspended, suspended_reason, rating, total_reviews")
    .order("specialty", { ascending: true });

  if (!primaryResult.error) {
    return (primaryResult.data ?? []) as unknown as ProviderRow[];
  }

  if (!primaryResult.error.message.includes("approval_status")) {
    throw new Error(primaryResult.error.message);
  }

  const fallbackResult = await admin
    .from("providers")
    .select("id, profile_id, specialty, license_number, bio, accepting_patients, suspended, suspended_reason, rating, total_reviews")
    .order("specialty", { ascending: true });

  if (fallbackResult.error) {
    throw new Error(fallbackResult.error.message);
  }

  return ((fallbackResult.data ?? []) as Array<{
    id: string;
    profile_id: string | null;
    specialty: string;
    license_number: string | null;
    bio: string | null;
    accepting_patients: boolean | null;
    suspended: boolean | null;
    suspended_reason: string | null;
    rating: number | null;
    total_reviews: number | null;
  }>).map((provider) => ({
    ...provider,
    approval_status: provider.accepting_patients ? "approved" : "pending",
    rejection_reason: null,
  }));
}

export async function getClinicProvidersManagementData(): Promise<ClinicProvidersManagementData> {
  await requireClinicAdminAccess();
  const admin = getSupabaseAdminClient();

  const [providers, appointmentsResult, profilesResult, authUsersResult] = await Promise.all([
    getProviderRows(),
    admin
      .from("appointments")
      .select("provider_id, patient_id"),
    admin
      .from("profiles")
      .select("id, full_name, avatar_url, created_at")
      .in("role", ["provider", "clinic_admin", "super_admin", "patient"]),
    admin.auth.admin.listUsers({ page: 1, perPage: 500 }),
  ]);

  if (appointmentsResult.error) throw new Error(appointmentsResult.error.message);
  if (profilesResult.error) throw new Error(profilesResult.error.message);
  if (authUsersResult.error) throw new Error(authUsersResult.error.message);

  const appointments = (appointmentsResult.data ?? []) as Array<{ provider_id: string | null; patient_id: string | null }>;
  const profiles = (profilesResult.data ?? []) as Array<{ id: string; full_name: string | null; avatar_url: string | null; created_at: string | null }>;
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
  const emailMap = new Map((authUsersResult.data.users ?? []).map((user) => [user.id, user.email ?? "No email on file"]));
  const patientCountByProvider = new Map<string, Set<string>>();

  for (const appointment of appointments) {
    if (!appointment.provider_id || !appointment.patient_id) continue;
    const set = patientCountByProvider.get(appointment.provider_id) ?? new Set<string>();
    set.add(appointment.patient_id);
    patientCountByProvider.set(appointment.provider_id, set);
  }

  const items: ClinicManagedProvider[] = providers.map((provider) => {
    const profile = provider.profile_id ? profileMap.get(provider.profile_id) : undefined;
    return {
      id: provider.id,
      profileId: provider.profile_id,
      name: profile?.full_name ?? `${formatSpecialty(provider.specialty)} specialist`,
      email: provider.profile_id ? emailMap.get(provider.profile_id) ?? "No email on file" : "No email on file",
      avatarUrl: profile?.avatar_url ?? null,
      specialty: formatSpecialty(provider.specialty),
      status: getProviderStatus(provider),
      rating: Number(provider.rating ?? 0),
      totalReviews: Number(provider.total_reviews ?? 0),
      patients: patientCountByProvider.get(provider.id)?.size ?? 0,
      joinedDate: profile?.created_at ? formatDate(profile.created_at, "MMM d, yyyy") : "Unknown",
      bio: provider.bio,
      licenseNumber: provider.license_number,
      approvalStatus: provider.approval_status === "rejected" ? "rejected" : provider.approval_status === "approved" ? "approved" : "pending",
      rejectionReason: provider.rejection_reason ?? null,
      suspendedReason: provider.suspended_reason ?? null,
    };
  });

  const pendingApprovals: ClinicPendingApproval[] = items
    .filter((provider) => provider.approvalStatus === "pending")
    .map((provider) => ({
      id: provider.id,
      profileId: provider.profileId,
      name: provider.name,
      email: provider.email,
      specialty: provider.specialty,
      licenseNumber: provider.licenseNumber,
      bio: provider.bio,
      appliedDate: provider.joinedDate,
    }));

  return {
    providers: items,
    pendingApprovals,
    pendingCount: pendingApprovals.length,
  };
}