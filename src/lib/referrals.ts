import { getCurrentProfile, getCurrentUser } from "@/lib/auth";
import { type PatientReferralsPageData, type ProviderReferralListItem, type ProviderReferralsPageData, type ReferralPayload, formatReferralSpecialty } from "@/lib/referral-shared";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type ReferralRow = {
  id: string;
  patient_id: string | null;
  referring_provider_id: string | null;
  referred_to_provider_id: string | null;
  referred_to_specialty: string | null;
  reason: string | null;
  urgency: string | null;
  status: string | null;
  clinical_notes: string | null;
  created_at: string | null;
};

function getAdminClientSafe() {
  try {
    return getSupabaseAdminClient();
  } catch (error) {
    console.error("Referrals admin client unavailable:", error);
    return null;
  }
}
type ProviderRow = {
  id: string;
  profile_id: string | null;
  specialty: string;
  accepting_patients: boolean | null;
  suspended: boolean | null;
};

function coerceReferralStatus(value: string | null): ProviderReferralListItem["status"] {
  if (value === "accepted" || value === "completed" || value === "cancelled") {
    return value;
  }
  return "pending";
}

function coerceReferralUrgency(value: string | null): ProviderReferralListItem["urgency"] {
  if (value === "urgent" || value === "emergency") {
    return value;
  }
  return "routine";
}

async function getProviderContext() {
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();

  if (!user || profile?.role !== "provider") {
    throw new Error("Authenticated provider required.");
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("providers")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.id) {
    throw new Error("Provider record not found.");
  }

  return {
    userId: user.id,
    providerId: data.id as string,
    providerName: profile?.full_name ?? user.user_metadata?.full_name ?? "Maven provider",
  };
}

