import { addDays, differenceInCalendarDays, format, startOfDay, subDays } from "date-fns";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type FertilityPageData = {
  profileName: string;
  currentCycleDay: number;
  cycleLength: number;
  fertileStatus: "fertile" | "ovulation" | "not_fertile";
  fertileStatusLabel: string;
  nextFertileWindowStart: string | null;
  nextFertileWindowEnd: string | null;
  conceptionProbability: "High" | "Medium" | "Low";
  bbtChart: Array<{ date: string; label: string; value: number | null }>;
  opkTimeline: Array<{ date: string; label: string; value: "negative" | "high" | "peak" | null }>;
  recentCycleSummary: {
    fertileWindowStart: string | null;
    fertileWindowEnd: string | null;
    ovulationDate: string | null;
    nextPeriod: string | null;
  };
};

export type PregnancyPageData = {
  profileName: string;
  activePregnancy: {
    id: string;
    dueDate: string;
    currentWeek: number;
    daysUntilDue: number;
    trimester: "First" | "Second" | "Third";
  } | null;
};

export type WellnessAssessmentSummary = {
  type: string;
  label: string;
  estimatedTime: string;
  lastCompletedAt: string | null;
};

export type WellnessPageData = {
  profileName: string;
  score: number;
  label: "Poor" | "Fair" | "Good" | "Excellent";
  lastUpdatedAt: string | null;
  breakdown: {
    moodAverage: number;
    moodTrend: "up" | "down" | "flat";
    energyAverage: number;
    energyTrend: "up" | "down" | "flat";
    sleepAverage: number;
    sleepTrend: "up" | "down" | "flat";
    symptomCount: number;
    symptomTrend: "up" | "down" | "flat";
  };
  recentData: Array<{
    loggedAt: string;
    mood: number;
    energy: number;
    sleepHours: number;
    symptoms: string[];
  }>;
  assessments: WellnessAssessmentSummary[];
};

export type SupportGroupItem = {
  id: string;
  name: string;
  description: string;
  category: string;
  moderatorName: string;
  memberCount: number;
  joined: boolean;
};

export type SupportGroupsPageData = {
  myGroups: SupportGroupItem[];
  groups: SupportGroupItem[];
};

export type InsuranceClaimItem = {
  id: string;
  createdAt: string;
  providerName: string;
  service: string;
  amountCents: number;
  status: "pending" | "submitted" | "approved" | "denied" | "paid";
};


type AdminQueryError = { message?: string } | null;

type AdminQueryResult = Promise<{ data: unknown; error: AdminQueryError }>;
type AdminQueryResolved = Awaited<AdminQueryResult>;

type MinimalQueryBuilder = {
  select: (query: string, options?: Record<string, unknown>) => MinimalQueryBuilder;
  eq: (column: string, value: unknown) => MinimalQueryBuilder;
  in: (column: string, values: readonly unknown[]) => MinimalQueryBuilder;
  order: (column: string, options?: Record<string, unknown>) => AdminQueryResult;
  maybeSingle: () => AdminQueryResult;
};

type MinimalAdminClient = {
  from: (table: string) => MinimalQueryBuilder;
};
export type InsurancePageData = {
  insuranceCarrier: string | null;
  insuranceMemberId: string | null;
  insuranceGroupNumber: string | null;
  claims: InsuranceClaimItem[];
};

function isMissingRelationError(error: { message?: string } | null, relation: string) {
  return Boolean(error?.message?.toLowerCase().includes(relation.toLowerCase()));
}

function formatProfileName(fullName: string | null | undefined, email: string | null | undefined) {
  return fullName ?? email?.split("@")[0] ?? "Maven patient";
}

function getCycleMetrics(row: Record<string, unknown> | null) {
  if (!row) {
    return {
      cycleLength: 28,
      fertileWindowStart: null as string | null,
      fertileWindowEnd: null as string | null,
      ovulationDate: null as string | null,
      nextPeriod: null as string | null,
      currentCycleDay: 1,
    };
  }

  const periodStart = typeof row.period_start === "string" ? row.period_start : null;
  const cycleLength = typeof row.cycle_length === "number" ? row.cycle_length : 28;
  const fertileWindowStart = typeof row.fertile_window_start === "string" ? row.fertile_window_start : null;
  const fertileWindowEnd = typeof row.fertile_window_end === "string" ? row.fertile_window_end : null;
  const ovulationDate = typeof row.ovulation_date === "string" ? row.ovulation_date : null;
  const nextPeriod = periodStart ? addDays(new Date(periodStart), cycleLength).toISOString() : null;
  const currentCycleDay = periodStart ? Math.max(1, differenceInCalendarDays(startOfDay(new Date()), startOfDay(new Date(periodStart))) + 1) : 1;

  return {
    cycleLength,
    fertileWindowStart,
    fertileWindowEnd,
    ovulationDate,
    nextPeriod,
    currentCycleDay,
  };
}

