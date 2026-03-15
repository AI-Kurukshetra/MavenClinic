import { addDays, differenceInCalendarDays, format, isAfter, isBefore, isSameDay, startOfMonth, startOfWeek } from "date-fns";
import { redirect } from "next/navigation";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth";
import { getSpecialtyLabel } from "@/lib/appointments";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatDate, formatDateTime, formatRelativeTime } from "@/lib/utils";

export type PartnerAccessLevel = "view_appointments" | "view_pregnancy" | "view_fertility" | "full";

type PartnerAccessRow = {
  id: string;
  patient_id: string;
  partner_id: string;
  access_level: PartnerAccessLevel;
  created_at: string | null;
  revoked_at: string | null;
};

type ProfileNameRow = {
  id: string;
  full_name: string | null;
  avatar_url?: string | null;
};

type AppointmentRow = {
  id: string;
  patient_id: string | null;
  provider_id: string | null;
  scheduled_at: string;
  type: string | null;
  status: string | null;
  created_at: string | null;
};

type ProviderRow = {
  id: string;
  profile_id: string | null;
  specialty: string;
};

type PregnancyRecordRow = {
  id: string;
  patient_id: string;
  partner_id: string | null;
  status: string | null;
  current_week: number | null;
  due_date: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type CycleLogRow = {
  id: string;
  patient_id: string | null;
  period_start: string | null;
  period_end: string | null;
  cycle_length: number | null;
  ovulation_date: string | null;
  fertile_window_start: string | null;
  fertile_window_end: string | null;
};

type FertilityDataRow = {
  id: string;
  date: string;
  bbt_temp: number | null;
  opk_result: string | null;
};

type ConversationRow = {
  id: string;
  patient_id: string;
  provider_profile_id: string | null;
  created_at: string | null;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  content: string;
  created_at: string | null;
};

type NotificationRow = {
  id: string;
  recipient_id: string | null;
  actor_id: string | null;
  type: string | null;
  title: string;
  body: string | null;
  created_at: string | null;
};

type QueryResult<T> = PromiseLike<{ data: T | null; error: { message?: string } | null }>;

export type PartnerAccessFlags = {
  appointments: boolean;
  pregnancy: boolean;
  fertility: boolean;
  messages: boolean;
};

export type PartnerPortalContext = {
  hasActiveAccess: boolean;
  accessId: string;
  accessLevel: PartnerAccessLevel;
  accessLabel: string;
  grantedAt: string | null;
  patientId: string;
  patientName: string;
  patientFirstName: string;
  partnerId: string;
  partnerName: string;
  flags: PartnerAccessFlags;
};

export type PartnerAppointmentItem = {
  id: string;
  providerName: string;
  providerSpecialty: string;
  scheduledAt: string;
  type: string;
  status: string;
  createdAt: string | null;
};

export type PartnerActivityItem = {
  id: string;
  kind: "appointment" | "pregnancy" | "message";
  title: string;
  description: string;
  date: string;
  relativeTime: string;
};

export type PartnerPregnancySummary = {
  id: string;
  currentWeek: number;
  dueDate: string;
  dueDateLabel: string;
  daysUntilDue: number;
  trimester: "First" | "Second" | "Third";
  progressPercent: number;
  milestoneTitle: string;
  milestoneNote: string;
  milestoneSize: string;
  timeline: Array<{ title: string; dateLabel: string; description: string }>;
};

export type PartnerFertilitySummary = {
  currentCycleDay: number;
  cycleLength: number;
  nextPredictedPeriod: string | null;
  nextPredictedPeriodLabel: string;
  daysUntilPeriod: number | null;
  fertileWindowStart: string | null;
  fertileWindowEnd: string | null;
  fertileWindowLabel: string;
  ovulationDate: string | null;
  ovulationLabel: string;
  statusLabel: string;
  statusTone: "teal" | "slate";
  latestFertilityEntry: FertilityDataRow | null;
  calendar: Array<{
    date: string;
    dayNumber: string;
    inCurrentMonth: boolean;
    isToday: boolean;
    isPeriod: boolean;
    isFertile: boolean;
    isOvulation: boolean;
  }>;
};

export type PartnerConversation = {
  id: string;
  providerName: string;
  providerSpecialty: string;
  lastUpdatedLabel: string;
  messages: Array<{
    id: string;
    sender: "patient" | "provider";
    senderName: string;
    content: string;
    createdAtLabel: string;
  }>;
};

const accessDescriptions: Record<PartnerAccessLevel, string> = {
  view_appointments: "Appointments",
  view_pregnancy: "Pregnancy",
  view_fertility: "Fertility",
  full: "Appointments + Pregnancy + Fertility + Messages",
};

const pregnancyMilestones = [
  ["poppy seed", "The pregnancy journey begins with early cell growth and implantation."],
  ["sesame seed", "The neural tube is forming and the earliest foundations are in place."],
  ["lentil", "Tiny facial features are starting to form this week."],
  ["blueberry", "The heart is beating steadily and major organs are taking shape."],
  ["raspberry", "Arm and leg buds are becoming more defined every day."],
  ["lime", "Brain development is accelerating and tiny fingers are appearing."],
  ["peach", "Reflexes begin to emerge as the nervous system matures."],
  ["plum", "Movement is becoming more coordinated even if it cannot be felt yet."],
  ["olive", "Features like eyelids and ears continue refining."],
  ["strawberry", "Bones are hardening and early tooth buds are forming."],
  ["fig", "The placenta is doing more of the heavy lifting now."],
  ["lime", "By the end of the first trimester, growth is steady and foundational systems are in place."],
  ["lemon", "Second-trimester growth brings more defined facial expressions."],
  ["nectarine", "Limbs are lengthening and movement is becoming stronger."],
  ["apple", "Hearing structures are developing and the body is stretching out."],
  ["avocado", "The spine and muscles are gaining strength."],
  ["pear", "Fat stores start to build as growth continues."],
  ["sweet potato", "Hearing improves and routines may start to become more regular."],
  ["mango", "Sensory development continues and movement patterns are more coordinated."],
  ["banana", "The halfway point often brings the anatomy scan milestone."],
  ["carrot", "Digestive development continues as growth stays steady."],
  ["spaghetti squash", "Sleep and wake cycles become more pronounced."],
  ["grapefruit", "The skin is still delicate while fat stores keep building."],
  ["ear of corn", "Lungs are developing rapidly this week and movements may feel stronger."],
  ["rutabaga", "Balance and coordination continue improving."],
  ["scallion bunch", "The third trimester is getting closer as growth remains consistent."],
  ["cauliflower", "The third trimester begins and lung maturation remains a major focus."],
  ["eggplant", "Eyes can open and close, and the body keeps adding healthy fat."],
  ["butternut squash", "Muscles and lungs continue preparing for life outside the womb."],
  ["cabbage", "The brain is growing quickly and body temperature regulation improves."],
  ["coconut", "Kick patterns may feel more established this week."],
  ["jicama", "Practice breathing movements continue as lungs mature."],
  ["pineapple", "The immune system is getting more support through transferred antibodies."],
  ["cantaloupe", "The body is rounding out as delivery planning gets closer."],
  ["honeydew", "The nervous system keeps refining and movement may feel stronger but tighter."],
  ["romaine heart", "By now, the body is focused on final growth and readiness."],
  ["winter melon", "Full term is approaching and final positioning may begin."],
  ["pumpkin", "Growth slows slightly while organ systems continue maturing."],
  ["small watermelon", "At full term, the focus is on steady movement and labor readiness."],
  ["mini watermelon", "The final week is about monitoring movement and preparing for delivery cues."],
] as const;

function getFlags(accessLevel: PartnerAccessLevel): PartnerAccessFlags {
  return {
    appointments: accessLevel === "view_appointments" || accessLevel === "full",
    pregnancy: accessLevel === "view_pregnancy" || accessLevel === "full",
    fertility: accessLevel === "view_fertility" || accessLevel === "full",
    messages: accessLevel === "full",
  };
}

async function safeRows<T>(query: QueryResult<T[]>): Promise<T[]> {
  try {
    const result = await query;
    if (result.error) {
      return [];
    }

    return result.data ?? [];
  } catch {
    return [];
  }
}

async function safeMaybeSingle<T>(query: QueryResult<T>): Promise<T | null> {
  try {
    const result = await query;
    if (result.error) {
      return null;
    }

    return result.data;
  } catch {
    return null;
  }
}

function firstName(fullName: string) {
  return fullName.split(" ")[0] ?? fullName;
}

function getTrimester(week: number): "First" | "Second" | "Third" {
  if (week <= 13) return "First";
  if (week <= 27) return "Second";
  return "Third";
}

function getAppointmentTypeLabel(value?: string | null) {
  if (value === "async_review") return "Async review";
  if (value === "messaging") return "Messaging";
  return "Video visit";
}

function getAccessChips(flags: PartnerAccessFlags) {
  return [
    { key: "appointments", label: "Appointments", granted: flags.appointments },
    { key: "pregnancy", label: "Pregnancy", granted: flags.pregnancy },
    { key: "fertility", label: "Fertility", granted: flags.fertility },
    { key: "messages", label: "Messages", granted: flags.messages },
  ];
}

export async function getPartnerPortalContext(): Promise<PartnerPortalContext> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const admin = getSupabaseAdminClient();
  const access = await safeMaybeSingle<PartnerAccessRow>(
    admin
      .from("partner_access")
      .select("id, patient_id, partner_id, access_level, created_at, revoked_at")
      .eq("partner_id", user.id)
      .is("revoked_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  );

  const partnerProfile = await getCurrentProfile(user.id);
  const partnerName = partnerProfile?.full_name ?? user.email?.split("@")[0] ?? "Support partner";

  if (!access) {
    return {
      hasActiveAccess: false,
      accessId: `pending-${user.id}`,
      accessLevel: "view_appointments",
      accessLabel: "No access shared yet",
      grantedAt: null,
      patientId: "",
      patientName: "your partner",
      patientFirstName: "your partner",
      partnerId: user.id,
      partnerName,
      flags: {
        appointments: false,
        pregnancy: false,
        fertility: false,
        messages: false,
      },
    };
  }

  const profiles = await safeRows<ProfileNameRow>(
    admin.from("profiles").select("id, full_name").in("id", [access.patient_id, access.partner_id]),
  );
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile.full_name ?? "Maven member"]));
  const patientName = profileMap.get(access.patient_id) ?? "Maven patient";

  return {
    hasActiveAccess: true,
    accessId: access.id,
    accessLevel: access.access_level,
    accessLabel: accessDescriptions[access.access_level],
    grantedAt: access.created_at,
    patientId: access.patient_id,
    patientName,
    patientFirstName: firstName(patientName),
    partnerId: access.partner_id,
    partnerName,
    flags: getFlags(access.access_level),
  };
}

