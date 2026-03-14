import { addDays, differenceInCalendarDays, endOfDay, startOfDay, subDays } from "date-fns";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth";
import { generateAiInsight } from "@/lib/ai";
import {
  mockAppointments,
  mockCycleLogs,
  mockEducation,
  mockEmployerMetrics,
  mockMessages,
  mockProfile,
  mockProviders,
  mockRecords,
  mockSymptomLogs,
} from "@/lib/mock-data";
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
      .select("id, logged_at, symptoms, mood, energy, pain_level, notes, ai_insight")
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
  const aiInsight = symptomLogs.length
    ? await generateAiInsight(
        "symptom_insight",
        symptomLogs.map((log) => ({
          loggedAt: log.loggedAt,
          symptoms: log.symptoms,
          mood: log.mood,
          energy: log.energy,
          painLevel: log.painLevel,
          notes: log.notes,
        })),
      )
    : null;

  return {
    profile,
    nextAppointment,
    cycleSummary,
    latestSymptomLog,
    aiInsight,
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

export async function getEmployerAnalyticsData() {
  return mockEmployerMetrics;
}

export async function getClinicDashboardData() {
  return {
    providerManagement: [
      { id: "prov-1", name: "Dr. Sarah Chen", specialty: "OB/GYN", status: "Pending approval", submittedAt: "Mar 12", action: "Approve" },
      { id: "prov-2", name: "Dr. Amara Osei", specialty: "Fertility", status: "Active", submittedAt: "Mar 3", action: "Suspend" },
      { id: "prov-3", name: "Dr. Maya Patel", specialty: "Mental Health", status: "Under review", submittedAt: "Mar 14", action: "Review" },
    ],
    contentLibrary: [
      { id: "article-1", title: "Understanding fertility lab basics", audience: "Patients", status: "Published", updatedAt: "2 hours ago" },
      { id: "article-2", title: "When to escalate menopause symptom reports", audience: "Providers", status: "Draft", updatedAt: "Today" },
      { id: "article-3", title: "Returning to care after pregnancy loss", audience: "Support groups", status: "Scheduled", updatedAt: "Tomorrow" },
    ],
    supportGroups: [
      { id: "group-1", name: "Trying to Conceive Circle", moderator: "Naomi Ellis", members: 148, status: "Stable" },
      { id: "group-2", name: "PCOS Peer Support", moderator: "Open assignment", members: 203, status: "Needs moderator" },
      { id: "group-3", name: "Menopause Transitions", moderator: "Claire Dawson", members: 96, status: "Escalation flagged" },
    ],
    compliance: [
      { id: "audit-1", event: "Provider status changed to active", actor: "Clinic Admin", timestamp: "Mar 14, 10:12 AM", severity: "Low" },
      { id: "audit-2", event: "Article published to patient library", actor: "Content Lead", timestamp: "Mar 14, 9:05 AM", severity: "Low" },
      { id: "audit-3", event: "Moderator access reviewed", actor: "Compliance Officer", timestamp: "Mar 13, 6:48 PM", severity: "Medium" },
      { id: "audit-4", event: "Provider suspension requested", actor: "Clinic Admin", timestamp: "Mar 13, 2:17 PM", severity: "High" },
    ],
  };
}