function getFertileStatus(cycleDay: number, fertileWindowStart: string | null, fertileWindowEnd: string | null, ovulationDate: string | null) {
  const today = format(startOfDay(new Date()), "yyyy-MM-dd");

  if (ovulationDate === today) {
    return { status: "ovulation" as const, label: "Ovulation day" };
  }

  if (fertileWindowStart && fertileWindowEnd && today >= fertileWindowStart && today <= fertileWindowEnd) {
    return { status: "fertile" as const, label: "In fertile window" };
  }

  if (cycleDay >= 12 && cycleDay <= 16) {
    return { status: "fertile" as const, label: "In fertile window" };
  }

  return { status: "not_fertile" as const, label: "Not fertile" };
}

function getConceptionProbability(status: "fertile" | "ovulation" | "not_fertile") {
  if (status === "ovulation") return "High" as const;
  if (status === "fertile") return "Medium" as const;
  return "Low" as const;
}

function average(values: number[]) {
  if (!values.length) return 0;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

function getTrend(current: number, previous: number) {
  if (current > previous + 0.2) return "up" as const;
  if (current < previous - 0.2) return "down" as const;
  return "flat" as const;
}

function getSymptomTrend(current: number, previous: number) {
  if (current > previous) return "up" as const;
  if (current < previous) return "down" as const;
  return "flat" as const;
}

function scoreLabel(score: number) {
  if (score <= 25) return "Poor" as const;
  if (score <= 50) return "Fair" as const;
  if (score <= 75) return "Good" as const;
  return "Excellent" as const;
}

export async function getPatientFertilityPageData(): Promise<FertilityPageData> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authenticated patient required.");
  }

  const [profile, supabase] = await Promise.all([getCurrentProfile(user.id), getSupabaseServerClient()]);
  const startDate = format(subDays(startOfDay(new Date()), 29), "yyyy-MM-dd");

  const [fertilityResult, cycleResult] = await Promise.all([
    supabase
      .from("fertility_data")
      .select("date, bbt_temp, opk_result")
      .eq("patient_id", user.id)
      .gte("date", startDate)
      .order("date", { ascending: true }),
    supabase
      .from("cycle_logs")
      .select("period_start, cycle_length, fertile_window_start, fertile_window_end, ovulation_date")
      .eq("patient_id", user.id)
      .order("period_start", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (fertilityResult.error) {
    throw new Error(fertilityResult.error.message);
  }
  if (cycleResult.error) {
    throw new Error(cycleResult.error.message);
  }

  const cycleMetrics = getCycleMetrics((cycleResult.data as Record<string, unknown> | null) ?? null);
  const fertileStatus = getFertileStatus(cycleMetrics.currentCycleDay, cycleMetrics.fertileWindowStart, cycleMetrics.fertileWindowEnd, cycleMetrics.ovulationDate);
  const fertilityRows = ((fertilityResult.data ?? []) as Array<Record<string, unknown>>);
  const bbtChart = fertilityRows.slice(-14).map((row) => ({
    date: String(row.date ?? ""),
    label: format(new Date(String(row.date ?? new Date().toISOString())), "MMM d"),
    value: typeof row.bbt_temp === "number" ? row.bbt_temp : null,
  }));
  const opkTimeline: FertilityPageData["opkTimeline"] = fertilityRows.slice(-7).map((row) => ({
    date: String(row.date ?? ""),
    label: format(new Date(String(row.date ?? new Date().toISOString())), "EEE"),
    value: row.opk_result === "negative" || row.opk_result === "high" || row.opk_result === "peak" ? row.opk_result : null,
  }));

  return {
    profileName: formatProfileName(profile?.full_name, user.email),
    currentCycleDay: cycleMetrics.currentCycleDay,
    cycleLength: cycleMetrics.cycleLength,
    fertileStatus: fertileStatus.status,
    fertileStatusLabel: fertileStatus.label,
    nextFertileWindowStart: cycleMetrics.fertileWindowStart,
    nextFertileWindowEnd: cycleMetrics.fertileWindowEnd,
    conceptionProbability: getConceptionProbability(fertileStatus.status),
    bbtChart,
    opkTimeline,
    recentCycleSummary: {
      fertileWindowStart: cycleMetrics.fertileWindowStart,
      fertileWindowEnd: cycleMetrics.fertileWindowEnd,
      ovulationDate: cycleMetrics.ovulationDate,
      nextPeriod: cycleMetrics.nextPeriod,
    },
  };
}

export async function getPatientPregnancyPageData(): Promise<PregnancyPageData> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authenticated patient required.");
  }

  const [profile, supabase] = await Promise.all([getCurrentProfile(user.id), getSupabaseServerClient()]);
  const { data, error } = await supabase
    .from("pregnancy_records")
    .select("id, due_date, current_week, status")
    .eq("patient_id", user.id)
    .in("status", ["active", "tracking"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const dueDate = typeof data?.due_date === "string" ? data.due_date : null;
  const activePregnancy = dueDate
    ? (() => {
        const due = startOfDay(new Date(dueDate));
        const daysUntilDue = differenceInCalendarDays(due, startOfDay(new Date()));
        const currentWeek = Math.min(40, Math.max(1, 40 - Math.floor(daysUntilDue / 7)));
        const trimester: "First" | "Second" | "Third" = currentWeek <= 13 ? "First" : currentWeek <= 27 ? "Second" : "Third";
        return {
          id: String(data?.id ?? ""),
          dueDate,
          currentWeek,
          daysUntilDue,
          trimester,
        };
      })()
    : null;

  return {
    profileName: formatProfileName(profile?.full_name, user.email),
    activePregnancy,
  };
}

export async function getPatientWellnessPageData(): Promise<WellnessPageData> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authenticated patient required.");
  }

  const [profile, supabase] = await Promise.all([getCurrentProfile(user.id), getSupabaseServerClient()]);
  const sevenDaysAgo = subDays(startOfDay(new Date()), 6).toISOString();
  const previousWindowStart = subDays(startOfDay(new Date()), 13).toISOString();

  const [currentLogsResult, previousLogsResult, assessmentsResult] = await Promise.all([
    supabase
      .from("symptom_logs")
      .select("logged_at, mood, energy, sleep_hours, symptoms")
      .eq("patient_id", user.id)
      .gte("logged_at", sevenDaysAgo)
      .order("logged_at", { ascending: false }),
    supabase
      .from("symptom_logs")
      .select("logged_at, mood, energy, sleep_hours, symptoms")
      .eq("patient_id", user.id)
      .gte("logged_at", previousWindowStart)
      .lt("logged_at", sevenDaysAgo)
      .order("logged_at", { ascending: false }),
    supabase
      .from("wellness_assessments")
      .select("assessment_type, completed_at")
      .eq("patient_id", user.id)
      .order("completed_at", { ascending: false }),
  ]);

  if (currentLogsResult.error) {
    throw new Error(currentLogsResult.error.message);
  }
  if (previousLogsResult.error) {
    throw new Error(previousLogsResult.error.message);
  }
  if (assessmentsResult.error && !isMissingRelationError(assessmentsResult.error, "wellness_assessments")) {
    throw new Error(assessmentsResult.error.message);
  }

  const currentLogs = ((currentLogsResult.data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    loggedAt: String(row.logged_at ?? new Date().toISOString()),
    mood: typeof row.mood === "number" ? row.mood : 0,
    energy: typeof row.energy === "number" ? row.energy : 0,
    sleepHours: typeof row.sleep_hours === "number" ? row.sleep_hours : 0,
    symptoms: Array.isArray(row.symptoms) ? (row.symptoms as string[]) : Array.isArray((row.symptoms as { selected?: unknown })?.selected) ? ((row.symptoms as { selected: string[] }).selected) : [],
  }));
  const previousLogs = ((previousLogsResult.data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    mood: typeof row.mood === "number" ? row.mood : 0,
    energy: typeof row.energy === "number" ? row.energy : 0,
    sleepHours: typeof row.sleep_hours === "number" ? row.sleep_hours : 0,
    symptoms: Array.isArray(row.symptoms) ? (row.symptoms as string[]) : Array.isArray((row.symptoms as { selected?: unknown })?.selected) ? ((row.symptoms as { selected: string[] }).selected) : [],
  }));

  const moodAverage = average(currentLogs.map((log) => log.mood));
  const energyAverage = average(currentLogs.map((log) => log.energy));
  const sleepAverage = average(currentLogs.map((log) => log.sleepHours));
  const symptomCount = currentLogs.reduce((sum, log) => sum + log.symptoms.length, 0);

  const moodScore = Math.round((moodAverage / 10) * 25);
  const energyScore = Math.round((energyAverage / 10) * 25);
  const sleepScore = Math.round(Math.min(sleepAverage, 8) / 8 * 25);
  const symptomScore = Math.max(0, 25 - Math.min(symptomCount, 10) * 2);
  const score = Math.max(0, Math.min(100, moodScore + energyScore + sleepScore + symptomScore));

  const assessments = [
    { type: "phq2", label: "PHQ-2 Depression Screen", estimatedTime: "2 minutes" },
    { type: "gad2", label: "GAD-2 Anxiety Screen", estimatedTime: "2 minutes" },
    { type: "sleep", label: "Sleep Quality Assessment", estimatedTime: "2 minutes" },
    { type: "energy", label: "Energy & Fatigue Screen", estimatedTime: "2 minutes" },
  ].map((assessment) => ({
    ...assessment,
    lastCompletedAt: (((assessmentsResult.data ?? []) as Array<Record<string, unknown>>).find((item) => item.assessment_type === assessment.type)?.completed_at as string | undefined) ?? null,
  }));

  return {
    profileName: formatProfileName(profile?.full_name, user.email),
    score,
    label: scoreLabel(score),
    lastUpdatedAt: currentLogs[0]?.loggedAt ?? null,
    breakdown: {
      moodAverage,
      moodTrend: getTrend(moodAverage, average(previousLogs.map((log) => log.mood))),
      energyAverage,
      energyTrend: getTrend(energyAverage, average(previousLogs.map((log) => log.energy))),
      sleepAverage,
      sleepTrend: getTrend(sleepAverage, average(previousLogs.map((log) => log.sleepHours))),
      symptomCount,
      symptomTrend: getSymptomTrend(symptomCount, previousLogs.reduce((sum, log) => sum + log.symptoms.length, 0)),
    },
    recentData: currentLogs,
    assessments,
  };
}