async function getProviderLookup(providerIds: string[]) {
  const admin = getSupabaseAdminClient();
  const providers = providerIds.length
    ? await safeRows<ProviderRow>(admin.from("providers").select("id, profile_id, specialty").in("id", providerIds))
    : [];
  const profileIds = providers.map((provider) => provider.profile_id).filter((value): value is string => Boolean(value));
  const profiles = profileIds.length
    ? await safeRows<ProfileNameRow>(admin.from("profiles").select("id, full_name, avatar_url").in("id", profileIds))
    : [];
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

  return new Map(
    providers.map((provider) => [
      provider.id,
      {
        name: provider.profile_id ? profileMap.get(provider.profile_id)?.full_name ?? "Provider" : "Provider",
        specialty: getSpecialtyLabel(provider.specialty),
      },
    ]),
  );
}

async function getUpcomingAppointments(patientId: string): Promise<PartnerAppointmentItem[]> {
  const admin = getSupabaseAdminClient();
  const rows = await safeRows<AppointmentRow>(
    admin
      .from("appointments")
      .select("id, patient_id, provider_id, scheduled_at, type, status, created_at")
      .eq("patient_id", patientId)
      .eq("status", "scheduled")
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true }),
  );
  const providerLookup = await getProviderLookup(rows.map((row) => row.provider_id).filter((value): value is string => Boolean(value)));

  return rows.map((row) => ({
    id: row.id,
    providerName: row.provider_id ? providerLookup.get(row.provider_id)?.name ?? "Provider" : "Provider",
    providerSpecialty: row.provider_id ? providerLookup.get(row.provider_id)?.specialty ?? "Care" : "Care",
    scheduledAt: row.scheduled_at,
    type: getAppointmentTypeLabel(row.type),
    status: row.status ?? "scheduled",
    createdAt: row.created_at,
  }));
}

