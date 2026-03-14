import "server-only";

import { endOfDay, startOfDay, subDays } from "date-fns";
import { getCurrentUser } from "@/lib/auth";
import { generateAiInsight } from "@/lib/ai";
import { type SymptomLogInput } from "@/lib/symptoms-shared";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { SymptomLog } from "@/types/domain";

type SymptomLogRow = {
  id: string;
  logged_at: string;
  symptoms: unknown;
  mood: number | null;
  energy: number | null;
  pain_level: number | null;
  sleep_hours: number | null;
  notes: string | null;
  ai_insight: string | null;
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

export function mapSymptomLogRow(log: SymptomLogRow): SymptomLog {
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

function buildInsightPayload(logs: SymptomLog[]) {
  return logs.map((log) => ({
    loggedAt: log.loggedAt,
    symptoms: log.symptoms,
    mood: log.mood,
    energy: log.energy,
    painLevel: log.painLevel,
    sleepHours: log.sleepHours,
    notes: log.notes,
  }));
}

export async function getSymptomsTrackerData() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Authenticated patient required.");
  }

  const supabase = await getSupabaseServerClient();
  const windowStart = subDays(startOfDay(new Date()), 29).toISOString();
  const { data, error } = await supabase
    .from("symptom_logs")
    .select("id, logged_at, symptoms, mood, energy, pain_level, sleep_hours, notes, ai_insight")
    .eq("patient_id", user.id)
    .gte("logged_at", windowStart)
    .order("logged_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const logs = (data ?? []).map((log) => mapSymptomLogRow(log as SymptomLogRow));
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  const todayLog = logs.find((log) => {
    const value = new Date(log.loggedAt).getTime();
    return value >= todayStart.getTime() && value <= todayEnd.getTime();
  }) ?? null;
  const latestInsightLog = [...logs].reverse().find((log) => log.aiInsight);

  return {
    logs,
    todayLog,
    latestInsight: latestInsightLog?.aiInsight ?? null,
  };
}

export async function saveTodaySymptomLogForCurrentUser(input: SymptomLogInput) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const supabase = await getSupabaseServerClient();
  const todayStart = startOfDay(new Date()).toISOString();
  const todayEnd = endOfDay(new Date()).toISOString();

  const [{ data: existing, error: existingError }, { data: recentLogs, error: recentError }] = await Promise.all([
    supabase
      .from("symptom_logs")
      .select("id, logged_at, symptoms, mood, energy, pain_level, sleep_hours, notes, ai_insight")
      .eq("patient_id", user.id)
      .gte("logged_at", todayStart)
      .lte("logged_at", todayEnd)
      .order("logged_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("symptom_logs")
      .select("id, logged_at, symptoms, mood, energy, pain_level, sleep_hours, notes, ai_insight")
      .eq("patient_id", user.id)
      .order("logged_at", { ascending: false })
      .limit(30),
  ]);

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (recentError) {
    throw new Error(recentError.message);
  }

  const candidateLog: SymptomLog = {
    id: existing?.id ?? "pending",
    loggedAt: existing?.logged_at ?? new Date().toISOString(),
    symptoms: input.symptoms,
    mood: input.mood,
    energy: input.energy,
    painLevel: input.painLevel,
    sleepHours: input.sleepHours,
    notes: input.notes || undefined,
  };

  const history = (recentLogs ?? [])
    .map((log) => mapSymptomLogRow(log as SymptomLogRow))
    .filter((log) => log.id !== existing?.id)
    .slice(0, 29)
    .reverse();

  const aiInsight = await generateAiInsight("symptom_insight", buildInsightPayload([...history, candidateLog]));
  const payload = {
    mood: input.mood,
    energy: input.energy,
    pain_level: input.painLevel,
    sleep_hours: input.sleepHours,
    symptoms: { selected: input.symptoms },
    notes: input.notes || null,
    ai_insight: typeof aiInsight === "string" ? aiInsight : null,
  };

  const query = existing
    ? supabase
        .from("symptom_logs")
        .update(payload)
        .eq("id", existing.id)
    : supabase
        .from("symptom_logs")
        .insert({ patient_id: user.id, logged_at: new Date().toISOString(), ...payload });

  const { data, error } = await query
    .select("id, logged_at, symptoms, mood, energy, pain_level, sleep_hours, notes, ai_insight")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    mode: existing ? "updated" as const : "created" as const,
    insight: typeof aiInsight === "string" ? aiInsight : null,
    log: mapSymptomLogRow(data as SymptomLogRow),
  };
}
