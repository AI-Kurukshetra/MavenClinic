import { addDays, differenceInCalendarDays, endOfDay, startOfDay, subDays } from "date-fns";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth";
import { generateAiInsight } from "@/lib/ai";
import { formatAvailabilityDay } from "@/lib/appointments";
import {
  mockAppointments,
  mockCycleLogs,
  mockMessages,
  mockProfile,
  mockProviders,
  mockSymptomLogs,
} from "@/lib/mock-data";
import { normalizeCarePlanMilestones, getCarePlanDateRange, getCarePlanProgress, type ProviderCarePlanMilestoneInput } from '@/lib/care-plans';
import { mapEducationArticle, type EducationArticleRow } from '@/lib/education';
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Appointment, CycleLog, LabResult, MessageThread, Prescription, Provider, RecordItem, SymptomLog } from "@/types/domain";

type ProviderDashboardStats = {
  totalAppointments: number;
  pendingMessages: number;
  activePatients: number;
};

type ProviderDashboardPatient = {
  id: string;
  name: string;
  lastVisit: string;
  carePlan: string;
  carePlanStatus: string;
  reason: string;
};

type ProviderAvailabilitySlot = {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  location: string;
};

type ProviderDashboardAppointment = {
  id: string;
  patientId: string;
  patientName: string;
  scheduledAt: string;
  chiefComplaint: string;
  status: Appointment["status"];
  type: Appointment["type"];
};

export type ProviderCarePlanListItem = {
  id: string;
  patientId: string;
  patientName: string;
  patientAvatarUrl: string | null;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  startDate: string;
  endDate: string | null;
  completedMilestones: number;
  totalMilestones: number;
  progress: number;
  milestones: ProviderCarePlanMilestoneInput[];
};

export type ProviderCarePlanPatientOption = {
  id: string;
  name: string;
  avatarUrl: string | null;
  lastVisit: string;
};

export type ProviderCarePlanTemplateOption = {
  id: string;
  title: string;
  description: string;
  milestones: ProviderCarePlanMilestoneInput[];
};

export type ProviderCarePlansPageData = {
  plans: ProviderCarePlanListItem[];
  patients: ProviderCarePlanPatientOption[];
  templates: ProviderCarePlanTemplateOption[];
};

function normalizeSymptoms(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (value && typeof value === "object" && Array.isArray((value as { selected?: unknown }).selected)) {
    return (value as { selected: unknown[] }).selected.filter((item): item is string => typeof item === "string");
  }

  return [];
}

async function getProviderMap(ids?: string[]): Promise<Map<string, Provider>> {
  const supabase = await getSupabaseServerClient();
  let query = supabase
    .from("providers")
    .select("id, specialty, bio, languages, accepting_patients, consultation_fee_cents, rating, total_reviews, profile_id");

  if (ids?.length) {
    query = query.in("id", ids);
  }

  const { data, error } = await query;

  if (error || !data) {
    return new Map();
  }

  const profileIds = data.map((provider) => provider.profile_id).filter((value): value is string => Boolean(value));
  const profileResult = await (async () => {
    if (!profileIds.length) {
      return { data: [] as Array<{ id: string; full_name: string | null; avatar_url: string | null }> };
    }

    try {
      return await getSupabaseAdminClient().from("profiles").select("id, full_name, avatar_url").in("id", profileIds);
    } catch {
      return await supabase.from("profiles").select("id, full_name, avatar_url").in("id", profileIds);
    }
  })();
  const profileMap = new Map((profileResult.data ?? []).map((profile) => [profile.id, profile]));

  return new Map(
    data.map((provider) => {
      const profile = provider.profile_id ? profileMap.get(provider.profile_id) : undefined;
      const specialtyLabel = formatProviderSpecialtyLabel(provider.specialty);

      return [
        provider.id,
        {
          id: provider.id,
          profileId: provider.profile_id ?? undefined,
          fullName: profile?.full_name ?? `${specialtyLabel} specialist`,
          specialty: (provider.specialty ?? "general") as Provider["specialty"],
          specialtyLabel,
          bio: provider.bio ?? "Maven provider",
          languages: provider.languages ?? ["English"],
          acceptingPatients: provider.accepting_patients ?? true,
          consultationFeeCents: provider.consultation_fee_cents ?? 0,
          rating: Number(provider.rating ?? 5),
          totalReviews: provider.total_reviews ?? 0,
          avatarUrl: profile?.avatar_url ?? undefined,
          nextAvailable: [addDays(new Date(), 1).toISOString(), addDays(new Date(), 2).toISOString()],
        } satisfies Provider,
      ];
    }),
  );
}

function createStarterMessageThread(conversationId: string): MessageThread {
  return {
    id: conversationId,
    providerName: "Care team",
    providerSpecialty: "Secure messaging",
    unreadCount: 0,
    lastMessagePreview: "Start a conversation with your care team.",
    updatedAt: new Date().toISOString(),
    messages: [],
  };
}

function formatProviderSpecialtyLabel(value?: string | null) {
  return value ? value.replaceAll("_", " ").replace(/\b\w/g, (char: string) => char.toUpperCase()) : "Care team";
}

function mapCycleLogRow(log: {
  id: string;
  period_start: string;
  period_end: string | null;
  cycle_length: number | null;
  flow_intensity: CycleLog["flowIntensity"] | null;
  symptoms: unknown;
  ovulation_date: string | null;
  fertile_window_start: string | null;
  fertile_window_end: string | null;
  notes: string | null;
}): CycleLog {
  return {
    id: log.id,
    periodStart: log.period_start,
    periodEnd: log.period_end ?? log.period_start,
    cycleLength: log.cycle_length ?? 28,
    flowIntensity: log.flow_intensity ?? "medium",
    symptoms: normalizeSymptoms(log.symptoms),
    ovulationDate: log.ovulation_date ?? undefined,
    fertileWindowStart: log.fertile_window_start ?? undefined,
    fertileWindowEnd: log.fertile_window_end ?? undefined,
    notes: log.notes ?? undefined,
  };
}

function mapSymptomLogRow(log: {
  id: string;
  logged_at: string;
  symptoms: unknown;
  mood: number | null;
  energy: number | null;
  pain_level: number | null;
  sleep_hours: number | null;
  notes: string | null;
  ai_insight: string | null;
}): SymptomLog {
  return {
    id: log.id,
    loggedAt: log.logged_at,
    symptoms: normalizeSymptoms(log.symptoms),
    mood: log.mood ?? 0,
    energy: log.energy ?? 0,
    painLevel: log.pain_level ?? 0,
    sleepHours: typeof log.sleep_hours === "number" ? log.sleep_hours : undefined,
    notes: log.notes ?? undefined,
    aiInsight: log.ai_insight ?? undefined,
  };
}

function parseCarePlan(carePlan: {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  milestones: unknown;
} | null) {
  if (!carePlan) {
    return null;
  }

  const milestones = Array.isArray(carePlan.milestones)
    ? carePlan.milestones.map((milestone: Record<string, unknown>) => ({
        title: String(milestone.title ?? "Milestone"),
        description: String(milestone.description ?? ""),
        targetDate: String(milestone.targetDate ?? new Date().toISOString()),
        completed: Boolean(milestone.completed),
        category: String(milestone.category ?? "general"),
      }))
    : [];

  const progress = milestones.length
    ? Math.round((milestones.filter((item) => item.completed).length / milestones.length) * 100)
    : 0;

  return {
    id: carePlan.id,
    title: carePlan.title,
    description: carePlan.description ?? "Care plan",
    status: carePlan.status ?? "active",
    milestones,
    progress,
  };
}


type PatientCarePlanPageMilestone = {
  index: number;
  title: string;
  description: string;
  targetDate: string;
  completed: boolean;
  category: string;
};

type PatientCarePlanPageData = {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  startDate: string;
  endDate?: string;
  progress: number;
  completedMilestones: number;
  totalMilestones: number;
  provider: {
    id: string;
    name: string;
    avatarUrl?: string;
    specialty: string;
  };
  milestones: PatientCarePlanPageMilestone[];
};

function parseCarePlanPageMilestones(value: unknown): PatientCarePlanPageMilestone[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((milestone, index) => {
    const item = milestone as Record<string, unknown>;
    return {
      index,
      title: String(item.title ?? `Milestone ${index + 1}`),
      description: String(item.description ?? ""),
      targetDate: String(item.targetDate ?? new Date().toISOString()),
      completed: Boolean(item.completed),
      category: String(item.category ?? "general"),
    } satisfies PatientCarePlanPageMilestone;
  });
}

function mapPatientCarePlanPageData(
  carePlan: {
    id: string;
    provider_id: string | null;
    title: string;
    description: string | null;
    status: string | null;
    milestones: unknown;
    created_at: string | null;
    start_date?: string | null;
    end_date?: string | null;
  },
  providerMap: Map<string, Provider>,
): PatientCarePlanPageData {
  const milestones = parseCarePlanPageMilestones(carePlan.milestones);
  const { completedMilestones, totalMilestones, progress } = getCarePlanProgress(milestones);
  const provider = carePlan.provider_id ? providerMap.get(carePlan.provider_id) : undefined;
  const { startDate, endDate } = getCarePlanDateRange({
    createdAt: carePlan.created_at,
    startDate: carePlan.start_date ?? null,
    endDate: carePlan.end_date ?? null,
    milestones,
  });

  return {
    id: carePlan.id,
    title: carePlan.title,
    description: carePlan.description ?? "Your provider has outlined the next steps for this plan.",
    status: carePlan.status ?? "active",
    createdAt: carePlan.created_at ?? new Date().toISOString(),
    startDate,
    endDate: endDate ?? undefined,
    progress,
    completedMilestones,
    totalMilestones,
    provider: {
      id: carePlan.provider_id ?? "unknown-provider",
      name: provider?.fullName ?? "Maven provider",
      avatarUrl: provider?.avatarUrl,
      specialty: provider?.specialtyLabel ?? "Care team",
    },
    milestones,
  };
}
async function getCurrentProviderRecord() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Authenticated provider required.");
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("providers")
    .select("id, profile_id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Provider record not found.");
  }

  return { userId: user.id, providerId: data.id };
}

type CarePlanRowWithDates = {
  id: string;
  patient_id: string | null;
  provider_id: string | null;
  title: string;
  description: string | null;
  status: string | null;
  milestones: unknown;
  created_at: string | null;
  start_date?: string | null;
  end_date?: string | null;
};

function isMissingCarePlanDateColumnError(error: { message?: string } | null) {
  return Boolean(error?.message?.includes("start_date") || error?.message?.includes("end_date"));
}

function coerceCarePlanRow(value: Record<string, unknown>): CarePlanRowWithDates {
  return {
    id: String(value.id ?? ""),
    patient_id: typeof value.patient_id === "string" ? value.patient_id : null,
    provider_id: typeof value.provider_id === "string" ? value.provider_id : null,
    title: String(value.title ?? "Care plan"),
    description: typeof value.description === "string" ? value.description : null,
    status: typeof value.status === "string" ? value.status : null,
    milestones: value.milestones,
    created_at: typeof value.created_at === "string" ? value.created_at : null,
    start_date: typeof value.start_date === "string" ? value.start_date : null,
    end_date: typeof value.end_date === "string" ? value.end_date : null,
  };
}