async function getPregnancySummary(context: PartnerPortalContext): Promise<PartnerPregnancySummary | null> {
  const admin = getSupabaseAdminClient();
  const record = await safeMaybeSingle<PregnancyRecordRow>(
    admin
      .from("pregnancy_records")
      .select("id, patient_id, partner_id, status, current_week, due_date, created_at, updated_at")
      .eq("patient_id", context.patientId)
      .eq("partner_id", context.partnerId)
      .in("status", ["active", "tracking"])
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  );

  if (!record || !record.due_date || !record.current_week) {
    return null;
  }

  const dueDate = new Date(record.due_date);
  const currentWeek = Math.min(Math.max(record.current_week, 1), 40);
  const trimester = getTrimester(currentWeek);
  const daysUntilDue = differenceInCalendarDays(dueDate, new Date());
  const weekGuide = pregnancyMilestones[currentWeek - 1] ?? pregnancyMilestones[23];
  const timeline = [
    { week: 20, title: "20-week anatomy scan", description: "Detailed anatomy review and growth check." },
    { week: 26, title: "Glucose test window", description: "Screening often happens between weeks 24 and 28." },
    { week: 27, title: "Third trimester begins", description: "Support planning and birth preparation start to ramp up." },
    { week: 37, title: "Full term milestone", description: "Baby is considered full term at week 37." },
  ]
    .filter((item) => item.week >= currentWeek)
    .slice(0, 4)
    .map((item) => ({
      title: item.title,
      dateLabel: formatDate(addDays(dueDate, (item.week - 40) * 7)),
      description: item.description,
    }));

  return {
    id: record.id,
    currentWeek,
    dueDate: record.due_date,
    dueDateLabel: formatDate(record.due_date),
    daysUntilDue,
    trimester,
    progressPercent: Math.min(Math.round((currentWeek / 40) * 100), 100),
    milestoneTitle: `Baby is the size of a ${weekGuide[0]}`,
    milestoneNote: weekGuide[1],
    milestoneSize: weekGuide[0],
    timeline,
  };
}

