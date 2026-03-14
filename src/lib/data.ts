import { addDays, differenceInCalendarDays, endOfDay, startOfDay, subDays } from "date-fns";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth";
import { generateAiInsight } from "@/lib/ai";
import {
  mockAppointments,
  mockCycleLogs,
  mockEducation,
  mockMessages,
  mockProfile,
  mockProviders,
  mockRecords,
  mockSymptomLogs,
} from "@/lib/mock-data";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Appointment, CycleLog, MessageThread, Provider, SymptomLog } from "@/types/domain";

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
  const { data: profileRows } = profileIds.length
    ? await supabase.from("profiles").select("id, full_name, avatar_url").in("id", profileIds)
    : { data: [] as Array<{ id: string; full_name: string | null; avatar_url: string | null }> };
  const profileMap = new Map((profileRows ?? []).map((profile) => [profile.id, profile]));

  return new Map(
    data.map((provider) => {
      const profile = provider.profile_id ? profileMap.get(provider.profile_id) : undefined;
      const specialtyLabel = provider.specialty.replaceAll("_", " ").replace(/\b\w/g, (char: string) => char.toUpperCase());

      return [
        provider.id,
        {
          id: provider.id,
          profileId: provider.profile_id ?? undefined,
          fullName: profile?.full_name ?? `${specialtyLabel} specialist`,
          specialty: provider.specialty as Provider["specialty"],
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

async function getDashboardMessageThreads(userId: string): Promise<MessageThread[]> {
  const supabase = await getSupabaseServerClient();
  const { data: conversations, error: conversationsError } = await supabase
    .from("conversations")
    .select("id, provider_profile_id")
    .eq("patient_id", userId)
    .order("created_at", { ascending: false });

  if (conversationsError) {
    throw new Error(conversationsError.message);
  }

  if (!conversations?.length) {
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
      ? supabase.from("profiles").select("id, full_name, avatar_url").in("id", providerProfileIds)
      : Promise.resolve({ data: [] as Array<{ id: string; full_name: string | null; avatar_url: string | null }>, error: null }),
    providerProfileIds.length
      ? supabase.from("providers").select("profile_id, specialty").in("profile_id", providerProfileIds)
      : Promise.resolve({ data: [] as Array<{ profile_id: string | null; specialty: string }>, error: null }),
    supabase
      .from("messages")
      .select("id, conversation_id, sender_id, content, read_at, created_at")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false }),
  ]);

  if (providerProfilesResult.error) {
    throw new Error(providerProfilesResult.error.message);
  }

  if (providerRowsResult.error) {
    throw new Error(providerRowsResult.error.message);
  }

  if (messageRowsResult.error) {
    throw new Error(messageRowsResult.error.message);
  }

  const profileMap = new Map((providerProfilesResult.data ?? []).map((profile) => [profile.id, profile]));
  const providerMetaMap = new Map(
    (providerRowsResult.data ?? [])
      .filter((provider): provider is { profile_id: string; specialty: string } => Boolean(provider.profile_id))
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

async function getRealProfile() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Authenticated patient required.");
  }

  const profile = await getCurrentProfile(user.id);
  const fullName = profile?.full_name ?? user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Maven user";

  return {
    id: user.id,
    role: profile?.role ?? "patient",
    fullName,
    firstName: fullName.split(" ")[0] ?? fullName,
    onboardingComplete: Boolean(profile?.onboarding_complete),
  };
}

export async function getPatientDashboardData() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Authenticated patient required.");
  }

  const profile = await getRealProfile();
  const supabase = await getSupabaseServerClient();
  const symptomWindowStart = subDays(new Date(), 13).toISOString();

  const [nextAppointmentResult, latestCycleResult, symptomLogsResult, carePlanResult, messages] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, patient_id, provider_id, scheduled_at, duration_minutes, type, status, chief_complaint, video_room_url, notes")
      .eq("patient_id", user.id)
      .eq("status", "scheduled")
      .order("scheduled_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("cycle_logs")
      .select("id, period_start, period_end, cycle_length, flow_intensity, symptoms, ovulation_date, fertile_window_start, fertile_window_end, notes")
      .eq("patient_id", user.id)
      .order("period_start", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("symptom_logs")
      .select("id, logged_at, symptoms, mood, energy, pain_level, sleep_hours, notes, ai_insight")
      .eq("patient_id", user.id)
      .gte("logged_at", symptomWindowStart)
      .order("logged_at", { ascending: true }),
    supabase
      .from("care_plans")
      .select("id, title, description, status, milestones")
      .eq("patient_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    getDashboardMessageThreads(user.id),
  ]);

  if (nextAppointmentResult.error) {
    throw new Error(nextAppointmentResult.error.message);
  }

  if (latestCycleResult.error) {
    throw new Error(latestCycleResult.error.message);
  }

  if (symptomLogsResult.error) {
    throw new Error(symptomLogsResult.error.message);
  }

  if (carePlanResult.error) {
    throw new Error(carePlanResult.error.message);
  }

  const appointmentProviderIds = nextAppointmentResult.data?.provider_id ? [nextAppointmentResult.data.provider_id] : [];
  const providerMap = appointmentProviderIds.length ? await getProviderMap(appointmentProviderIds) : new Map<string, Provider>();
  const nextAppointment = nextAppointmentResult.data
    ? (() => {
        const provider = providerMap.get(nextAppointmentResult.data.provider_id);

        if (!provider) {
          return null;
        }

        return {
          id: nextAppointmentResult.data.id,
          patientId: nextAppointmentResult.data.patient_id,
          providerId: nextAppointmentResult.data.provider_id,
          providerName: provider.fullName,
          providerSpecialty: provider.specialtyLabel,
          scheduledAt: nextAppointmentResult.data.scheduled_at,
          durationMinutes: nextAppointmentResult.data.duration_minutes ?? 30,
          type: nextAppointmentResult.data.type,
          status: nextAppointmentResult.data.status,
          chiefComplaint: nextAppointmentResult.data.chief_complaint ?? "General follow-up",
          videoRoomUrl: nextAppointmentResult.data.video_room_url ?? undefined,
          notes: nextAppointmentResult.data.notes ?? undefined,
        } satisfies Appointment;
      })()
    : null;

  const latestCycle = latestCycleResult.data ? mapCycleLogRow(latestCycleResult.data) : null;
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

  const symptomLogs = (symptomLogsResult.data ?? []).map(mapSymptomLogRow);
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
  const aiInsight = latestSymptomLog?.aiInsight ?? (insightPayload.length ? await generateAiInsight("symptom_insight", insightPayload) : null);

  return {
    profile,
    nextAppointment,
    cycleSummary,
    latestSymptomLog,
    aiInsight,
    insightPayload,
    carePlan: parseCarePlan(carePlanResult.data),
    messages,
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

export async function getRecordsData() {
  return { records: mockRecords };
}

export async function getEducationData() {
  return { articles: mockEducation };
}

export async function getProviderDashboardData() {
  const { userId, providerId } = await getCurrentProviderRecord();
  const supabase = await getSupabaseServerClient();
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
      .select("patient_id, status")
      .eq("provider_id", providerId)
      .eq("status", "active"),
    supabase
      .from("conversations")
      .select("id")
      .eq("provider_profile_id", userId),
    supabase
      .from("provider_availability")
      .select("id, day_of_week, start_time, end_time, location")
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
      ? supabase.from("profiles").select("id, full_name").in("id", patientIds)
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
  const activeCarePlanPatientIds = new Set((activeCarePlansResult.data ?? []).map((plan) => plan.patient_id).filter(Boolean));

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

    return {
      id: patientId,
      name: patientProfileMap.get(patientId) ?? "Patient",
      lastVisit: lastAppointment?.scheduled_at ?? new Date().toISOString(),
      carePlan: activeCarePlanPatientIds.has(patientId) ? "Active" : "No active plan",
      reason: lastAppointment?.chief_complaint ?? "No chief complaint on file",
    };
  });

  const availability: ProviderAvailabilitySlot[] = (availabilityResult.data ?? []).map((slot) => ({
    id: slot.id,
    dayOfWeek: slot.day_of_week,
    startTime: slot.start_time,
    endTime: slot.end_time,
    location: slot.location ?? "Virtual",
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

function getMonthBuckets(count: number) {
  const now = new Date();

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (count - index - 1), 1);
    return {
      label: date.toLocaleString("en-US", { month: "short" }),
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

export async function getEmployerAnalyticsData() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Authenticated employer admin required.");
  }

  const supabase = await getSupabaseServerClient();
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
    mau: buckets.map((bucket) => ({ month: bucket.label, users: 0 })),
    categories: [] as Array<{ name: string; value: number }>,
  };

  const { data: profile, error: profileError } = await supabase
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

  const admin = (() => {
    try {
      return getSupabaseAdminClient();
    } catch {
      return null;
    }
  })();

  if (!admin) {
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
    company_name: string;
    employee_count: number | null;
    plan_type: string | null;
    contract_end: string | null;
  } | null;
  const employeeIds = ((employeesResult.data ?? []) as Array<{ id: string }>).map((employee) => employee.id);
  const coveredEmployees = employeeIds.length || employer?.employee_count || 0;

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
      .select("patient_id, provider_id, status, scheduled_at")
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
  const categoryCounts = new Map<string, number>();

  for (const appointment of appointments) {
    const label = appointment.provider_id ? specialtyMap.get(appointment.provider_id) ?? "General" : "General";
    categoryCounts.set(label, (categoryCounts.get(label) ?? 0) + 1);
  }

  const mau = buckets.map((bucket) => ({ month: bucket.label, users: bucket.members.size }));

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
    categories: Array.from(categoryCounts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 5),
  };
}

export async function getClinicDashboardData() {
  const emptyData = {
    stats: {
      activeProviders: 0,
      pendingInvites: 0,
      openConversations: 0,
      recentNotifications: 0,
    },
    providerManagement: [] as Array<{
      id: string;
      name: string;
      specialty: string;
      status: string;
      submittedAt: string;
      action: string;
    }>,
    invitationQueue: [] as Array<{
      id: string;
      email: string;
      status: string;
      createdAt: string;
      expiresAt: string;
    }>,
    conversationLoad: [] as Array<{
      id: string;
      providerName: string;
      openThreads: number;
      unreadMessages: number;
      lastActivity: string;
    }>,
    notifications: [] as Array<{
      id: string;
      event: string;
      actor: string;
      timestamp: string;
      severity: string;
    }>,
  };

  const admin = (() => {
    try {
      return getSupabaseAdminClient();
    } catch {
      return null;
    }
  })();

  if (!admin) {
    return emptyData;
  }

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
          ? `${Number(provider.total_reviews ?? 0)} reviews Â· ${Number(provider.rating ?? 5).toFixed(1)} rating`
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