function mapProviderCarePlanListItem(
  carePlan: CarePlanRowWithDates,
  patientMap: Map<string, { name: string; avatarUrl: string | null }>,
): ProviderCarePlanListItem {
  const milestones = normalizeCarePlanMilestones(carePlan.milestones, carePlan.created_at ?? new Date().toISOString());
  const { completedMilestones, totalMilestones, progress } = getCarePlanProgress(milestones);
  const { startDate, endDate } = getCarePlanDateRange({
    createdAt: carePlan.created_at,
    startDate: carePlan.start_date ?? null,
    endDate: carePlan.end_date ?? null,
    milestones,
  });
  const patient = carePlan.patient_id ? patientMap.get(carePlan.patient_id) : undefined;

  return {
    id: carePlan.id,
    patientId: carePlan.patient_id ?? "",
    patientName: patient?.name ?? "Patient",
    patientAvatarUrl: patient?.avatarUrl ?? null,
    title: carePlan.title,
    description: carePlan.description ?? "Care plan",
    status: carePlan.status ?? "active",
    createdAt: carePlan.created_at ?? new Date().toISOString(),
    startDate,
    endDate,
    completedMilestones,
    totalMilestones,
    progress,
    milestones,
  };
}

async function getDashboardMessageThreads(userId: string): Promise<MessageThread[]> {
  const supabase = await getSupabaseServerClient();
  const admin = (() => {
    try {
      return getSupabaseAdminClient();
    } catch {
      return null;
    }
  })();
  const { data: conversations, error: conversationsError } = await supabase
    .from("conversations")
    .select("id, provider_profile_id")
    .eq("patient_id", userId)
    .order("created_at", { ascending: false });

  if (conversationsError || !conversations?.length) {
    return [];
  }

  const providerProfileIds = Array.from(
    new Set(
      conversations
        .map((conversation) => conversation.provider_profile_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const conversationIds = conversations.map((conversation) => conversation.id);

  const [providerProfilesResult, providerRowsResult, messageRowsResult] = await Promise.all([
    providerProfileIds.length
      ? (admin ?? supabase).from("profiles").select("id, full_name, avatar_url").in("id", providerProfileIds)
      : Promise.resolve({ data: [] as Array<{ id: string; full_name: string | null; avatar_url: string | null }>, error: null }),
    providerProfileIds.length
      ? (admin ?? supabase).from("providers").select("profile_id, specialty").in("profile_id", providerProfileIds)
      : Promise.resolve({ data: [] as Array<{ profile_id: string | null; specialty: string | null }>, error: null }),
    supabase
      .from("messages")
      .select("id, conversation_id, sender_id, content, read_at, created_at")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false }),
  ]);

  if (providerProfilesResult.error || providerRowsResult.error || messageRowsResult.error) {
    return [];
  }

  const profileMap = new Map((providerProfilesResult.data ?? []).map((profile) => [profile.id, profile]));
  const providerMetaMap = new Map(
    (providerRowsResult.data ?? [])
      .filter((provider): provider is { profile_id: string; specialty: string | null } => Boolean(provider.profile_id))
      .map((provider) => [provider.profile_id, provider]),
  );
  const unreadCountByConversation = new Map<string, number>();
  const lastMessageByConversation = new Map<
    string,
    { content: string; created_at: string | null }
  >();

  for (const message of messageRowsResult.data ?? []) {
    if (!lastMessageByConversation.has(message.conversation_id)) {
      lastMessageByConversation.set(message.conversation_id, {
        content: message.content,
        created_at: message.created_at,
      });
    }

    if (message.sender_id !== userId && !message.read_at) {
      unreadCountByConversation.set(
        message.conversation_id,
        (unreadCountByConversation.get(message.conversation_id) ?? 0) + 1,
      );
    }
  }

  return conversations.flatMap((conversation) => {
    const providerProfileId = conversation.provider_profile_id;
    const providerProfile = providerProfileId ? profileMap.get(providerProfileId) : undefined;
    const lastMessage = lastMessageByConversation.get(conversation.id);

    if (!providerProfile?.full_name || !lastMessage) {
      return [];
    }

    const providerMeta = providerProfileId ? providerMetaMap.get(providerProfileId) : undefined;

    return [
      {
        id: conversation.id,
        providerName: providerProfile.full_name,
        providerSpecialty: providerMeta ? formatProviderSpecialtyLabel(providerMeta.specialty) : "",
        avatarUrl: providerProfile.avatar_url ?? undefined,
        unreadCount: unreadCountByConversation.get(conversation.id) ?? 0,
        lastMessagePreview: lastMessage.content,
        updatedAt: lastMessage.created_at ?? new Date().toISOString(),
        messages: [],
      } satisfies MessageThread,
    ];
  });
}

async function getRealProfile(userId?: string) {
  const user = userId ? null : await getCurrentUser();
  const currentUserId = userId ?? user?.id;

  if (!currentUserId) {
    throw new Error("Authenticated patient required.");
  }

  const profile = await getCurrentProfile(currentUserId);
  const fullName = profile?.full_name ?? user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "Maven user";

  return {
    id: currentUserId,
    role: profile?.role ?? "patient",
    fullName,
    firstName: fullName.split(" ")[0] ?? fullName,
    onboardingComplete: Boolean(profile?.onboarding_complete),
  };
}

export async function getPatientDashboardData(userId?: string) {
  const currentUserId = userId ?? (await getCurrentUser())?.id;

  if (!currentUserId) {
    throw new Error("Authenticated patient required.");
  }

  const profile = await getRealProfile(currentUserId);
  const supabase = await getSupabaseServerClient();
  const symptomWindowStart = subDays(new Date(), 13).toISOString();

  const [nextAppointmentResult, latestCycleResult, symptomLogsResult, carePlanResult, messages] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, patient_id, provider_id, scheduled_at, duration_minutes, type, status, chief_complaint, video_room_url, notes")
      .eq("patient_id", currentUserId)
      .eq("status", "scheduled")
      .order("scheduled_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("cycle_logs")
      .select("id, period_start, period_end, cycle_length, flow_intensity, symptoms, ovulation_date, fertile_window_start, fertile_window_end, notes")
      .eq("patient_id", currentUserId)
      .order("period_start", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("symptom_logs")
      .select("id, logged_at, symptoms, mood, energy, pain_level, sleep_hours, notes, ai_insight")
      .eq("patient_id", currentUserId)
      .gte("logged_at", symptomWindowStart)
      .order("logged_at", { ascending: true }),
    supabase
      .from("care_plans")
      .select("id, title, description, status, milestones")
      .eq("patient_id", currentUserId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    getDashboardMessageThreads(currentUserId).catch(() => []),
  ]);

  const safeNextAppointmentRow = nextAppointmentResult.error ? null : nextAppointmentResult.data;
  const safeLatestCycleRow = latestCycleResult.error ? null : latestCycleResult.data;
  const safeSymptomLogRows = symptomLogsResult.error ? [] : symptomLogsResult.data ?? [];
  const safeCarePlanRow = carePlanResult.error ? null : carePlanResult.data;

  const appointmentProviderIds = safeNextAppointmentRow?.provider_id ? [safeNextAppointmentRow.provider_id] : [];
  const providerMap = appointmentProviderIds.length ? await getProviderMap(appointmentProviderIds) : new Map<string, Provider>();
  const nextAppointment = safeNextAppointmentRow
    ? (() => {
        const provider = providerMap.get(safeNextAppointmentRow.provider_id);

        if (!provider) {
          return null;
        }

        return {
          id: safeNextAppointmentRow.id,
          patientId: safeNextAppointmentRow.patient_id,
          providerId: safeNextAppointmentRow.provider_id,
          providerName: provider.fullName,
          providerSpecialty: provider.specialtyLabel,
          scheduledAt: safeNextAppointmentRow.scheduled_at,
          durationMinutes: safeNextAppointmentRow.duration_minutes ?? 30,
          type: safeNextAppointmentRow.type,
          status: safeNextAppointmentRow.status,
          chiefComplaint: safeNextAppointmentRow.chief_complaint ?? "General follow-up",
          videoRoomUrl: safeNextAppointmentRow.video_room_url ?? undefined,
          notes: safeNextAppointmentRow.notes ?? undefined,
        } satisfies Appointment;
      })()
    : null;

  const latestCycle = safeLatestCycleRow ? mapCycleLogRow(safeLatestCycleRow) : null;
  const cycleDay = latestCycle ? differenceInCalendarDays(new Date(), new Date(latestCycle.periodStart)) + 1 : 0;
  const cycleSummary = latestCycle
    ? {
        cycleDay,
        cycleLength: latestCycle.cycleLength,
        nextPeriod: addDays(new Date(latestCycle.periodStart), latestCycle.cycleLength).toISOString(),
        fertilityStatus: cycleDay >= 11 && cycleDay <= 16 ? "Fertile Window" : cycleDay === 14 ? "Ovulation Day" : "Period Expected",
        progress: Math.min(Math.round((cycleDay / latestCycle.cycleLength) * 100), 100),
      }
    : null;

  const symptomLogs = safeSymptomLogRows.map(mapSymptomLogRow);
  const latestSymptomLog = symptomLogs.at(-1) ?? null;
  const insightPayload = symptomLogs.map((log) => ({
    loggedAt: log.loggedAt,
    symptoms: log.symptoms,
    mood: log.mood,
    energy: log.energy,
    painLevel: log.painLevel,
    sleepHours: log.sleepHours,
    notes: log.notes,
  }));
    let aiInsight = latestSymptomLog?.aiInsight ?? null;

  if (!aiInsight && insightPayload.length) {
    try {
      aiInsight = await generateAiInsight("symptom_insight", insightPayload);
    } catch {
      aiInsight = null;
    }
  }

  return {
    profile,
    nextAppointment,
    cycleSummary,
    latestSymptomLog,
    aiInsight,
    insightPayload,
    carePlan: parseCarePlan(safeCarePlanRow),
    messages,
  };
}


export async function getPatientCarePlansPageData() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Authenticated patient required.");
  }

  const supabase = await getSupabaseServerClient();
  const primaryResult = await supabase
    .from("care_plans")
    .select("id, patient_id, provider_id, title, description, status, milestones, created_at, start_date, end_date")
    .eq("patient_id", user.id)
    .order("created_at", { ascending: false });

  const fallbackResult = isMissingCarePlanDateColumnError(primaryResult.error)
    ? await supabase
        .from("care_plans")
        .select("id, patient_id, provider_id, title, description, status, milestones, created_at")
        .eq("patient_id", user.id)
        .order("created_at", { ascending: false })
    : null;

  const error = fallbackResult ? fallbackResult.error : primaryResult.error;
  if (error) {
    throw new Error(error.message);
  }

  const carePlans = ((fallbackResult?.data ?? primaryResult.data ?? []) as Record<string, unknown>[]).map(coerceCarePlanRow);

  const providerIds = Array.from(
    new Set(
      carePlans
        .map((carePlan) => carePlan.provider_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const providerMap = providerIds.length ? await getProviderMap(providerIds) : new Map<string, Provider>();
  const plans = carePlans.map((carePlan) => mapPatientCarePlanPageData(carePlan, providerMap));
  const activePlan = plans.find((plan) => plan.status === "active") ?? null;
  const previousPlans = plans.filter((plan) => plan.id !== activePlan?.id);

  return {
    activePlan,
    previousPlans,
  };
}

type PatientPartnerSettingsData = {
  patientName: string;
  patientEmail: string;
  partner: {
    accessId: string;
    partnerId: string;
    name: string;
    email: string;
    accessLevel: string;
    accessLabel: string;
    grantedAt: string | null;
    avatarUrl?: string;
  } | null;
};

export async function getPatientSettingsPageData(): Promise<PatientPartnerSettingsData> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Authenticated patient required.");
  }

  const [profile, activePartnerAccess] = await Promise.all([
    getCurrentProfile(user.id),
    (async () => {
      const admin = getSupabaseAdminClient();
      const { data, error } = await admin
        .from("partner_access")
        .select("id, patient_id, partner_id, access_level, created_at, revoked_at")
        .eq("patient_id", user.id)
        .is("revoked_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      return data as {
        id: string;
        patient_id: string;
        partner_id: string;
        access_level: string;
        created_at: string | null;
        revoked_at: string | null;
      } | null;
    })(),
  ]);

  const patientName = profile?.full_name ?? user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Maven patient";
  const patientEmail = user.email ?? "";

  if (!activePartnerAccess) {
    return {
      patientName,
      patientEmail,
      partner: null,
    };
  }

  const admin = getSupabaseAdminClient();
  const [partnerProfileResult, partnerUserResult] = await Promise.all([
    admin
      .from("profiles")
      .select("id, full_name, avatar_url")
      .eq("id", activePartnerAccess.partner_id)
      .maybeSingle(),
    admin.auth.admin.getUserById(activePartnerAccess.partner_id),
  ]);

  if (partnerProfileResult.error) {
    throw new Error(partnerProfileResult.error.message);
  }

  const partnerProfile = partnerProfileResult.data as { id: string; full_name: string | null; avatar_url: string | null } | null;
  const partnerEmail = partnerUserResult.data.user?.email ?? "No email on file";
  const accessLabel =
    activePartnerAccess.access_level === "view_appointments"
      ? "Appointments only"
      : activePartnerAccess.access_level === "view_pregnancy"
        ? "Pregnancy journey"
        : activePartnerAccess.access_level === "view_fertility"
          ? "Fertility journey"
          : "Full access";

  return {
    patientName,
    patientEmail,
    partner: {
      accessId: activePartnerAccess.id,
      partnerId: activePartnerAccess.partner_id,
      name: partnerProfile?.full_name ?? partnerEmail.split("@")[0] ?? "Partner",
      email: partnerEmail,
      accessLevel: activePartnerAccess.access_level,
      accessLabel,
      grantedAt: activePartnerAccess.created_at,
      avatarUrl: partnerProfile?.avatar_url ?? undefined,
    },
  };
}
export async function getAppointmentsData() {
  const user = await getCurrentUser();
  const providerMap = await getProviderMap();
  const providers = Array.from(providerMap.values());

  if (!user) {
    return { appointments: mockAppointments, providers: providers.length ? providers : mockProviders };
  }

  const supabase = await getSupabaseServerClient();
  const { data } = await supabase.from("appointments").select("*").eq("patient_id", user.id).order("scheduled_at", { ascending: true });
  const appointments = data?.length
    ? data.map((appointment) => {
        const provider = providerMap.get(appointment.provider_id) ?? mockProviders[0];
        return {
          id: appointment.id,
          patientId: appointment.patient_id,
          providerId: appointment.provider_id,
          providerName: provider.fullName,
          providerSpecialty: provider.specialtyLabel,
          scheduledAt: appointment.scheduled_at,
          durationMinutes: appointment.duration_minutes ?? 30,
          type: appointment.type,
          status: appointment.status,
          chiefComplaint: appointment.chief_complaint ?? "General follow-up",
          videoRoomUrl: appointment.video_room_url ?? undefined,
          notes: appointment.notes ?? undefined,
        } satisfies Appointment;
      })
    : mockAppointments;

  return { appointments, providers: providers.length ? providers : mockProviders };
}

export async function getSymptomsData() {
  const user = await getCurrentUser();

  if (!user) {
    return { logs: mockSymptomLogs };
  }

  const supabase = await getSupabaseServerClient();
  const { data } = await supabase.from("symptom_logs").select("*").eq("patient_id", user.id).order("logged_at", { ascending: true }).limit(30);

  return {
    logs: data?.length ? data.map(mapSymptomLogRow) : mockSymptomLogs,
  };
}

export async function getCycleData() {
  const user = await getCurrentUser();

  if (!user) {
    return { logs: mockCycleLogs };
  }

  const supabase = await getSupabaseServerClient();
  const { data } = await supabase.from("cycle_logs").select("*").eq("patient_id", user.id).order("period_start", { ascending: true }).limit(12);

  return {
    logs: data?.length ? data.map(mapCycleLogRow) : mockCycleLogs,
  };
}

export async function getMessagesData() {
  const user = await getCurrentUser();

  if (!user) {
    return { threads: mockMessages, currentUserId: mockProfile.id };
  }

  const supabase = await getSupabaseServerClient();
  const { data } = await supabase.from("messages").select("*").order("created_at", { ascending: true }).limit(50);

  if (!data?.length) {
    return { threads: [createStarterMessageThread(user.id)], currentUserId: user.id };
  }

  const grouped = new Map<string, MessageThread>();

  data.forEach((message) => {
    const conversationId = String(message.conversation_id);
    const thread: MessageThread = grouped.get(conversationId) ?? {
      id: conversationId,
      providerName: "Care team",
      providerSpecialty: "Secure messaging",
      unreadCount: 0,
      lastMessagePreview: "",
      updatedAt: message.created_at,
      messages: [] as MessageThread["messages"],
    };

    thread.messages.push({
      id: message.id,
      sender: message.sender_id === user.id ? "patient" : "provider",
      content: message.content,
      createdAt: message.created_at,
    });
    thread.lastMessagePreview = message.content;
    thread.updatedAt = message.created_at;
    grouped.set(conversationId, thread);
  });

  return { threads: Array.from(grouped.values()).reverse(), currentUserId: user.id };
}

function normalizeLabMarkers(value: unknown): LabResult["markers"] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => ({
    label: String((item as { label?: unknown }).label ?? "Marker"),
    value: String((item as { value?: unknown }).value ?? "Pending"),
    flag: ["normal", "high", "low"].includes(String((item as { flag?: unknown }).flag ?? ""))
      ? (String((item as { flag?: unknown }).flag) as "normal" | "high" | "low")
      : undefined,
  }));
}