async function getFertilitySummary(context: PartnerPortalContext): Promise<PartnerFertilitySummary | null> {
  const admin = getSupabaseAdminClient();
  const logs = await safeRows<CycleLogRow>(
    admin
      .from("cycle_logs")
      .select("id, patient_id, period_start, period_end, cycle_length, ovulation_date, fertile_window_start, fertile_window_end")
      .eq("patient_id", context.patientId)
      .order("period_start", { ascending: false })
      .limit(12),
  );

  if (!logs.length) {
    return null;
  }

  const latestLog = logs[0];
  const latestFertilityEntry = await safeMaybeSingle<FertilityDataRow>(
    admin
      .from("fertility_data")
      .select("id, date, bbt_temp, opk_result")
      .eq("patient_id", context.patientId)
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle(),
  );

  if (!latestLog.period_start) {
    return null;
  }

  const cycleLength = latestLog.cycle_length ?? 28;
  const today = new Date();
  const periodStart = new Date(latestLog.period_start);
  const currentCycleDay = Math.max(differenceInCalendarDays(today, periodStart) + 1, 1);
  const nextPredictedPeriodDate = addDays(periodStart, cycleLength);
  const fertileStart = latestLog.fertile_window_start ? new Date(latestLog.fertile_window_start) : null;
  const fertileEnd = latestLog.fertile_window_end ? new Date(latestLog.fertile_window_end) : null;
  const ovulationDate = latestLog.ovulation_date ? new Date(latestLog.ovulation_date) : null;
  const fertileActive = fertileStart && fertileEnd ? !isBefore(today, fertileStart) && !isAfter(today, fertileEnd) : false;

  const monthStart = startOfMonth(today);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendar = Array.from({ length: 42 }, (_, index) => {
    const date = addDays(gridStart, index);
    const iso = format(date, "yyyy-MM-dd");
    const isPeriod = logs.some((log) => {
      if (!log.period_start) return false;
      const start = new Date(log.period_start);
      const end = new Date(log.period_end ?? log.period_start);
      return !isBefore(date, start) && !isAfter(date, end);
    });
    const isFertile = logs.some((log) => {
      if (!log.fertile_window_start || !log.fertile_window_end) return false;
      const start = new Date(log.fertile_window_start);
      const end = new Date(log.fertile_window_end);
      return !isBefore(date, start) && !isAfter(date, end);
    });
    const isOvulation = logs.some((log) => log.ovulation_date && isSameDay(date, new Date(log.ovulation_date)));

    return {
      date: iso,
      dayNumber: format(date, "d"),
      inCurrentMonth: date.getMonth() === today.getMonth(),
      isToday: isSameDay(date, today),
      isPeriod,
      isFertile,
      isOvulation,
    };
  });

  return {
    currentCycleDay,
    cycleLength,
    nextPredictedPeriod: format(nextPredictedPeriodDate, "yyyy-MM-dd"),
    nextPredictedPeriodLabel: `${formatDate(nextPredictedPeriodDate)} (${differenceInCalendarDays(nextPredictedPeriodDate, today)} days away)`,
    daysUntilPeriod: differenceInCalendarDays(nextPredictedPeriodDate, today),
    fertileWindowStart: fertileStart ? format(fertileStart, "yyyy-MM-dd") : null,
    fertileWindowEnd: fertileEnd ? format(fertileEnd, "yyyy-MM-dd") : null,
    fertileWindowLabel: fertileStart && fertileEnd ? `${formatDate(fertileStart, "MMM d")} to ${formatDate(fertileEnd, "MMM d")}` : "Not enough data yet",
    ovulationDate: ovulationDate ? format(ovulationDate, "yyyy-MM-dd") : null,
    ovulationLabel: ovulationDate ? formatDate(ovulationDate) : "Not enough data yet",
    statusLabel: fertileActive ? "Fertile window active" : "Not in fertile window",
    statusTone: fertileActive ? "teal" : "slate",
    latestFertilityEntry,
    calendar,
  };
}