export async function getPatientSupportGroupsPageData(): Promise<SupportGroupsPageData> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authenticated patient required.");
  }

  const admin = getSupabaseAdminClient() as unknown as MinimalAdminClient;

  const groupsResult = await admin
    .from("support_groups")
    .select("id, name, description, category, moderator_id, active, created_at")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (groupsResult.error) {
    throw new Error(groupsResult.error.message);
  }

  const groups = (groupsResult.data ?? []) as Array<Record<string, unknown>>;
  if (!groups.length) {
    return { myGroups: [], groups: [] };
  }

  const membershipResult = await (admin
    .from("support_group_members")
    .select("group_id, user_id", { count: "exact" }) as unknown as AdminQueryResult);

  if (membershipResult.error && !isMissingRelationError(membershipResult.error, "support_group_members")) {
    throw new Error(membershipResult.error.message);
  }

  const memberships = (membershipResult.data ?? []) as Array<Record<string, unknown>>;
  const memberCountByGroup = new Map<string, number>();
  const joinedGroupIds = new Set<string>();
  for (const membership of memberships) {
    const groupId = typeof membership.group_id === "string" ? membership.group_id : null;
    const memberUserId = typeof membership.user_id === "string" ? membership.user_id : null;
    if (!groupId) continue;
    memberCountByGroup.set(groupId, (memberCountByGroup.get(groupId) ?? 0) + 1);
    if (memberUserId === user.id) {
      joinedGroupIds.add(groupId);
    }
  }

  const moderatorIds = Array.from(new Set(groups.map((group) => group.moderator_id).filter((value): value is string => typeof value === "string")));
  const moderatorProfilesResult: AdminQueryResolved = moderatorIds.length
    ? await (admin.from("profiles").select("id, full_name").in("id", moderatorIds) as unknown as AdminQueryResult)
    : { data: [], error: null };

  if (moderatorProfilesResult.error) {
    throw new Error(moderatorProfilesResult.error.message);
  }

  const moderatorMap = new Map(((moderatorProfilesResult.data ?? []) as Array<Record<string, unknown>>).map((profile) => [String(profile.id), String(profile.full_name ?? "Maven moderator")]));
  const items = groups.map((group) => ({
    id: String(group.id),
    name: String(group.name ?? "Support group"),
    description: String(group.description ?? "Moderated support group."),
    category: String(group.category ?? "general"),
    moderatorName: moderatorMap.get(String(group.moderator_id ?? "")) ?? "Maven moderator",
    memberCount: memberCountByGroup.get(String(group.id)) ?? 0,
    joined: joinedGroupIds.has(String(group.id)),
  }));

  return {
    myGroups: items.filter((group) => group.joined),
    groups: items,
  };
}