async function getProfileNameMap(ids: string[]) {
  if (!ids.length) {
    return new Map<string, string>();
  }

  const { data, error } = await getSupabaseAdminClient().from("profiles").select("id, full_name").in("id", ids);

  if (error) {
    throw new Error(error.message);
  }

  return new Map((data ?? []).map((profile) => [profile.id, profile.full_name ?? "Maven member"]));
}

export async function getRecordsData() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Authenticated patient required.");
  }

  const supabase = await getSupabaseServerClient();
  const admin = getSupabaseAdminClient();
  const [prescriptionsResult, labsResult] = await Promise.all([
    supabase
      .from("prescriptions")
      .select("id, medication_name, dosage, frequency, instructions, status, refills_remaining, prescribed_at, expires_at, provider_id")
      .eq("patient_id", user.id)
      .order("prescribed_at", { ascending: false }),
    supabase
      .from("lab_results")
      .select("id, panel_name, status, summary, markers, ordered_at, resulted_at, provider_id")
      .eq("patient_id", user.id)
      .in("status", ["resulted", "reviewed"])
      .order("ordered_at", { ascending: false }),
  ]);

  if (prescriptionsResult.error) {
    throw new Error(prescriptionsResult.error.message);
  }

  if (labsResult.error) {
    throw new Error(labsResult.error.message);
  }

  const providerIds = Array.from(new Set([
    ...(prescriptionsResult.data ?? []).map((item) => item.provider_id).filter(Boolean),
    ...(labsResult.data ?? []).map((item) => item.provider_id).filter(Boolean),
  ] as string[]));
  const providerRows = providerIds.length
    ? await admin.from("providers").select("id, profile_id").in("id", providerIds)
    : { data: [] as Array<{ id: string; profile_id: string | null }>, error: null };

  if (providerRows.error) {
    throw new Error(providerRows.error.message);
  }

  const providerProfileIds = ((providerRows.data ?? []) as Array<{ id: string; profile_id: string | null }>)
    .map((provider) => provider.profile_id)
    .filter((value): value is string => Boolean(value));
  const profileMap = await getProfileNameMap(providerProfileIds);
  const providerNameMap = new Map(
    ((providerRows.data ?? []) as Array<{ id: string; profile_id: string | null }>).map((provider) => [provider.id, provider.profile_id ? profileMap.get(provider.profile_id) ?? "Care team" : "Care team"]),
  );

  const prescriptions: Prescription[] = ((prescriptionsResult.data ?? []) as Array<{
    id: string;
    medication_name: string;
    dosage: string;
    frequency: string;
    instructions: string | null;
    status: string | null;
    refills_remaining: number | null;
    prescribed_at: string | null;
    expires_at: string | null;
    provider_id: string | null;
  }>).map((item) => ({
    id: item.id,
    medicationName: item.medication_name,
    dosage: item.dosage,
    frequency: item.frequency,
    instructions: item.instructions ?? "Take as directed by your provider.",
    status: (item.status ?? "active") as Prescription["status"],
    prescribedAt: item.prescribed_at ?? new Date().toISOString(),
    expiresAt: item.expires_at,
    refillsRemaining: item.refills_remaining ?? 0,
    providerName: item.provider_id ? providerNameMap.get(item.provider_id) ?? "Care team" : "Care team",
  }));

  const labs: LabResult[] = ((labsResult.data ?? []) as Array<{
    id: string;
    panel_name: string;
    status: string | null;
    summary: string | null;
    markers: unknown;
    ordered_at: string | null;
    resulted_at: string | null;
    provider_id: string | null;
  }>).map((item) => ({
    id: item.id,
    panelName: item.panel_name,
    status: (item.status ?? "ordered") as LabResult["status"],
    orderedAt: item.ordered_at ?? new Date().toISOString(),
    resultedAt: item.resulted_at,
    summary: item.summary ?? "Your provider has not added a summary yet.",
    markers: normalizeLabMarkers(item.markers),
    providerName: item.provider_id ? providerNameMap.get(item.provider_id) ?? "Care team" : "Care team",
  }));

  const records: RecordItem[] = [
    ...labs.map((lab) => ({
      id: 'lab-' + lab.id,
      title: lab.panelName,
      category: "Lab result",
      date: lab.resultedAt ?? lab.orderedAt,
      provider: lab.providerName,
      summary: lab.summary,
    })),
    ...prescriptions.map((prescription) => ({
      id: 'prescription-' + prescription.id,
      title: prescription.medicationName,
      category: "Prescription",
      date: prescription.prescribedAt,
      provider: prescription.providerName,
      summary: `${prescription.dosage} - ${prescription.frequency}`,
    })),
  ].sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());

  return { records, prescriptions, labs };
}

export async function getProviderPrescriptionsData() {
  const { providerId } = await getCurrentProviderRecord();
  const supabase = await getSupabaseServerClient();
  const [prescriptionsResult, patientsResult] = await Promise.all([
    supabase
      .from("prescriptions")
      .select("id, patient_id, medication_name, dosage, frequency, instructions, status, refills_remaining, prescribed_at, expires_at")
      .eq("provider_id", providerId)
      .order("prescribed_at", { ascending: false }),
    supabase
      .from("appointments")
      .select("patient_id")
      .eq("provider_id", providerId),
  ]);

  if (prescriptionsResult.error) {
    throw new Error(prescriptionsResult.error.message);
  }

  if (patientsResult.error) {
    throw new Error(patientsResult.error.message);
  }

  const patientIds = Array.from(new Set((patientsResult.data ?? []).map((item) => item.patient_id).filter(Boolean) as string[]));
  const patientNameMap = await getProfileNameMap(patientIds);
  const patients = patientIds.map((id) => ({ id, name: patientNameMap.get(id) ?? "Patient" }));
  const prescriptions: Prescription[] = ((prescriptionsResult.data ?? []) as Array<{
    id: string;
    patient_id: string | null;
    medication_name: string;
    dosage: string;
    frequency: string;
    instructions: string | null;
    status: string | null;
    refills_remaining: number | null;
    prescribed_at: string | null;
    expires_at: string | null;
  }>).map((item) => ({
    id: item.id,
    medicationName: item.medication_name,
    dosage: item.dosage,
    frequency: item.frequency,
    instructions: item.instructions ?? "Take as directed.",
    status: (item.status ?? "active") as Prescription["status"],
    prescribedAt: item.prescribed_at ?? new Date().toISOString(),
    expiresAt: item.expires_at,
    refillsRemaining: item.refills_remaining ?? 0,
    providerName: "You",
    patientName: item.patient_id ? patientNameMap.get(item.patient_id) ?? "Patient" : "Patient",
  }));

  return { prescriptions, patients };
}