function mapReferralRow(
  row: ReferralRow,
  patientMap: Map<string, { name: string; avatarUrl: string | null }>,
  providerMap: Map<string, { name: string; specialty: string }>,
): ProviderReferralListItem {
  const referredProvider = row.referred_to_provider_id ? providerMap.get(row.referred_to_provider_id) : undefined;

  return {
    id: row.id,
    patientId: row.patient_id ?? "",
    patientName: row.patient_id ? patientMap.get(row.patient_id)?.name ?? "Patient" : "Patient",
    patientAvatarUrl: row.patient_id ? patientMap.get(row.patient_id)?.avatarUrl ?? null : null,
    referredToSpecialty: referredProvider?.specialty ?? formatReferralSpecialty(row.referred_to_specialty),
    referredToSpecialtyKey: row.referred_to_specialty ?? referredProvider?.specialty.toLowerCase().replaceAll(" ", "_") ?? "general",
    referredToProviderId: row.referred_to_provider_id,
    referredToProviderName: referredProvider?.name ?? null,
    reason: row.reason ?? "Clinical referral requested.",
    urgency: coerceReferralUrgency(row.urgency),
    status: coerceReferralStatus(row.status),
    clinicalNotes: row.clinical_notes ?? null,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

export async function getProviderReferralsPageData(): Promise<ProviderReferralsPageData> {
  const { providerId, providerName } = await getProviderContext();
  const admin = getSupabaseAdminClient();

  const [referralsResult, appointmentsResult, providersResult] = await Promise.all([
    admin
      .from("referrals")
      .select("id, patient_id, referring_provider_id, referred_to_provider_id, referred_to_specialty, reason, urgency, status, clinical_notes, created_at")
      .eq("referring_provider_id", providerId)
      .order("created_at", { ascending: false }),
    admin
      .from("appointments")
      .select("patient_id, scheduled_at")
      .eq("provider_id", providerId)
      .order("scheduled_at", { ascending: false }),
    admin
      .from("providers")
      .select("id, profile_id, specialty, accepting_patients, suspended")
      .eq("accepting_patients", true),
  ]);

  if (referralsResult.error) {
    throw new Error(referralsResult.error.message);
  }
  if (appointmentsResult.error) {
    throw new Error(appointmentsResult.error.message);
  }
  if (providersResult.error) {
    throw new Error(providersResult.error.message);
  }

  const referralRows = (referralsResult.data ?? []) as ReferralRow[];
  const appointmentRows = (appointmentsResult.data ?? []) as Array<{ patient_id: string | null; scheduled_at: string }>;
  const providerRows = ((providersResult.data ?? []) as ProviderRow[]).filter((provider) => !provider.suspended);

  const patientIds = Array.from(new Set([
    ...referralRows.map((row) => row.patient_id).filter((value): value is string => Boolean(value)),
    ...appointmentRows.map((row) => row.patient_id).filter((value): value is string => Boolean(value)),
  ]));
  const providerProfileIds = Array.from(new Set(providerRows.map((provider) => provider.profile_id).filter((value): value is string => Boolean(value))));

  const [patientProfilesResult, providerProfilesResult] = await Promise.all([
    patientIds.length ? admin.from("profiles").select("id, full_name, avatar_url").in("id", patientIds) : Promise.resolve({ data: [], error: null }),
    providerProfileIds.length ? admin.from("profiles").select("id, full_name").in("id", providerProfileIds) : Promise.resolve({ data: [], error: null }),
  ]);

  if (patientProfilesResult.error) {
    throw new Error(patientProfilesResult.error.message);
  }
  if (providerProfilesResult.error) {
    throw new Error(providerProfilesResult.error.message);
  }

  const patientMap = new Map((patientProfilesResult.data ?? []).map((profile) => [profile.id, { name: profile.full_name ?? "Patient", avatarUrl: profile.avatar_url ?? null }]));
  const providerProfileMap = new Map((providerProfilesResult.data ?? []).map((profile) => [profile.id, profile.full_name ?? "Maven provider"]));
  const providerMap = new Map(providerRows.map((provider) => [provider.id, { name: provider.profile_id ? providerProfileMap.get(provider.profile_id) ?? "Maven provider" : "Maven provider", specialty: formatReferralSpecialty(provider.specialty) }]));

  const lastVisitByPatient = new Map<string, string>();
  for (const row of appointmentRows) {
    if (row.patient_id && !lastVisitByPatient.has(row.patient_id)) {
      lastVisitByPatient.set(row.patient_id, row.scheduled_at);
    }
  }

  return {
    providerName,
    referrals: referralRows.map((row) => mapReferralRow(row, patientMap, providerMap)),
    patients: patientIds.map((patientId) => ({
      id: patientId,
      name: patientMap.get(patientId)?.name ?? "Patient",
      avatarUrl: patientMap.get(patientId)?.avatarUrl ?? null,
      lastVisit: lastVisitByPatient.get(patientId) ?? new Date().toISOString(),
    })),
    providers: providerRows.map((provider) => ({
      id: provider.id,
      name: provider.profile_id ? providerProfileMap.get(provider.profile_id) ?? "Maven provider" : "Maven provider",
      specialty: formatReferralSpecialty(provider.specialty),
      specialtyKey: provider.specialty,
    })),
  };
}

export async function getPatientReferralsPageData(): Promise<PatientReferralsPageData> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Authenticated patient required.");
  }

  const supabase = await getSupabaseServerClient();
  const admin = getAdminClientSafe();
  const { data, error } = await supabase
    .from("referrals")
    .select("id, patient_id, referring_provider_id, referred_to_provider_id, referred_to_specialty, reason, urgency, status, clinical_notes, created_at")
    .eq("patient_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const referralRows = (data ?? []) as ReferralRow[];
  const providerIds = Array.from(new Set(referralRows.flatMap((row) => [row.referring_provider_id, row.referred_to_provider_id]).filter((value): value is string => Boolean(value))));
  const providersResult = providerIds.length
    ? await (admin ?? supabase).from("providers").select("id, profile_id, specialty").in("id", providerIds)
    : { data: [], error: null };

  if (providersResult.error) {
    throw new Error(providersResult.error.message);
  }

  const providerRows = (providersResult.data ?? []) as Array<{ id: string; profile_id: string | null; specialty: string }>;
  const profileIds = Array.from(new Set(providerRows.map((provider) => provider.profile_id).filter((value): value is string => Boolean(value))));
  const profilesResult = profileIds.length
    ? await (admin ?? supabase).from("profiles").select("id, full_name").in("id", profileIds)
    : { data: [], error: null };

  if (profilesResult.error) {
    throw new Error(profilesResult.error.message);
  }

  const profileMap = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile.full_name ?? "Maven provider"]));
  const providerMap = new Map(providerRows.map((provider) => [provider.id, { name: provider.profile_id ? profileMap.get(provider.profile_id) ?? "Maven provider" : "Maven provider", specialty: formatReferralSpecialty(provider.specialty) }]));

  return {
    referrals: referralRows.map((row) => ({
      id: row.id,
      referringProviderName: row.referring_provider_id ? providerMap.get(row.referring_provider_id)?.name ?? "Maven provider" : "Maven provider",
      referringProviderSpecialty: row.referring_provider_id ? providerMap.get(row.referring_provider_id)?.specialty ?? "Care team" : "Care team",
      referredToSpecialty: row.referred_to_provider_id ? providerMap.get(row.referred_to_provider_id)?.specialty ?? formatReferralSpecialty(row.referred_to_specialty) : formatReferralSpecialty(row.referred_to_specialty),
      referredToSpecialtyKey: row.referred_to_specialty ?? "general",
      referredToProviderName: row.referred_to_provider_id ? providerMap.get(row.referred_to_provider_id)?.name ?? null : null,
      reason: row.reason ?? "Clinical referral requested.",
      urgency: coerceReferralUrgency(row.urgency),
      status: coerceReferralStatus(row.status),
      createdAt: row.created_at ?? new Date().toISOString(),
    })),
  };
}