async function getRecentActivity(context: PartnerPortalContext): Promise<PartnerActivityItem[]> {
  const admin = getSupabaseAdminClient();
  const items: PartnerActivityItem[] = [];

  if (context.flags.appointments) {
    const appointments = await safeRows<AppointmentRow>(
      admin
        .from("appointments")
        .select("id, patient_id, provider_id, scheduled_at, type, status, created_at")
        .eq("patient_id", context.patientId)
        .order("created_at", { ascending: false })
        .limit(4),
    );
    const providerLookup = await getProviderLookup(appointments.map((row) => row.provider_id).filter((value): value is string => Boolean(value)));
    for (const appointment of appointments.slice(0, 2)) {
      items.push({
        id: `appointment-${appointment.id}`,
        kind: "appointment",
        title: "Appointment scheduled",
        description: `${appointment.provider_id ? providerLookup.get(appointment.provider_id)?.name ?? "Provider" : "Provider"} on ${formatDateTime(appointment.scheduled_at)}`,
        date: appointment.created_at ?? appointment.scheduled_at,
        relativeTime: formatRelativeTime(appointment.created_at ?? appointment.scheduled_at),
      });
    }
  }

  if (context.flags.pregnancy) {
    const pregnancy = await getPregnancySummary(context);
    if (pregnancy) {
      items.push({
        id: `pregnancy-${pregnancy.id}`,
        kind: "pregnancy",
        title: `Week ${pregnancy.currentWeek} milestone`,
        description: pregnancy.milestoneNote,
        date: pregnancy.dueDate,
        relativeTime: `${pregnancy.daysUntilDue} days until due date`,
      });
    }
  }

  if (context.flags.messages) {
    const notifications = await safeRows<NotificationRow>(
      admin
        .from("notifications")
        .select("id, recipient_id, actor_id, type, title, body, created_at")
        .eq("recipient_id", context.patientId)
        .order("created_at", { ascending: false })
        .limit(6),
    );
    for (const item of notifications.filter((entry) => (entry.type ?? "").includes("message")).slice(0, 2)) {
      items.push({
        id: `message-${item.id}`,
        kind: "message",
        title: "Provider message sent",
        description: item.title,
        date: item.created_at ?? new Date().toISOString(),
        relativeTime: formatRelativeTime(item.created_at ?? new Date().toISOString()),
      });
    }
  }

  return items.sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime()).slice(0, 5);
}