export async function getProviderLabsData() {
  const { providerId } = await getCurrentProviderRecord();
  const supabase = await getSupabaseServerClient();
  const [labsResult, patientsResult] = await Promise.all([
    supabase
      .from("lab_results")
      .select("id, patient_id, panel_name, status, summary, markers, ordered_at, resulted_at")
      .eq("provider_id", providerId)
      .order("ordered_at", { ascending: false }),
    supabase
      .from("appointments")
      .select("patient_id")
      .eq("provider_id", providerId),
  ]);

  if (labsResult.error) {
    throw new Error(labsResult.error.message);
  }

  if (patientsResult.error) {
    throw new Error(patientsResult.error.message);
  }

  const patientIds = Array.from(new Set((patientsResult.data ?? []).map((item) => item.patient_id).filter(Boolean) as string[]));
  const patientNameMap = await getProfileNameMap(patientIds);
  const patients = patientIds.map((id) => ({ id, name: patientNameMap.get(id) ?? "Patient" }));
  const labs: LabResult[] = ((labsResult.data ?? []) as Array<{
    id: string;
    patient_id: string | null;
    panel_name: string;
    status: string | null;
    summary: string | null;
    markers: unknown;
    ordered_at: string | null;
    resulted_at: string | null;
  }>).map((item) => ({
    id: item.id,
    panelName: item.panel_name,
    status: (item.status ?? "ordered") as LabResult["status"],
    orderedAt: item.ordered_at ?? new Date().toISOString(),
    resultedAt: item.resulted_at,
    summary: item.summary ?? "Awaiting lab result summary.",
    markers: normalizeLabMarkers(item.markers),
    providerName: "You",
    patientName: item.patient_id ? patientNameMap.get(item.patient_id) ?? "Patient" : "Patient",
  }));

  return { labs, patients };
}

export async function getEducationData() {
  const supabase = await getSupabaseServerClient();
  const { data: content, error } = await supabase
    .from("educational_content")
    .select("id, title, content, category, life_stage, published, author_id, created_at")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return {
    articles: ((content ?? []) as EducationArticleRow[]).map(mapEducationArticle),
  };
}

export async function getEducationArticleData(articleId: string) {
  const supabase = await getSupabaseServerClient();
  const { data: articleRow, error } = await supabase
    .from("educational_content")
    .select("id, title, content, category, life_stage, published, author_id, created_at")
    .eq("id", articleId)
    .eq("published", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!articleRow) {
    return null;
  }

  const article = mapEducationArticle(articleRow as EducationArticleRow);
  const { data: relatedRows, error: relatedError } = await supabase
    .from("educational_content")
    .select("id, title, content, category, life_stage, published, author_id, created_at")
    .eq("published", true)
    .eq("category", article.category)
    .neq("id", article.id)
    .order("created_at", { ascending: false })
    .limit(3);

  if (relatedError) {
    throw new Error(relatedError.message);
  }

  return {
    article,
    relatedArticles: ((relatedRows ?? []) as EducationArticleRow[]).map(mapEducationArticle),
  };
}

export async function getProviderDashboardData() {
  const { userId, providerId } = await getCurrentProviderRecord();
  const supabase = await getSupabaseServerClient();
  const admin = getSupabaseAdminClient();
  const todayStart = startOfDay(new Date()).toISOString();
  const todayEnd = endOfDay(new Date()).toISOString();

  const [todaysAppointmentsResult, allAppointmentsResult, activeCarePlansResult, sentMessagesResult, availabilityResult] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, patient_id, scheduled_at, chief_complaint, status, type")
      .eq("provider_id", providerId)
      .gte("scheduled_at", todayStart)
      .lte("scheduled_at", todayEnd)
      .order("scheduled_at", { ascending: true }),
    supabase
      .from("appointments")
      .select("id, patient_id, scheduled_at, chief_complaint, status, type")
      .eq("provider_id", providerId)
      .order("scheduled_at", { ascending: false }),
    supabase
      .from("care_plans")
      .select("patient_id, status, title")
      .eq("provider_id", providerId)
      .eq("status", "active"),
    supabase
      .from("conversations")
      .select("id")
      .eq("provider_profile_id", userId),
    supabase
      .from("provider_availability")
      .select("id, day_of_week, start_time, end_time")
      .eq("provider_id", providerId)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true }),
  ]);

  if (todaysAppointmentsResult.error) {
    throw new Error(todaysAppointmentsResult.error.message);
  }

  if (allAppointmentsResult.error) {
    throw new Error(allAppointmentsResult.error.message);
  }

  if (activeCarePlansResult.error) {
    throw new Error(activeCarePlansResult.error.message);
  }

  if (sentMessagesResult.error) {
    throw new Error(sentMessagesResult.error.message);
  }

  if (availabilityResult.error) {
    throw new Error(availabilityResult.error.message);
  }

  const allAppointments = allAppointmentsResult.data ?? [];
  const todaysAppointments = todaysAppointmentsResult.data ?? [];
  const patientIds = Array.from(new Set(allAppointments.map((appointment) => appointment.patient_id).filter(Boolean)));
  const conversationIds = Array.from(new Set((sentMessagesResult.data ?? []).map((conversation) => conversation.id).filter(Boolean)));

  const [patientProfilesResult, unreadMessagesResult] = await Promise.all([
    patientIds.length
      ? admin.from("profiles").select("id, full_name").in("id", patientIds)
      : Promise.resolve({ data: [] as Array<{ id: string; full_name: string | null }>, error: null }),
    conversationIds.length
      ? supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .in("conversation_id", conversationIds)
          .neq("sender_id", userId)
          .is("read_at", null)
      : Promise.resolve({ count: 0, error: null }),
  ]);

  if (patientProfilesResult.error) {
    throw new Error(patientProfilesResult.error.message);
  }

  if (unreadMessagesResult.error) {
    throw new Error(unreadMessagesResult.error.message);
  }

  const patientProfileMap = new Map((patientProfilesResult.data ?? []).map((profile) => [profile.id, profile.full_name ?? "Patient"]));
  const activeCarePlanByPatient = new Map((activeCarePlansResult.data ?? []).filter((plan) => plan.patient_id).map((plan) => [plan.patient_id, { title: plan.title ?? "Active care plan", status: plan.status ?? "active" }]));

  const todaysAppointmentsMapped: ProviderDashboardAppointment[] = todaysAppointments.map((appointment) => ({
    id: appointment.id,
    patientId: appointment.patient_id,
    patientName: patientProfileMap.get(appointment.patient_id) ?? "Patient",
    scheduledAt: appointment.scheduled_at,
    chiefComplaint: appointment.chief_complaint ?? "General follow-up",
    status: appointment.status,
    type: appointment.type,
  }));

  const patientList: ProviderDashboardPatient[] = patientIds.map((patientId) => {
    const patientAppointments = allAppointments.filter((appointment) => appointment.patient_id === patientId);
    const lastAppointment = patientAppointments[0];
    const carePlan = activeCarePlanByPatient.get(patientId);

    return {
      id: patientId,
      name: patientProfileMap.get(patientId) ?? "Patient",
      lastVisit: lastAppointment?.scheduled_at ?? new Date().toISOString(),
      carePlan: carePlan?.title ?? "No active plan",
      carePlanStatus: carePlan ? (carePlan.status === "active" ? "Active" : carePlan.status) : "No active plan",
      reason: lastAppointment?.chief_complaint ?? "No chief complaint on file",
    };
  });

  const availability: ProviderAvailabilitySlot[] = (availabilityResult.data ?? []).map((slot) => ({
    id: slot.id,
    dayOfWeek: formatAvailabilityDay(slot.day_of_week),
    startTime: slot.start_time,
    endTime: slot.end_time,
    location: "Virtual",
  }));

  const stats: ProviderDashboardStats = {
    totalAppointments: allAppointments.length,
    pendingMessages: unreadMessagesResult.count ?? 0,
    activePatients: patientIds.length,
  };

  return {
    stats,
    todaysAppointments: todaysAppointmentsMapped,
    patients: patientList,
    schedule: availability,
  };
}

export async function getProviderScheduleData() {
  const { providerId } = await getCurrentProviderRecord();
  const supabase = await getSupabaseServerClient();
  const admin = getSupabaseAdminClient();
  const todayStart = startOfDay(new Date()).toISOString();
  const todayEnd = endOfDay(new Date()).toISOString();

  const { data: appointments, error: appointmentsError } = await supabase
    .from("appointments")
    .select("id, patient_id, scheduled_at, chief_complaint, status, type")
    .eq("provider_id", providerId)
    .gte("scheduled_at", todayStart)
    .lte("scheduled_at", todayEnd)
    .order("scheduled_at", { ascending: true });

  if (appointmentsError) {
    throw new Error(appointmentsError.message);
  }

  const patientIds = Array.from(new Set((appointments ?? []).map((appointment) => appointment.patient_id).filter(Boolean)));
  const { data: patientProfiles, error: patientProfilesError } = patientIds.length
    ? await admin.from("profiles").select("id, full_name").in("id", patientIds)
    : { data: [], error: null };

  if (patientProfilesError) {
    throw new Error(patientProfilesError.message);
  }

  const patientProfileMap = new Map((patientProfiles ?? []).map((profile) => [profile.id, profile.full_name ?? "Patient"]));

  return (appointments ?? []).map((appointment) => ({
    id: appointment.id,
    patientId: appointment.patient_id,
    patientName: patientProfileMap.get(appointment.patient_id) ?? "Patient",
    scheduledAt: appointment.scheduled_at,
    chiefComplaint: appointment.chief_complaint ?? "General follow-up",
    status: appointment.status,
    type: appointment.type,
  })) as ProviderDashboardAppointment[];
}