export async function createReferral(payload: ReferralPayload) {
  const { providerId, providerName, userId } = await getProviderContext();
  const admin = getSupabaseAdminClient();

  const { data: patientAppointment, error: patientAppointmentError } = await admin
    .from("appointments")
    .select("id")
    .eq("provider_id", providerId)
    .eq("patient_id", payload.patientId)
    .limit(1)
    .maybeSingle();

  if (patientAppointmentError) {
    throw new Error(patientAppointmentError.message);
  }

  if (!patientAppointment?.id) {
    throw new Error("Select a patient from your active roster.");
  }

  if (payload.referredToProviderId) {
    const { data: referredProvider, error: referredProviderError } = await admin
      .from("providers")
      .select("id, specialty, accepting_patients, suspended")
      .eq("id", payload.referredToProviderId)
      .maybeSingle();

    if (referredProviderError) {
      throw new Error(referredProviderError.message);
    }

    if (!referredProvider?.id || referredProvider.suspended || !referredProvider.accepting_patients) {
      throw new Error("Choose an active provider for this referral.");
    }

    if (referredProvider.specialty !== payload.referredToSpecialty) {
      throw new Error("Selected provider does not match the referral specialty.");
    }
  }

  const insertPayload = {
    patient_id: payload.patientId,
    referring_provider_id: providerId,
    referred_to_provider_id: payload.referredToProviderId ?? null,
    referred_to_specialty: payload.referredToSpecialty,
    reason: payload.reason,
    urgency: payload.urgency,
    status: "pending",
    clinical_notes: payload.clinicalNotes ?? null,
  };

  const { data: referral, error } = await admin
    .from("referrals")
    .insert(insertPayload)
    .select("id, patient_id, referring_provider_id, referred_to_provider_id, referred_to_specialty, reason, urgency, status, clinical_notes, created_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await admin.from("notifications").insert({
    recipient_id: payload.patientId,
    actor_id: userId,
    type: "referral_created",
    title: `New referral from Dr. ${providerName}`,
    body: `You have been referred to a ${formatReferralSpecialty(payload.referredToSpecialty)} specialist.`,
    link: "/referrals",
  });

  const [patientProfileResult, providerRowsResult, providerProfilesResult] = await Promise.all([
    admin.from("profiles").select("id, full_name, avatar_url").eq("id", payload.patientId).maybeSingle(),
    admin.from("providers").select("id, profile_id, specialty").in("id", [providerId, ...(payload.referredToProviderId ? [payload.referredToProviderId] : [])]),
    admin.from("profiles").select("id, full_name").in("id", [userId]),
  ]);

  if (patientProfileResult.error) {
    throw new Error(patientProfileResult.error.message);
  }
  if (providerRowsResult.error) {
    throw new Error(providerRowsResult.error.message);
  }
  if (providerProfilesResult.error) {
    throw new Error(providerProfilesResult.error.message);
  }

  const providerRows = (providerRowsResult.data ?? []) as Array<{ id: string; profile_id: string | null; specialty: string }>;
  const extraProfileIds = providerRows.map((row) => row.profile_id).filter((value): value is string => Boolean(value));
  const extraProfilesResult = extraProfileIds.length
    ? await admin.from("profiles").select("id, full_name").in("id", extraProfileIds)
    : { data: [], error: null };

  if (extraProfilesResult.error) {
    throw new Error(extraProfilesResult.error.message);
  }

  const patientMap = new Map<string, { name: string; avatarUrl: string | null }>();
  if (patientProfileResult.data?.id) {
    patientMap.set(patientProfileResult.data.id, {
      name: patientProfileResult.data.full_name ?? "Patient",
      avatarUrl: patientProfileResult.data.avatar_url ?? null,
    });
  }
  const providerProfileMap = new Map((extraProfilesResult.data ?? []).map((profile) => [profile.id, profile.full_name ?? "Maven provider"]));
  const providerMap = new Map(providerRows.map((provider) => [provider.id, { name: provider.profile_id ? providerProfileMap.get(provider.profile_id) ?? "Maven provider" : "Maven provider", specialty: formatReferralSpecialty(provider.specialty) }]));

  return mapReferralRow(referral as ReferralRow, patientMap, providerMap);
}