export async function getPatientInsurancePageData(): Promise<InsurancePageData> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authenticated patient required.");
  }

  const admin = getSupabaseAdminClient() as unknown as MinimalAdminClient;
  const [profileResult, claimsResult] = await Promise.all([
    admin
      .from("profiles")
      .select("insurance_carrier, insurance_member_id, insurance_group_number")
      .eq("id", user.id)
      .maybeSingle(),
    admin
      .from("insurance_claims")
      .select("id, patient_id, provider_id, service_name, amount_cents, status, created_at")
      .eq("patient_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  if (profileResult.error) {
    throw new Error(profileResult.error.message);
  }

  if (claimsResult.error && !isMissingRelationError(claimsResult.error, "insurance_claims")) {
    throw new Error(claimsResult.error.message);
  }

  const profile = (profileResult.data ?? null) as Record<string, unknown> | null;
  const claimRows = (claimsResult.data ?? []) as Array<Record<string, unknown>>;
  const providerIds = Array.from(new Set(claimRows.map((claim) => claim.provider_id).filter((value): value is string => typeof value === "string")));
  const providersResult: AdminQueryResolved = providerIds.length
    ? await (admin.from("providers").select("id, profile_id").in("id", providerIds) as unknown as AdminQueryResult)
    : { data: [], error: null };
  if (providersResult.error) {
    throw new Error(providersResult.error.message);
  }
  const profileIds = Array.from(new Set(((providersResult.data ?? []) as Array<Record<string, unknown>>).map((provider) => provider.profile_id).filter((value): value is string => typeof value === "string")));
  const providerProfilesResult: AdminQueryResolved = profileIds.length
    ? await (admin.from("profiles").select("id, full_name").in("id", profileIds) as unknown as AdminQueryResult)
    : { data: [], error: null };
  if (providerProfilesResult.error) {
    throw new Error(providerProfilesResult.error.message);
  }
  const nameMap = new Map(((providerProfilesResult.data ?? []) as Array<Record<string, unknown>>).map((item) => [String(item.id), String(item.full_name ?? "Maven provider")]));
  const providerMap = new Map(((providersResult.data ?? []) as Array<Record<string, unknown>>).map((item) => [String(item.id), nameMap.get(String(item.profile_id ?? "")) ?? "Maven provider"]));

  return {
    insuranceCarrier: typeof profile?.insurance_carrier === "string" ? profile.insurance_carrier : null,
    insuranceMemberId: typeof profile?.insurance_member_id === "string" ? profile.insurance_member_id : null,
    insuranceGroupNumber: typeof profile?.insurance_group_number === "string" ? profile.insurance_group_number : null,
    claims: claimRows.map((claim) => ({
      id: String(claim.id),
      createdAt: String(claim.created_at ?? new Date().toISOString()),
      providerName: providerMap.get(String(claim.provider_id ?? "")) ?? "Maven provider",
      service: String(claim.service_name ?? "Consultation"),
      amountCents: typeof claim.amount_cents === "number" ? claim.amount_cents : 0,
      status: ["pending", "submitted", "approved", "denied", "paid"].includes(String(claim.status ?? "pending")) ? (String(claim.status ?? "pending") as InsuranceClaimItem["status"]) : "pending",
    })),
  };
}