export async function getProviderCarePlansPageData(): Promise<ProviderCarePlansPageData> {
  const { providerId } = await getCurrentProviderRecord();
  const admin = getSupabaseAdminClient();

  const primaryPlansResult = await admin
    .from("care_plans")
    .select("id, patient_id, provider_id, title, description, status, milestones, created_at, start_date, end_date")
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false });

  const fallbackPlansResult = isMissingCarePlanDateColumnError(primaryPlansResult.error)
    ? await admin
        .from("care_plans")
        .select("id, patient_id, provider_id, title, description, status, milestones, created_at")
        .eq("provider_id", providerId)
        .order("created_at", { ascending: false })
    : null;

  const plansError = fallbackPlansResult ? fallbackPlansResult.error : primaryPlansResult.error;
  if (plansError) {
    throw new Error(plansError.message);
  }

  const primaryTemplatesResult = await admin
    .from("care_plans")
    .select("id, patient_id, provider_id, title, description, status, milestones, created_at, start_date, end_date")
    .is("patient_id", null)
    .order("created_at", { ascending: false });

  const fallbackTemplatesResult = isMissingCarePlanDateColumnError(primaryTemplatesResult.error)
    ? await admin
        .from("care_plans")
        .select("id, patient_id, provider_id, title, description, status, milestones, created_at")
        .is("patient_id", null)
        .order("created_at", { ascending: false })
    : null;

  const templatesError = fallbackTemplatesResult ? fallbackTemplatesResult.error : primaryTemplatesResult.error;
  if (templatesError) {
    throw new Error(templatesError.message);
  }

  const { data: appointments, error: appointmentsError } = await admin
    .from("appointments")
    .select("patient_id, scheduled_at")
    .eq("provider_id", providerId)
    .order("scheduled_at", { ascending: false });

  if (appointmentsError) {
    throw new Error(appointmentsError.message);
  }

  const patientIds = Array.from(new Set((appointments ?? []).map((appointment) => appointment.patient_id).filter((value): value is string => Boolean(value))));
  const { data: patientProfiles, error: patientProfilesError } = patientIds.length
    ? await admin.from("profiles").select("id, full_name, avatar_url").in("id", patientIds)
    : { data: [], error: null };

  if (patientProfilesError) {
    throw new Error(patientProfilesError.message);
  }

  const patientMap = new Map((patientProfiles ?? []).map((profile) => [
    profile.id,
    {
      name: profile.full_name ?? "Patient",
      avatarUrl: profile.avatar_url ?? null,
    },
  ]));

  const lastVisitByPatient = new Map<string, string>();
  for (const appointment of appointments ?? []) {
    if (appointment.patient_id && !lastVisitByPatient.has(appointment.patient_id)) {
      lastVisitByPatient.set(appointment.patient_id, appointment.scheduled_at);
    }
  }

  const plans = ((fallbackPlansResult?.data ?? primaryPlansResult.data ?? []) as Record<string, unknown>[]).map((carePlan) =>
    mapProviderCarePlanListItem(coerceCarePlanRow(carePlan), patientMap),
  );

  const patients: ProviderCarePlanPatientOption[] = patientIds.map((patientId) => ({
    id: patientId,
    name: patientMap.get(patientId)?.name ?? "Patient",
    avatarUrl: patientMap.get(patientId)?.avatarUrl ?? null,
    lastVisit: lastVisitByPatient.get(patientId) ?? new Date().toISOString(),
  }));

  const templates: ProviderCarePlanTemplateOption[] = ((fallbackTemplatesResult?.data ?? primaryTemplatesResult.data ?? []) as Record<string, unknown>[])
    .map(coerceCarePlanRow)
    .filter((template) => template.status === "template")
    .map((template) => ({
      id: template.id,
      title: template.title,
      description: template.description ?? "Reusable care plan template.",
      milestones: normalizeCarePlanMilestones(template.milestones, new Date().toISOString()),
    }));

  return {
    plans,
    patients,
    templates,
  };
}

export async function getProviderPatientDetailData(patientId: string): Promise<{ id: string; name: string; dateOfBirth: string | null; lastVisit: string; carePlan: string; reason: string; upcomingAppointments: ProviderDashboardAppointment[]; recentAppointments: ProviderDashboardAppointment[] } | null> {
  const { providerId } = await getCurrentProviderRecord();
  const supabase = await getSupabaseServerClient();
  const admin = getSupabaseAdminClient();

  const [profileResult, appointmentsResult, carePlanResult] = await Promise.all([
    admin
      .from("profiles")
      .select("id, full_name, date_of_birth")
      .eq("id", patientId)
      .maybeSingle(),
    supabase
      .from("appointments")
      .select("id, patient_id, scheduled_at, chief_complaint, status, type")
      .eq("provider_id", providerId)
      .eq("patient_id", patientId)
      .order("scheduled_at", { ascending: false }),
    supabase
      .from("care_plans")
      .select("title")
      .eq("provider_id", providerId)
      .eq("patient_id", patientId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (profileResult.error) {
    throw new Error(profileResult.error.message);
  }

  if (appointmentsResult.error) {
    throw new Error(appointmentsResult.error.message);
  }

  if (carePlanResult.error) {
    throw new Error(carePlanResult.error.message);
  }

  const appointments = appointmentsResult.data ?? [];

  if (!profileResult.data || !appointments.length) {
    return null;
  }

  const patientName = profileResult.data.full_name ?? "Patient";
  const mappedAppointments = appointments.map((appointment) => ({
    id: appointment.id,
    patientId: appointment.patient_id,
    patientName,
    scheduledAt: appointment.scheduled_at,
    chiefComplaint: appointment.chief_complaint ?? "General follow-up",
    status: appointment.status,
    type: appointment.type,
  })) as ProviderDashboardAppointment[];

  const now = Date.now();
  const upcomingAppointments = mappedAppointments
    .filter((appointment) => new Date(appointment.scheduledAt).getTime() >= now)
    .sort((left, right) => new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime());
  const recentAppointments = mappedAppointments
    .filter((appointment) => new Date(appointment.scheduledAt).getTime() < now)
    .sort((left, right) => new Date(right.scheduledAt).getTime() - new Date(left.scheduledAt).getTime())
    .slice(0, 5);
  const lastVisit = recentAppointments[0]?.scheduledAt ?? mappedAppointments[0]?.scheduledAt ?? new Date().toISOString();

  return {
    id: patientId,
    name: patientName,
    dateOfBirth: profileResult.data.date_of_birth ?? null,
    lastVisit,
    carePlan: carePlanResult.data?.title ?? "No active plan",
    reason: mappedAppointments[0]?.chiefComplaint ?? "No chief complaint on file",
    upcomingAppointments,
    recentAppointments,
  };
}

function getMonthBuckets(count: number) {
  const now = new Date();

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (count - index - 1), 1);

    return {
      label: date.toLocaleString("en-US", { month: "short", year: "numeric" }),
      tooltipLabel: date.toLocaleString("en-US", { month: "long", year: "numeric" }),
      start: date,
      end: new Date(date.getFullYear(), date.getMonth() + 1, 1),
      members: new Set<string>(),
    };
  });
}

function formatDashboardDate(value?: string | null) {
  if (!value) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatDashboardDateTime(value?: string | null) {
  if (!value) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getNotificationSeverity(type?: string | null) {
  const normalized = type?.toLowerCase() ?? "";

  if (["suspend", "cancel", "escalat", "urgent"].some((keyword) => normalized.includes(keyword))) {
    return "High";
  }

  if (["invite", "appointment", "message", "review"].some((keyword) => normalized.includes(keyword))) {
    return "Medium";
  }

  return "Low";
}

function isExpired(value?: string | null) {
  return Boolean(value && new Date(value).getTime() < Date.now());
}


type NotificationFeedItem = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  type: string;
  actor: string;
  readAt: string | null;
  createdAt: string;
  severity: string;
};

export async function getNotificationShellData() {
  const user = await getCurrentUser();

  if (!user) {
    return { userId: null, unreadCount: 0 };
  }

  const supabase = await getSupabaseServerClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", user.id)
    .is("read_at", null);

  if (error) {
    return { userId: user.id, unreadCount: 0 };
  }

  return {
    userId: user.id,
    unreadCount: count ?? 0,
  };
}

export async function getNotificationsPageData() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Authenticated user required.");
  }

  const supabase = await getSupabaseServerClient();
  const { data: notifications, error } = await supabase
    .from("notifications")
    .select("id, title, body, link, type, actor_id, read_at, created_at")
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (notifications ?? []) as Array<{
    id: string;
    title: string;
    body: string | null;
    link: string | null;
    type: string | null;
    actor_id: string | null;
    read_at: string | null;
    created_at: string | null;
  }>;
  const actorIds = Array.from(new Set(rows.map((item) => item.actor_id).filter((value): value is string => Boolean(value))));
  const actorProfilesResult = await (async () => {
    if (!actorIds.length) {
      return { data: [] as Array<{ id: string; full_name: string | null }>, error: null };
    }

    try {
      return await getSupabaseAdminClient().from("profiles").select("id, full_name").in("id", actorIds);
    } catch {
      return { data: [] as Array<{ id: string; full_name: string | null }>, error: null };
    }
  })();

  if (actorProfilesResult.error) {
    throw new Error(actorProfilesResult.error.message);
  }

  const actorMap = new Map((actorProfilesResult.data ?? []).map((profile) => [profile.id, profile.full_name ?? "System"]));
  const items: NotificationFeedItem[] = rows.map((item) => ({
    id: item.id,
    title: item.title,
    body: item.body ?? "",
    link: item.link ?? null,
    type: item.type ?? "general",
    actor: item.actor_id ? actorMap.get(item.actor_id) ?? "System" : "System",
    readAt: item.read_at,
    createdAt: item.created_at ?? new Date().toISOString(),
    severity: getNotificationSeverity(item.type),
  }));

  return {
    userId: user.id,
    unreadCount: items.filter((item) => !item.readAt).length,
    items,
  };
}