export async function getPartnerDashboardPageData() {
  const context = await getPartnerPortalContext();
  const [appointments, pregnancy, fertility, recentActivity] = await Promise.all([
    context.hasActiveAccess && context.flags.appointments ? getUpcomingAppointments(context.patientId) : Promise.resolve([]),
    context.hasActiveAccess && context.flags.pregnancy ? getPregnancySummary(context) : Promise.resolve(null),
    context.hasActiveAccess && context.flags.fertility ? getFertilitySummary(context) : Promise.resolve(null),
    context.hasActiveAccess ? getRecentActivity(context) : Promise.resolve([]),
  ]);

  return {
    context,
    accessChips: getAccessChips(context.flags),
    nextAppointment: appointments[0] ?? null,
    pregnancy,
    fertility,
    recentActivity,
  };
}

export async function getPartnerAppointmentsPageData() {
  const context = await getPartnerPortalContext();
  const appointments = context.hasActiveAccess && context.flags.appointments ? await getUpcomingAppointments(context.patientId) : [];
  return { context, appointments };
}

export async function getPartnerPregnancyPageData() {
  const context = await getPartnerPortalContext();
  const pregnancy = context.hasActiveAccess && context.flags.pregnancy ? await getPregnancySummary(context) : null;
  return { context, pregnancy };
}

export async function getPartnerFertilityPageData() {
  const context = await getPartnerPortalContext();
  const fertility = context.hasActiveAccess && context.flags.fertility ? await getFertilitySummary(context) : null;
  return { context, fertility };
}

export async function getPartnerMessagesPageData() {
  const context = await getPartnerPortalContext();
  if (!context.hasActiveAccess || !context.flags.messages) {
    return { context, conversations: [] as PartnerConversation[] };
  }

  const admin = getSupabaseAdminClient();
  const conversations = await safeRows<ConversationRow>(
    admin.from("conversations").select("id, patient_id, provider_profile_id, created_at").eq("patient_id", context.patientId).order("created_at", { ascending: false }),
  );
  const providerProfileIds = conversations.map((item) => item.provider_profile_id).filter((value): value is string => Boolean(value));
  const providers = providerProfileIds.length
    ? await safeRows<ProfileNameRow>(admin.from("profiles").select("id, full_name").in("id", providerProfileIds))
    : [];
  const providerRows = providerProfileIds.length
    ? await safeRows<{ profile_id: string | null; specialty: string }>(admin.from("providers").select("profile_id, specialty").in("profile_id", providerProfileIds))
    : [];
  const messageRows = conversations.length
    ? await safeRows<MessageRow>(admin.from("messages").select("id, conversation_id, sender_id, content, created_at").in("conversation_id", conversations.map((item) => item.id)).order("created_at", { ascending: true }))
    : [];

  const providerMap = new Map(providers.map((item) => [item.id, item.full_name ?? "Provider"]));
  const specialtyMap = new Map(
    providerRows.filter((row): row is { profile_id: string; specialty: string } => Boolean(row.profile_id)).map((row) => [row.profile_id, getSpecialtyLabel(row.specialty)]),
  );
  const messagesByConversation = new Map<string, MessageRow[]>();
  for (const row of messageRows) {
    const list = messagesByConversation.get(row.conversation_id) ?? [];
    list.push(row);
    messagesByConversation.set(row.conversation_id, list);
  }

  return {
    context,
    conversations: conversations.map((conversation) => ({
      id: conversation.id,
      providerName: conversation.provider_profile_id ? providerMap.get(conversation.provider_profile_id) ?? "Provider" : "Provider",
      providerSpecialty: conversation.provider_profile_id ? specialtyMap.get(conversation.provider_profile_id) ?? "Care team" : "Care team",
      lastUpdatedLabel: formatDateTime((messagesByConversation.get(conversation.id) ?? [])[messagesByConversation.get(conversation.id)?.length ? (messagesByConversation.get(conversation.id)?.length ?? 1) - 1 : 0]?.created_at ?? conversation.created_at ?? new Date().toISOString()),
      messages: (messagesByConversation.get(conversation.id) ?? []).map((message) => ({
        id: message.id,
        sender: message.sender_id === context.patientId ? "patient" : "provider",
        senderName: message.sender_id === context.patientId ? context.patientFirstName : conversation.provider_profile_id ? providerMap.get(conversation.provider_profile_id) ?? "Provider" : "Provider",
        content: message.content,
        createdAtLabel: formatDateTime(message.created_at ?? new Date().toISOString()),
      })),
    })),
  };
}

export async function getPartnerSettingsPageData() {
  const context = await getPartnerPortalContext();
  return {
    context,
    accessChips: getAccessChips(context.flags),
  };
}




