import "server-only";

import { differenceInCalendarDays, format, startOfDay } from "date-fns";
import { getCurrentUser } from "@/lib/auth";
import { type CycleLogInput, type FertilitySnapshotInput, type OpkResult } from "@/lib/cycle-shared";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { CycleLog } from "@/types/domain";

type CycleLogRow = {
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
};

type FertilityDataRow = {
  id: string;
  date: string;
  bbt_temp: number | null;
  opk_result: OpkResult | null;
};

export type FertilityEntry = {
  date: string;
  bbtTemp?: number;
  opkResult?: OpkResult;
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

function mapCycleLogRow(log: CycleLogRow): CycleLog {
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

function mapFertilityRow(row: FertilityDataRow | null): FertilityEntry | null {
  if (!row) {
    return null;
  }

  return {
    date: row.date,
    bbtTemp: row.bbt_temp ?? undefined,
    opkResult: row.opk_result ?? undefined,
  };
}

export async function getCycleTrackerData() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Authenticated patient required.");
  }

  const supabase = await getSupabaseServerClient();
  const today = format(startOfDay(new Date()), "yyyy-MM-dd");

  const [{ data: logs, error: logsError }, { data: fertilityEntry, error: fertilityError }] = await Promise.all([
    supabase
      .from("cycle_logs")
      .select("id, period_start, period_end, cycle_length, flow_intensity, symptoms, ovulation_date, fertile_window_start, fertile_window_end, notes")
      .eq("patient_id", user.id)
      .order("period_start", { ascending: true }),
    supabase
      .from("fertility_data")
      .select("id, date, bbt_temp, opk_result")
      .eq("patient_id", user.id)
      .eq("date", today)
      .maybeSingle(),
  ]);

  if (logsError) {
    throw new Error(logsError.message);
  }

  if (fertilityError) {
    throw new Error(fertilityError.message);
  }

  return {
    logs: (logs ?? []).map((log) => mapCycleLogRow(log as CycleLogRow)),
    fertilityEntry: mapFertilityRow(fertilityEntry as FertilityDataRow | null),
  };
}

export async function saveCycleLogForCurrentUser(input: CycleLogInput) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const supabase = await getSupabaseServerClient();
  const { data: previousLog, error: previousError } = await supabase
    .from("cycle_logs")
    .select("period_start")
    .eq("patient_id", user.id)
    .lt("period_start", input.periodStart)
    .order("period_start", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (previousError) {
    throw new Error(previousError.message);
  }

  const cycleLength = previousLog?.period_start
    ? differenceInCalendarDays(new Date(input.periodStart), new Date(previousLog.period_start))
    : null;

  const { data, error } = await supabase
    .from("cycle_logs")
    .insert({
      patient_id: user.id,
      period_start: input.periodStart,
      period_end: input.periodEnd,
      cycle_length: cycleLength,
      flow_intensity: input.flowIntensity,
      symptoms: { selected: input.symptoms },
      notes: input.notes || null,
    })
    .select("id, period_start, period_end, cycle_length, flow_intensity, symptoms, ovulation_date, fertile_window_start, fertile_window_end, notes")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapCycleLogRow(data as CycleLogRow);
}

export async function saveTodayFertilityDataForCurrentUser(input: FertilitySnapshotInput) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const supabase = await getSupabaseServerClient();
  const today = format(startOfDay(new Date()), "yyyy-MM-dd");

  const { data, error } = await supabase
    .from("fertility_data")
    .upsert(
      {
        patient_id: user.id,
        date: today,
        bbt_temp: typeof input.bbtTemp === "number" ? input.bbtTemp : null,
        opk_result: input.opkResult ?? null,
      },
      { onConflict: "patient_id,date" },
    )
    .select("id, date, bbt_temp, opk_result")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapFertilityRow(data as FertilityDataRow) ?? { date: today };
}