export async function getEmployerAnalyticsData() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Authenticated employer admin required.");
  }

  const buckets = getMonthBuckets(6);
  const emptyData = {
    stats: {
      coveredEmployees: 0,
      monthlyActiveUsers: 0,
      completionRate: 0,
      activeCarePlans: 0,
      employerName: "Employer",
      planType: "No plan",
      contractEnd: null as string | null,
    },
    mau: buckets.map((bucket) => ({ month: bucket.label, fullLabel: bucket.tooltipLabel, users: 0 })),
    categories: [] as Array<{ name: string; value: number; percent: number }>,
    roi: {
      estimatedSavings: 0,
      averageHoursToAppointment: 0,
      satisfaction: 4.8,
      totalAppointments: 0,
    },
  };

  const admin = getSupabaseAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("employer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (!profile?.employer_id) {
    return emptyData;
  }

  const [employerResult, employeesResult] = await Promise.all([
    admin
      .from("employers")
      .select("id, company_name, employee_count, plan_type, contract_end")
      .eq("id", profile.employer_id)
      .maybeSingle(),
    admin
      .from("profiles")
      .select("id")
      .eq("employer_id", profile.employer_id)
      .eq("role", "patient"),
  ]);

  if (employerResult.error) {
    throw new Error(employerResult.error.message);
  }

  if (employeesResult.error) {
    throw new Error(employeesResult.error.message);
  }

  const employer = employerResult.data as {
    id: string;
    company_name: string;
    employee_count: number | null;
    plan_type: string | null;
    contract_end: string | null;
  } | null;
  const employeeIds = ((employeesResult.data ?? []) as Array<{ id: string }>).map((employee) => employee.id);
  const coveredEmployees = employer?.employee_count ?? employeeIds.length;

  if (!employeeIds.length) {
    return {
      ...emptyData,
      stats: {
        ...emptyData.stats,
        coveredEmployees,
        employerName: employer?.company_name ?? "Employer",
        planType: employer?.plan_type ?? "standard",
        contractEnd: employer?.contract_end ?? null,
      },
    };
  }

  const [appointmentsResult, carePlansResult, conversationsResult] = await Promise.all([
    admin
      .from("appointments")
      .select("patient_id, provider_id, status, scheduled_at, created_at")
      .in("patient_id", employeeIds),
    admin
      .from("care_plans")
      .select("patient_id, status")
      .in("patient_id", employeeIds),
    admin
      .from("conversations")
      .select("id, patient_id, created_at")
      .in("patient_id", employeeIds),
  ]);

  if (appointmentsResult.error) {
    throw new Error(appointmentsResult.error.message);
  }

  if (carePlansResult.error) {
    throw new Error(carePlansResult.error.message);
  }

  if (conversationsResult.error) {
    throw new Error(conversationsResult.error.message);
  }

  const appointments = (appointmentsResult.data ?? []) as Array<{
    patient_id: string;
    provider_id: string | null;
    status: Appointment["status"];
    scheduled_at: string;
    created_at?: string | null;
  }>;
  const carePlans = (carePlansResult.data ?? []) as Array<{ patient_id: string; status: string | null }>;
  const conversations = (conversationsResult.data ?? []) as Array<{ id: string; patient_id: string; created_at: string | null }>;

  const providerIds = Array.from(new Set(appointments.map((appointment) => appointment.provider_id).filter((value): value is string => Boolean(value))));
  const providersResult = providerIds.length
    ? await admin.from("providers").select("id, specialty").in("id", providerIds)
    : { data: [] as Array<{ id: string; specialty: string }>, error: null };

  if (providersResult.error) {
    throw new Error(providersResult.error.message);
  }

  for (const appointment of appointments) {
    const value = new Date(appointment.scheduled_at);
    const bucket = buckets.find((entry) => value >= entry.start && value < entry.end);
    if (bucket) {
      bucket.members.add(appointment.patient_id);
    }
  }

  for (const conversation of conversations) {
    if (!conversation.created_at) {
      continue;
    }

    const value = new Date(conversation.created_at);
    const bucket = buckets.find((entry) => value >= entry.start && value < entry.end);
    if (bucket) {
      bucket.members.add(conversation.patient_id);
    }
  }

  const activeCarePlans = new Set(
    carePlans.filter((plan) => (plan.status ?? "active") === "active").map((plan) => plan.patient_id),
  ).size;
  const eligibleAppointments = appointments.filter((appointment) => appointment.status !== "cancelled" && appointment.status !== "no_show");
  const completedAppointments = eligibleAppointments.filter((appointment) => appointment.status === "completed").length;
  const completionRate = eligibleAppointments.length ? Math.round((completedAppointments / eligibleAppointments.length) * 100) : 0;
  const specialtyMap = new Map(
    ((providersResult.data ?? []) as Array<{ id: string; specialty: string }>).map((provider) => [provider.id, formatProviderSpecialtyLabel(provider.specialty)]),
  );
  const thisMonthBucket = buckets.at(-1);
  const specialtyCounts = new Map<string, number>();

  if (thisMonthBucket) {
    for (const appointment of appointments) {
      const scheduledAt = new Date(appointment.scheduled_at);
      if (scheduledAt < thisMonthBucket.start || scheduledAt >= thisMonthBucket.end) {
        continue;
      }

      const label = appointment.provider_id ? specialtyMap.get(appointment.provider_id) ?? "General" : "General";
      specialtyCounts.set(label, (specialtyCounts.get(label) ?? 0) + 1);
    }
  }

  const mau = buckets.map((bucket) => ({
    month: bucket.label,
    fullLabel: bucket.tooltipLabel,
    users: bucket.members.size,
  }));

  const monthSpecialtyTotal = Array.from(specialtyCounts.values()).reduce((sum, value) => sum + value, 0);
  const categories = Array.from(specialtyCounts.entries())
    .map(([name, value]) => ({
      name,
      value,
      percent: monthSpecialtyTotal ? Math.round((value / monthSpecialtyTotal) * 100) : 0,
    }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 5);

  const averageHoursSamples = appointments
    .map((appointment) => {
      if (!appointment.created_at) {
        return null;
      }

      const diff = new Date(appointment.scheduled_at).getTime() - new Date(appointment.created_at).getTime();
      return diff > 0 ? diff / (1000 * 60 * 60) : null;
    })
    .filter((value): value is number => value !== null);
  const averageHoursToAppointment = averageHoursSamples.length
    ? Math.round(averageHoursSamples.reduce((sum, value) => sum + value, 0) / averageHoursSamples.length)
    : 0;

  return {
    stats: {
      coveredEmployees,
      monthlyActiveUsers: mau.at(-1)?.users ?? 0,
      completionRate,
      activeCarePlans,
      employerName: employer?.company_name ?? "Employer",
      planType: employer?.plan_type ?? "standard",
      contractEnd: employer?.contract_end ?? null,
    },
    mau,
    categories,
    roi: {
      estimatedSavings: appointments.length * 150,
      averageHoursToAppointment,
      satisfaction: 4.8,
      totalAppointments: appointments.length,
    },
  };
}

export async function getEmployerEmployeesPageData(page = 1, pageSize = 20) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Authenticated employer admin required.");
  }

  const admin = getSupabaseAdminClient();
  const safePage = Math.max(page, 1);
  const rangeStart = (safePage - 1) * pageSize;
  const rangeEnd = rangeStart + pageSize - 1;

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("employer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (!profile?.employer_id) {
    return {
      employerName: "Employer",
      page: safePage,
      totalPages: 1,
      totalEmployees: 0,
      employees: [] as Array<{
        id: string;
        name: string;
        email: string;
        joinDate: string;
        lastActive: string;
        status: "active" | "inactive";
      }>,
    };
  }

  const [employerResult, employeesResult] = await Promise.all([
    admin
      .from("employers")
      .select("company_name")
      .eq("id", profile.employer_id)
      .maybeSingle(),
    admin
      .from("profiles")
      .select("id, full_name, created_at", { count: "exact" })
      .eq("employer_id", profile.employer_id)
      .eq("role", "patient")
      .order("created_at", { ascending: false })
      .range(rangeStart, rangeEnd),
  ]);

  if (employerResult.error) {
    throw new Error(employerResult.error.message);
  }

  if (employeesResult.error) {
    throw new Error(employeesResult.error.message);
  }

  const employees = (employeesResult.data ?? []) as Array<{ id: string; full_name: string | null; created_at: string | null }>;
  const employeeIds = employees.map((employee) => employee.id);

  const [appointmentsResult, conversationsResult, authUsersResult] = await Promise.all([
    employeeIds.length
      ? admin
          .from("appointments")
          .select("patient_id, scheduled_at")
          .in("patient_id", employeeIds)
      : Promise.resolve({ data: [] as Array<{ patient_id: string | null; scheduled_at: string }>, error: null }),
    employeeIds.length
      ? admin
          .from("conversations")
          .select("patient_id, created_at")
          .in("patient_id", employeeIds)
      : Promise.resolve({ data: [] as Array<{ patient_id: string; created_at: string | null }>, error: null }),
    admin.auth.admin.listUsers({ page: 1, perPage: 500 }),
  ]);

  if (appointmentsResult.error) {
    throw new Error(appointmentsResult.error.message);
  }

  if (conversationsResult.error) {
    throw new Error(conversationsResult.error.message);
  }

  if (authUsersResult.error) {
    throw new Error(authUsersResult.error.message);
  }

  const emailMap = new Map((authUsersResult.data.users ?? []).map((authUser) => [authUser.id, authUser.email ?? "No email on file"]));
  const lastActivityMap = new Map<string, number>();

  for (const appointment of appointmentsResult.data ?? []) {
    if (!appointment.patient_id) {
      continue;
    }

    const value = new Date(appointment.scheduled_at).getTime();
    lastActivityMap.set(appointment.patient_id, Math.max(lastActivityMap.get(appointment.patient_id) ?? 0, value));
  }

  for (const conversation of conversationsResult.data ?? []) {
    if (!conversation.created_at) {
      continue;
    }

    const value = new Date(conversation.created_at).getTime();
    lastActivityMap.set(conversation.patient_id, Math.max(lastActivityMap.get(conversation.patient_id) ?? 0, value));
  }

  const employeesData = employees.map((employee) => {
    const lastActivityValue = lastActivityMap.get(employee.id) ?? 0;
    const isActive = lastActivityValue > 0 && Date.now() - lastActivityValue < 1000 * 60 * 60 * 24 * 45;

    return {
      id: employee.id,
      name: employee.full_name ?? "Employee",
      email: emailMap.get(employee.id) ?? "No email on file",
      joinDate: employee.created_at
        ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(employee.created_at))
        : "Unknown",
      lastActive: lastActivityValue
        ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(lastActivityValue))
        : "No recent activity",
      status: isActive ? "active" as const : "inactive" as const,
    };
  });

  return {
    employerName: employerResult.data?.company_name ?? "Employer",
    page: safePage,
    totalPages: Math.max(1, Math.ceil((employeesResult.count ?? employeesData.length) / pageSize)),
    totalEmployees: employeesResult.count ?? employeesData.length,
    employees: employeesData,
  };
}

export async function getEmployerReportsPageData() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Authenticated employer admin required.");
  }

  const admin = getSupabaseAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("employer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (!profile?.employer_id) {
    return {
      userEmail: user.email ?? "benefits@company.com",
      employer: {
        companyName: "Employer",
        employeeCount: 0,
        planType: "Enterprise",
        contractStart: null as string | null,
        contractEnd: null as string | null,
        monthlyCostCents: 0,
      },
      summary: {
        totalVisitsThisMonth: 0,
        totalVisitsThisYear: 0,
        mostUsedSpecialty: "No activity yet",
        averageSatisfaction: 4.8,
      },
      reportRows: [] as Array<{ month: string; monthLabel: string; specialty: string; visitCount: number; completionRate: number }>,
    };
  }

  const [employerResult, employeesResult] = await Promise.all([
    admin
      .from("employers")
      .select("company_name, employee_count, plan_type, contract_start, contract_end")
      .eq("id", profile.employer_id)
      .maybeSingle(),
    admin
      .from("profiles")
      .select("id")
      .eq("employer_id", profile.employer_id)
      .eq("role", "patient"),
  ]);

  if (employerResult.error) {
    throw new Error(employerResult.error.message);
  }

  if (employeesResult.error) {
    throw new Error(employeesResult.error.message);
  }

  const employeeIds = ((employeesResult.data ?? []) as Array<{ id: string }>).map((employee) => employee.id);
  const employer = employerResult.data as {
    company_name: string;
    employee_count: number | null;
    plan_type: string | null;
    contract_start: string | null;
    contract_end: string | null;
  } | null;

  if (!employeeIds.length) {
    return {
      userEmail: user.email ?? "benefits@company.com",
      employer: {
        companyName: employer?.company_name ?? "Employer",
        employeeCount: employer?.employee_count ?? 0,
        planType: formatProviderSpecialtyLabel(employer?.plan_type ?? "enterprise"),
        contractStart: employer?.contract_start ?? null,
        contractEnd: employer?.contract_end ?? null,
        monthlyCostCents: (employer?.employee_count ?? 0) * 1200,
      },
      summary: {
        totalVisitsThisMonth: 0,
        totalVisitsThisYear: 0,
        mostUsedSpecialty: "No activity yet",
        averageSatisfaction: 4.8,
      },
      reportRows: [] as Array<{ month: string; monthLabel: string; specialty: string; visitCount: number; completionRate: number }>,
    };
  }

  const startWindow = new Date();
  startWindow.setMonth(startWindow.getMonth() - 11, 1);
  startWindow.setHours(0, 0, 0, 0);

  const { data: appointments, error: appointmentsError } = await admin
    .from("appointments")
    .select("provider_id, status, scheduled_at")
    .in("patient_id", employeeIds)
    .gte("scheduled_at", startWindow.toISOString());

  if (appointmentsError) {
    throw new Error(appointmentsError.message);
  }

  const providerIds = Array.from(new Set((appointments ?? []).map((appointment) => appointment.provider_id).filter((value): value is string => Boolean(value))));
  const providersResult = providerIds.length
    ? await admin.from("providers").select("id, specialty").in("id", providerIds)
    : { data: [] as Array<{ id: string; specialty: string }>, error: null };

  if (providersResult.error) {
    throw new Error(providersResult.error.message);
  }

  const specialtyMap = new Map(((providersResult.data ?? []) as Array<{ id: string; specialty: string }>).map((provider) => [provider.id, formatProviderSpecialtyLabel(provider.specialty)]));
  const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" });
  const specialtyCounts = new Map<string, number>();
  const grouped = new Map<string, { month: string; monthLabel: string; specialty: string; total: number; completed: number; eligible: number }>();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  let totalVisitsThisMonth = 0;
  let totalVisitsThisYear = 0;

  for (const appointment of appointments ?? []) {
    const scheduledAt = new Date(appointment.scheduled_at);
    const specialty = appointment.provider_id ? specialtyMap.get(appointment.provider_id) ?? "General" : "General";
    specialtyCounts.set(specialty, (specialtyCounts.get(specialty) ?? 0) + 1);

    if (scheduledAt >= monthStart) {
      totalVisitsThisMonth += 1;
    }

    if (scheduledAt >= yearStart) {
      totalVisitsThisYear += 1;
    }

    const monthKey = `${scheduledAt.getFullYear()}-${String(scheduledAt.getMonth() + 1).padStart(2, "0")}`;
    const groupKey = `${monthKey}-${specialty}`;
    const existing = grouped.get(groupKey) ?? {
      month: monthKey,
      monthLabel: monthFormatter.format(scheduledAt),
      specialty,
      total: 0,
      completed: 0,
      eligible: 0,
    };
    existing.total += 1;
    if (appointment.status !== "cancelled" && appointment.status !== "no_show") {
      existing.eligible += 1;
    }
    if (appointment.status === "completed") {
      existing.completed += 1;
    }
    grouped.set(groupKey, existing);
  }

  const reportRows = Array.from(grouped.values())
    .map((row) => ({
      month: row.month,
      monthLabel: row.monthLabel,
      specialty: row.specialty,
      visitCount: row.total,
      completionRate: row.eligible ? Math.round((row.completed / row.eligible) * 100) : 0,
    }))
    .sort((left, right) => left.month.localeCompare(right.month) || left.specialty.localeCompare(right.specialty));

  const mostUsedSpecialty = Array.from(specialtyCounts.entries()).sort((left, right) => right[1] - left[1])[0]?.[0] ?? "No activity yet";

  return {
    userEmail: user.email ?? "benefits@company.com",
    employer: {
      companyName: employer?.company_name ?? "Employer",
      employeeCount: employer?.employee_count ?? employeeIds.length,
      planType: formatProviderSpecialtyLabel(employer?.plan_type ?? "enterprise"),
      contractStart: employer?.contract_start ?? null,
      contractEnd: employer?.contract_end ?? null,
      monthlyCostCents: (employer?.employee_count ?? employeeIds.length) * 1200,
    },
    summary: {
      totalVisitsThisMonth,
      totalVisitsThisYear,
      mostUsedSpecialty,
      averageSatisfaction: 4.8,
    },
    reportRows,
  };
}

export async function getClinicDashboardData() {

  const admin = getSupabaseAdminClient();

  const [providersResult, invitationsResult, conversationsResult, notificationsResult] = await Promise.all([
    admin
      .from("providers")
      .select("id, profile_id, specialty, accepting_patients, rating, total_reviews"),
    admin
      .from("invitations")
      .select("id, email, accepted, expires_at, created_at")
      .eq("role", "provider")
      .order("created_at", { ascending: false })
      .limit(8),
    admin
      .from("conversations")
      .select("id, provider_profile_id, created_at")
      .order("created_at", { ascending: false }),
    admin
      .from("notifications")
      .select("id, type, title, created_at, actor_id")
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  if (providersResult.error) {
    throw new Error(providersResult.error.message);
  }

  if (invitationsResult.error) {
    throw new Error(invitationsResult.error.message);
  }

  if (conversationsResult.error) {
    throw new Error(conversationsResult.error.message);
  }

  if (notificationsResult.error) {
    throw new Error(notificationsResult.error.message);
  }

  const providers = (providersResult.data ?? []) as Array<{
    id: string;
    profile_id: string | null;
    specialty: string;
    accepting_patients: boolean | null;
    rating: number | null;
    total_reviews: number | null;
  }>;
  const invitations = (invitationsResult.data ?? []) as Array<{
    id: string;
    email: string;
    accepted: boolean | null;
    expires_at: string | null;
    created_at: string | null;
  }>;
  const conversations = (conversationsResult.data ?? []) as Array<{
    id: string;
    provider_profile_id: string | null;
    created_at: string | null;
  }>;
  const notifications = (notificationsResult.data ?? []) as Array<{
    id: string;
    type: string | null;
    title: string;
    created_at: string | null;
    actor_id: string | null;
  }>;

  const providerProfileIds = Array.from(new Set(providers.map((provider) => provider.profile_id).filter((value): value is string => Boolean(value))));
  const actorIds = Array.from(new Set(notifications.map((item) => item.actor_id).filter((value): value is string => Boolean(value))));
  const profileIds = Array.from(new Set([...providerProfileIds, ...actorIds]));
  const conversationIds = conversations.map((conversation) => conversation.id);

  const [profilesResult, messagesResult] = await Promise.all([
    profileIds.length
      ? admin.from("profiles").select("id, full_name, created_at").in("id", profileIds)
      : Promise.resolve({ data: [] as Array<{ id: string; full_name: string | null; created_at: string | null }>, error: null }),
    conversationIds.length
      ? admin.from("messages").select("conversation_id, sender_id, read_at, created_at").in("conversation_id", conversationIds)
      : Promise.resolve({ data: [] as Array<{ conversation_id: string; sender_id: string | null; read_at: string | null; created_at: string | null }>, error: null }),
  ]);

  if (profilesResult.error) {
    throw new Error(profilesResult.error.message);
  }

  if (messagesResult.error) {
    throw new Error(messagesResult.error.message);
  }

  const profiles = (profilesResult.data ?? []) as Array<{ id: string; full_name: string | null; created_at: string | null }>;
  const messages = (messagesResult.data ?? []) as Array<{
    conversation_id: string;
    sender_id: string | null;
    read_at: string | null;
    created_at: string | null;
  }>;
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

  const providerManagement = providers
    .map((provider) => {
      const profile = provider.profile_id ? profileMap.get(provider.profile_id) : undefined;
      const acceptingPatients = provider.accepting_patients ?? true;
      return {
        id: provider.id,
        name: profile?.full_name ?? `${formatProviderSpecialtyLabel(provider.specialty)} specialist`,
        specialty: formatProviderSpecialtyLabel(provider.specialty),
        status: acceptingPatients ? "Active and accepting" : "Active, not accepting",
        submittedAt: formatDashboardDate(profile?.created_at),
        action: acceptingPatients
          ? `${Number(provider.total_reviews ?? 0)} reviews - ${Number(provider.rating ?? 5).toFixed(1)} rating`
          : "Review panel access",
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));

  const invitationQueue = invitations.map((invitation) => {
    const pending = !invitation.accepted && !isExpired(invitation.expires_at);
    return {
      id: invitation.id,
      email: invitation.email,
      status: invitation.accepted ? "Accepted" : pending ? "Pending" : "Expired",
      createdAt: formatDashboardDate(invitation.created_at),
      expiresAt: formatDashboardDate(invitation.expires_at),
    };
  });

  const conversationsById = new Map(conversations.map((conversation) => [conversation.id, conversation]));
  const conversationMap = new Map<string, { providerName: string; openThreads: number; unreadMessages: number; lastActivityValue: number }>();

  for (const conversation of conversations) {
    const providerKey = conversation.provider_profile_id ?? `unassigned-${conversation.id}`;
    const providerName = conversation.provider_profile_id
      ? profileMap.get(conversation.provider_profile_id)?.full_name ?? "Assigned provider"
      : "Unassigned provider";
    const existing = conversationMap.get(providerKey) ?? {
      providerName,
      openThreads: 0,
      unreadMessages: 0,
      lastActivityValue: conversation.created_at ? new Date(conversation.created_at).getTime() : 0,
    };
    existing.openThreads += 1;
    existing.lastActivityValue = Math.max(existing.lastActivityValue, conversation.created_at ? new Date(conversation.created_at).getTime() : 0);
    conversationMap.set(providerKey, existing);
  }

  for (const message of messages) {
    const conversation = conversationsById.get(message.conversation_id);
    if (!conversation) {
      continue;
    }

    const providerKey = conversation.provider_profile_id ?? `unassigned-${conversation.id}`;
    const existing = conversationMap.get(providerKey);

    if (!existing) {
      continue;
    }

    const messageTimestamp = message.created_at ? new Date(message.created_at).getTime() : 0;
    existing.lastActivityValue = Math.max(existing.lastActivityValue, messageTimestamp);

    if (message.sender_id !== conversation.provider_profile_id && !message.read_at) {
      existing.unreadMessages += 1;
    }
  }

  const conversationLoad = Array.from(conversationMap.entries())
    .map(([id, item]) => ({
      id,
      providerName: item.providerName,
      openThreads: item.openThreads,
      unreadMessages: item.unreadMessages,
      lastActivity: item.lastActivityValue ? formatDashboardDateTime(new Date(item.lastActivityValue).toISOString()) : "No activity yet",
    }))
    .sort((left, right) => right.unreadMessages - left.unreadMessages || right.openThreads - left.openThreads)
    .slice(0, 8);

  const notificationItems = notifications.map((item) => ({
    id: item.id,
    event: item.title,
    actor: item.actor_id ? profileMap.get(item.actor_id)?.full_name ?? "System" : "System",
    timestamp: formatDashboardDateTime(item.created_at),
    severity: getNotificationSeverity(item.type),
  }));

  return {
    stats: {
      activeProviders: providers.length,
      pendingInvites: invitationQueue.filter((invitation) => invitation.status === "Pending").length,
      openConversations: conversations.length,
      recentNotifications: notifications.filter((item) => item.created_at && new Date(item.created_at).getTime() >= Date.now() - 7 * 24 * 60 * 60 * 1000).length,
    },
    providerManagement,
    invitationQueue,
    conversationLoad,
    notifications: notificationItems,
  };
}





















type EmployerAnalyticsRangeKey = "30d" | "90d" | "180d" | "365d";

type EmployerTrendPoint = {
  date: string;
  label: string;
  fullLabel: string;
  activeUsers: number;
  appointments: number;
  messages: number;
};

type EmployerSpecialtyPoint = {
  name: string;
  count: number;
  percent: number;
};

type EmployerMonthlyComparisonRow = {
  month: string;
  activeUsers: number;
  appointments: number;
  messages: number;
  newUsers: number;
  completionRate: number;
};

export type EmployerAdvancedAnalyticsData = {
  employerName: string;
  selectedRange: EmployerAnalyticsRangeKey;
  trends: EmployerTrendPoint[];
  specialties: EmployerSpecialtyPoint[];
  engagement: {
    avgSessionsPerUserPerMonth: number;
    avgHoursToFirstAppointment: number;
    messageResponseRate: number;
    carePlanAdoptionRate: number;
  };
  monthlyComparison: EmployerMonthlyComparisonRow[];
};

function formatDateKey(value: string | Date) {
  const date = new Date(value);
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function formatMonthKey(value: string | Date) {
  const date = new Date(value);
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}`;
}

function getEmployerRangeDays(range: string | undefined): EmployerAnalyticsRangeKey {
  if (range === "30d" || range === "90d" || range === "180d" || range === "365d") {
    return range;
  }

  return "180d";
}

function getRangeDayCount(range: EmployerAnalyticsRangeKey) {
  if (range === "30d") return 30;
  if (range === "90d") return 90;
  if (range === "365d") return 365;
  return 180;
}

function getDayTrendBuckets(range: EmployerAnalyticsRangeKey) {
  const days = getRangeDayCount(range);
  const buckets: Array<EmployerTrendPoint & { members: Set<string> }> = [];

  for (let index = days - 1; index >= 0; index -= 1) {
    const date = subDays(startOfDay(new Date()), index);
    buckets.push({
      date: formatDateKey(date),
      label: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date),
      fullLabel: new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(date),
      activeUsers: 0,
      appointments: 0,
      messages: 0,
      members: new Set<string>(),
    });
  }

  return buckets;
}

export async function getEmployerAdvancedAnalyticsData(rangeInput?: string): Promise<EmployerAdvancedAnalyticsData> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Authenticated employer admin required.");
  }

  const selectedRange = getEmployerRangeDays(rangeInput);
  const admin = getSupabaseAdminClient();
  const emptyData: EmployerAdvancedAnalyticsData = {
    employerName: "Employer",
    selectedRange,
    trends: getDayTrendBuckets(selectedRange).map((bucket) => ({ date: bucket.date, label: bucket.label, fullLabel: bucket.fullLabel, activeUsers: bucket.activeUsers, appointments: bucket.appointments, messages: bucket.messages })), 
    specialties: [],
    engagement: {
      avgSessionsPerUserPerMonth: 0,
      avgHoursToFirstAppointment: 0,
      messageResponseRate: 0,
      carePlanAdoptionRate: 0,
    },
    monthlyComparison: getMonthBuckets(6).map((bucket) => ({
      month: bucket.label,
      activeUsers: 0,
      appointments: 0,
      messages: 0,
      newUsers: 0,
      completionRate: 0,
    })),
  };

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("employer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (!profile?.employer_id) {
    return emptyData;
  }

  const [employerResult, employeesResult] = await Promise.all([
    admin
      .from("employers")
      .select("company_name, employee_count")
      .eq("id", profile.employer_id)
      .maybeSingle(),
    admin
      .from("profiles")
      .select("id, created_at")
      .eq("employer_id", profile.employer_id)
      .eq("role", "patient"),
  ]);

  if (employerResult.error) {
    throw new Error(employerResult.error.message);
  }

  if (employeesResult.error) {
    throw new Error(employeesResult.error.message);
  }

  const employerName = employerResult.data?.company_name ?? "Employer";
  const employees = (employeesResult.data ?? []) as Array<{ id: string; created_at: string | null }>;
  const employeeIds = employees.map((employee) => employee.id);

  if (!employeeIds.length) {
    return { ...emptyData, employerName };
  }

  const yearlyStart = subDays(startOfDay(new Date()), 364).toISOString();
  const [appointmentsResult, carePlansResult, conversationsResult] = await Promise.all([
    admin
      .from("appointments")
      .select("id, patient_id, provider_id, status, scheduled_at, created_at")
      .in("patient_id", employeeIds)
      .gte("scheduled_at", yearlyStart),
    admin
      .from("care_plans")
      .select("patient_id, status")
      .in("patient_id", employeeIds),
    admin
      .from("conversations")
      .select("id, patient_id, provider_profile_id, created_at")
      .in("patient_id", employeeIds)
      .gte("created_at", yearlyStart),
  ]);

  if (appointmentsResult.error) {
    throw new Error(appointmentsResult.error.message);
  }
  if (carePlansResult.error) {
    throw new Error(carePlansResult.error.message);
  }
  if (conversationsResult.error) {
    throw new Error(conversationsResult.error.message);
  }

  const appointments = (appointmentsResult.data ?? []) as Array<{
    id: string;
    patient_id: string;
    provider_id: string | null;
    status: string | null;
    scheduled_at: string;
    created_at: string | null;
  }>;
  const carePlans = (carePlansResult.data ?? []) as Array<{ patient_id: string | null; status: string | null }>;
  const conversations = (conversationsResult.data ?? []) as Array<{
    id: string;
    patient_id: string;
    provider_profile_id: string | null;
    created_at: string | null;
  }>;

  const conversationIds = conversations.map((conversation) => conversation.id);
  const messagesResult = conversationIds.length
    ? await admin
        .from("messages")
        .select("conversation_id, sender_id, created_at")
        .in("conversation_id", conversationIds)
        .gte("created_at", yearlyStart)
    : { data: [], error: null };

  if (messagesResult.error) {
    throw new Error(messagesResult.error.message);
  }

  const messages = (messagesResult.data ?? []) as Array<{
    conversation_id: string;
    sender_id: string | null;
    created_at: string | null;
  }>;

  const providerIds = Array.from(new Set(appointments.map((appointment) => appointment.provider_id).filter((value): value is string => Boolean(value))));
  const providersResult = providerIds.length
    ? await admin.from("providers").select("id, specialty").in("id", providerIds)
    : { data: [], error: null };

  if (providersResult.error) {
    throw new Error(providersResult.error.message);
  }

  const specialtyMap = new Map(((providersResult.data ?? []) as Array<{ id: string; specialty: string }>).map((provider) => [provider.id, formatProviderSpecialtyLabel(provider.specialty)]));
  const trendBuckets = getDayTrendBuckets(selectedRange);
  const trendMap = new Map(trendBuckets.map((bucket) => [bucket.date, bucket]));
  const comparisonBuckets = getMonthBuckets(6).map((bucket) => ({
    ...bucket,
    appointments: 0,
    messages: 0,
    newUsers: 0,
    completed: 0,
    eligible: 0,
  }));
  const comparisonMap = new Map(comparisonBuckets.map((bucket) => [formatMonthKey(bucket.start), bucket]));
  const selectedStart = trendBuckets[0] ? startOfDay(new Date(trendBuckets[0].date)) : subDays(startOfDay(new Date()), getRangeDayCount(selectedRange) - 1);
  const activeCarePlanPatients = new Set(carePlans.filter((plan) => plan.patient_id && (plan.status ?? "active") === "active").map((plan) => String(plan.patient_id)));
  const specialtyCounts = new Map<string, number>();

  for (const employee of employees) {
    if (!employee.created_at) {
      continue;
    }

    const comparisonBucket = comparisonMap.get(formatMonthKey(employee.created_at));
    if (comparisonBucket) {
      comparisonBucket.newUsers += 1;
    }
  }

  for (const appointment of appointments) {
    const scheduledAt = new Date(appointment.scheduled_at);
    const dayBucket = trendMap.get(formatDateKey(scheduledAt));
    if (dayBucket) {
      dayBucket.appointments += 1;
      dayBucket.members.add(appointment.patient_id);
    }

    const comparisonBucket = comparisonMap.get(formatMonthKey(scheduledAt));
    if (comparisonBucket) {
      comparisonBucket.appointments += 1;
      comparisonBucket.members.add(appointment.patient_id);
      if (appointment.status !== "cancelled" && appointment.status !== "no_show") {
        comparisonBucket.eligible += 1;
      }
      if (appointment.status === "completed") {
        comparisonBucket.completed += 1;
      }
    }

    if (scheduledAt >= selectedStart) {
      const specialty = appointment.provider_id ? specialtyMap.get(appointment.provider_id) ?? "General" : "General";
      specialtyCounts.set(specialty, (specialtyCounts.get(specialty) ?? 0) + 1);
    }
  }

  const conversationPatientMap = new Map(conversations.map((conversation) => [conversation.id, conversation.patient_id]));
  for (const conversation of conversations) {
    if (!conversation.created_at) {
      continue;
    }

    const conversationDate = new Date(conversation.created_at);
    const dayBucket = trendMap.get(formatDateKey(conversationDate));
    if (dayBucket) {
      dayBucket.members.add(conversation.patient_id);
    }

    const comparisonBucket = comparisonMap.get(formatMonthKey(conversationDate));
    if (comparisonBucket) {
      comparisonBucket.members.add(conversation.patient_id);
    }
  }

  for (const message of messages) {
    if (!message.created_at) {
      continue;
    }

    const patientId = conversationPatientMap.get(message.conversation_id);
    if (!patientId) {
      continue;
    }

    const messageDate = new Date(message.created_at);
    const dayBucket = trendMap.get(formatDateKey(messageDate));
    if (dayBucket) {
      dayBucket.messages += 1;
      dayBucket.members.add(patientId);
    }

    const comparisonBucket = comparisonMap.get(formatMonthKey(messageDate));
    if (comparisonBucket) {
      comparisonBucket.messages += 1;
      comparisonBucket.members.add(patientId);
    }
  }

  const trendRows = trendBuckets.map(({ members, ...bucket }) => ({
    ...bucket,
    activeUsers: members.size,
  }));

  const specialtyTotal = Array.from(specialtyCounts.values()).reduce((sum, value) => sum + value, 0);
  const specialties = Array.from(specialtyCounts.entries())
    .map(([name, count]) => ({
      name,
      count,
      percent: specialtyTotal ? Math.round((count / specialtyTotal) * 100) : 0,
    }))
    .sort((left, right) => right.count - left.count);

  const activeUsersInRange = new Set(trendBuckets.flatMap((bucket) => Array.from(bucket.members))).size;
  const selectedAppointments = appointments.filter((appointment) => new Date(appointment.scheduled_at) >= selectedStart).length;
  const selectedConversations = conversations.filter((conversation) => conversation.created_at && new Date(conversation.created_at) >= selectedStart).length;
  const selectedMessages = messages.filter((message) => message.created_at && new Date(message.created_at) >= selectedStart).length;
  const monthSpan = Math.max(1, getRangeDayCount(selectedRange) / 30);
  const avgSessionsPerUserPerMonth = activeUsersInRange ? Number((((selectedAppointments + selectedConversations + selectedMessages) / activeUsersInRange) / monthSpan).toFixed(1)) : 0;

  const firstAppointmentMap = new Map<string, Date>();
  for (const appointment of appointments) {
    const current = firstAppointmentMap.get(appointment.patient_id);
    const scheduledAt = new Date(appointment.scheduled_at);
    if (!current || scheduledAt < current) {
      firstAppointmentMap.set(appointment.patient_id, scheduledAt);
    }
  }
  const firstAppointmentSamples = employees
    .map((employee) => {
      const firstAppointment = firstAppointmentMap.get(employee.id);
      if (!firstAppointment || !employee.created_at) {
        return null;
      }

      const diff = firstAppointment.getTime() - new Date(employee.created_at).getTime();
      return diff > 0 ? diff / (1000 * 60 * 60) : null;
    })
    .filter((value): value is number => value !== null);
  const avgHoursToFirstAppointment = firstAppointmentSamples.length ? Math.round(firstAppointmentSamples.reduce((sum, value) => sum + value, 0) / firstAppointmentSamples.length) : 0;

  const messagesByConversation = new Map<string, Array<{ senderId: string | null; createdAt: string }>>();
  for (const message of messages) {
    if (!message.created_at) continue;
    const current = messagesByConversation.get(message.conversation_id) ?? [];
    current.push({ senderId: message.sender_id, createdAt: message.created_at });
    messagesByConversation.set(message.conversation_id, current);
  }
  let patientMessages = 0;
  let repliedPatientMessages = 0;
  for (const conversation of conversations) {
    const patientId = conversation.patient_id;
    const ordered = (messagesByConversation.get(conversation.id) ?? []).sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
    ordered.forEach((message, index) => {
      if (message.senderId !== patientId) {
        return;
      }
      patientMessages += 1;
      const replied = ordered.slice(index + 1).some((next) => next.senderId && next.senderId !== patientId);
      if (replied) {
        repliedPatientMessages += 1;
      }
    });
  }
  const messageResponseRate = patientMessages ? Math.round((repliedPatientMessages / patientMessages) * 100) : 0;
  const carePlanAdoptionRate = employeeIds.length ? Math.round((activeCarePlanPatients.size / employeeIds.length) * 100) : 0;

  const monthlyComparison = comparisonBuckets.map((bucket) => ({
    month: bucket.label,
    activeUsers: bucket.members.size,
    appointments: bucket.appointments,
    messages: bucket.messages,
    newUsers: bucket.newUsers,
    completionRate: bucket.eligible ? Math.round((bucket.completed / bucket.eligible) * 100) : 0,
  }));

  return {
    employerName,
    selectedRange,
    trends: trendRows,
    specialties,
    engagement: {
      avgSessionsPerUserPerMonth,
      avgHoursToFirstAppointment,
      messageResponseRate,
      carePlanAdoptionRate,
    },
    monthlyComparison,
  };
}
