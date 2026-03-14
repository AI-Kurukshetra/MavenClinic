"use client";

import { useMemo, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { eachDayOfInterval, endOfDay, format, startOfDay, subDays } from "date-fns";
import {
  Activity,
  ChevronDown,
  ChevronUp,
  LoaderCircle,
  MoonStar,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HealthChip } from "@/components/ui/health-chip";
import { Toast } from "@/components/ui/Toast";
import { SYMPTOM_OPTIONS, type SymptomLogInput } from "@/lib/symptoms-shared";
import { cn } from "@/lib/utils";
import type { SymptomLog } from "@/types/domain";

type ToastState = {
  message: string;
  variant: "success" | "error" | "info";
};

type Props = {
  logs: SymptomLog[];
  todayLog: SymptomLog | null;
  latestInsight: string | null;
};

const subscribe = () => () => {};

const moodOptions = Array.from({ length: 10 }, (_, index) => index + 1);
const painOptions = Array.from({ length: 11 }, (_, index) => index);

function getMoodEmoji(value: number) {
  if (value <= 3) {
    return "ðŸ˜”";
  }

  if (value <= 6) {
    return "ðŸ˜";
  }

  return "ðŸ™‚";
}

function getPainClasses(value: number, selected: boolean) {
  if (value <= 3) {
    return selected ? "border-transparent bg-[var(--teal-400)] text-white" : "border-[rgba(61,191,173,0.28)] bg-[rgba(61,191,173,0.08)] text-[var(--teal-700)]";
  }

  if (value <= 6) {
    return selected ? "border-transparent bg-[rgba(245,158,11,0.9)] text-white" : "border-[rgba(245,158,11,0.24)] bg-[rgba(245,158,11,0.08)] text-[rgb(180,83,9)]";
  }

  return selected ? "border-transparent bg-[var(--rose-500)] text-white" : "border-[rgba(212,88,123,0.24)] bg-[rgba(212,88,123,0.08)] text-[var(--rose-700)]";
}

function formatLogDate(value: string) {
  return format(new Date(value), "EEE, MMM d");
}

function buildFormState(log: SymptomLog | null): SymptomLogInput {
  return {
    mood: log?.mood ?? 7,
    energy: log?.energy ?? 6,
    painLevel: log?.painLevel ?? 2,
    sleepHours: log?.sleepHours ?? 8,
    symptoms: (log?.symptoms ?? []) as SymptomLogInput["symptoms"],
    notes: log?.notes ?? "",
  };
}

function emptyChartState(label: string) {
  return (
    <div className="flex h-full items-center justify-center rounded-[24px] border border-dashed border-[var(--border)] bg-[var(--slate-50)] px-6 text-center text-sm leading-6 text-[var(--foreground-muted)]">
      {label}
    </div>
  );
}

function InsightSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-4 w-36 rounded-full bg-white/35" />
      <div className="h-4 w-full rounded-full bg-white/30" />
      <div className="h-4 w-10/12 rounded-full bg-white/25" />
      <div className="h-11 w-32 rounded-full bg-white/35" />
    </div>
  );
}

export function SymptomTracker({ logs: initialLogs, todayLog, latestInsight }: Props) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const notesRef = useRef<HTMLTextAreaElement | null>(null);
  const [logs, setLogs] = useState(initialLogs);
  const [form, setForm] = useState(() => buildFormState(todayLog));
  const [expandedLogId, setExpandedLogId] = useState<string | null>(todayLog?.id ?? null);
  const [insight, setInsight] = useState<string | null>(latestInsight);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isSaving, startSaveTransition] = useTransition();
  const [isRefreshingInsight, startInsightTransition] = useTransition();
  const [isEditMode, setIsEditMode] = useState(!todayLog);

  const latestLog = logs.at(-1) ?? null;
  const currentTodayLog = useMemo(() => {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    return [...logs].reverse().find((log) => {
      const value = new Date(log.loggedAt).getTime();
      return value >= todayStart.getTime() && value <= todayEnd.getTime();
    }) ?? null;
  }, [logs]);

  const moodEnergyData = useMemo(() => {
    const logMap = new Map(logs.map((log) => [format(new Date(log.loggedAt), "yyyy-MM-dd"), log]));
    return eachDayOfInterval({ start: subDays(startOfDay(new Date()), 29), end: startOfDay(new Date()) }).map((day) => {
      const key = format(day, "yyyy-MM-dd");
      const log = logMap.get(key);
      return {
        day: format(day, "MMM d"),
        mood: log?.mood ?? null,
        energy: log?.energy ?? null,
      };
    });
  }, [logs]);

  const symptomFrequencyData = useMemo(() => {
    const counts = new Map<string, number>();

    for (const log of logs) {
      for (const symptom of log.symptoms) {
        counts.set(symptom, (counts.get(symptom) ?? 0) + 1);
      }
    }

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((left, right) => right.count - left.count);
  }, [logs]);

  const painHistoryData = useMemo(() => {
    const logMap = new Map(logs.map((log) => [format(new Date(log.loggedAt), "yyyy-MM-dd"), log]));
    return eachDayOfInterval({ start: subDays(startOfDay(new Date()), 13), end: startOfDay(new Date()) }).map((day) => {
      const key = format(day, "yyyy-MM-dd");
      const log = logMap.get(key);
      const pain = log?.painLevel ?? null;
      return {
        day: format(day, "MMM d"),
        lowPain: pain !== null && pain <= 3 ? pain : null,
        moderatePain: pain !== null && pain >= 4 && pain <= 6 ? pain : null,
        highPain: pain !== null && pain >= 7 ? pain : null,
      };
    });
  }, [logs]);

  const recentLogs = useMemo(() => [...logs].slice(-7).reverse(), [logs]);

  function updateForm<K extends keyof SymptomLogInput>(key: K, value: SymptomLogInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleSymptom(symptom: SymptomLogInput["symptoms"][number]) {
    setForm((current) => ({
      ...current,
      symptoms: current.symptoms.includes(symptom)
        ? current.symptoms.filter((item) => item !== symptom)
        : [...current.symptoms, symptom],
    }));
  }

  function resizeNotes(target: HTMLTextAreaElement) {
    target.style.height = "0px";
    target.style.height = `${Math.min(target.scrollHeight, 112)}px`;
  }

  function upsertLog(nextLog: SymptomLog) {
    setLogs((current) => {
      const existingIndex = current.findIndex((log) => log.id === nextLog.id);
      if (existingIndex >= 0) {
        return current.map((log) => log.id === nextLog.id ? nextLog : log);
      }

      return [...current, nextLog].sort((left, right) => new Date(left.loggedAt).getTime() - new Date(right.loggedAt).getTime());
    });
  }

  function refreshFormFromLog(log: SymptomLog) {
    setForm(buildFormState(log));
    if (notesRef.current) {
      notesRef.current.value = log.notes ?? "";
      resizeNotes(notesRef.current);
    }
  }

  function getInsightPayload() {
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

  function handleSubmit() {
    startSaveTransition(async () => {
      const response = await fetch("/api/symptoms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setToast({ message: data.error ?? "Unable to save today's symptoms.", variant: "error" });
        return;
      }

      upsertLog(data.log as SymptomLog);
      setInsight(data.insight ?? null);
      setExpandedLogId(String(data.log.id));
      refreshFormFromLog(data.log as SymptomLog);
      setIsEditMode(false);
      setToast({
        message: data.mode === "updated" ? "Today's symptom log was updated." : "Today's symptoms were logged.",
        variant: "success",
      });
    });
  }

  function refreshInsight() {
    if (!latestLog) {
      return;
    }

    startInsightTransition(async () => {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "symptom_insight",
          logId: latestLog.id,
          data: getInsightPayload(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setToast({ message: data.error ?? "Unable to refresh your insight.", variant: "error" });
        return;
      }

      const nextInsight = typeof data.result === "string" ? data.result : null;
      setInsight(nextInsight);
      if (nextInsight) {
        setLogs((current) => current.map((log) => log.id === latestLog.id ? { ...log, aiInsight: nextInsight } : log));
      }
      setToast({ message: "Insight refreshed.", variant: "info" });
    });
  }

  return (
    <>
      {toast ? <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} /> : null}

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Card className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-[var(--rose-700)]">Today&apos;s log</p>
              <h2 className="mt-2 text-3xl font-semibold">Track how you feel today.</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--foreground-muted)]">
                Capture mood, energy, pain, sleep, and symptoms in one place so your patterns are easier to spot over time.
              </p>
            </div>
            {currentTodayLog ? (
              <div className="space-y-2 text-right">
                <div className="rounded-full bg-[var(--rose-50)] px-4 py-2 text-sm font-medium text-[var(--rose-700)]">
                  {isEditMode ? "Editing today&apos;s log" : "Already logged today"}
                </div>
                {!isEditMode ? (
                  <button
                    type="button"
                    className="text-sm font-medium text-[var(--rose-700)] underline-offset-4 hover:underline"
                    onClick={() => setIsEditMode(true)}
                  >
                    Already logged today - click to edit
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Mood</p>
                <p className="text-xs text-[var(--foreground-muted)]">1-3 low, 4-6 steady, 7-10 uplifted</p>
              </div>
              <div className="text-2xl">{getMoodEmoji(form.mood)}</div>
            </div>
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
              {moodOptions.map((value) => {
                const selected = form.mood === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => updateForm("mood", value)}
                    className={cn(
                      "rounded-[20px] border px-3 py-3 text-center transition",
                      selected
                        ? "border-transparent bg-[var(--rose-500)] text-white shadow-[0_12px_32px_rgba(212,88,123,0.26)]"
                        : "border-[var(--border)] bg-white hover:border-[var(--rose-300)] hover:bg-[var(--rose-50)]",
                    )}
                  >
                    <div className="text-lg">{getMoodEmoji(value)}</div>
                    <div className="mt-1 text-sm font-semibold">{value}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">Energy</p>
                <p className="text-xs text-[var(--foreground-muted)]">Exhausted to energized</p>
              </div>
              <div className="text-sm font-medium text-[var(--teal-700)]">{form.energy}/10</div>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={form.energy}
              onChange={(event) => updateForm("energy", Number(event.target.value))}
              className="w-full accent-[var(--teal-500)]"
            />
            <div className="flex justify-between text-xs text-[var(--foreground-muted)]">
              <span>Exhausted</span>
              <span>Energized</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">Pain level</p>
                <p className="text-xs text-[var(--foreground-muted)]">0-3 low, 4-6 moderate, 7-10 high</p>
              </div>
              <div className="text-sm font-medium text-[var(--foreground)]">{form.painLevel}/10</div>
            </div>
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-11">
              {painOptions.map((value) => {
                const selected = form.painLevel === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => updateForm("painLevel", value)}
                    className={cn("rounded-[18px] border px-2 py-3 text-sm font-semibold transition", getPainClasses(value, selected))}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Sleep hours</label>
              <div className="relative">
                <MoonStar className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
                <input
                  type="number"
                  min="4"
                  max="12"
                  step="0.5"
                  value={form.sleepHours}
                  onChange={(event) => updateForm("sleepHours", Number(event.target.value))}
                  className="h-12 w-full rounded-[20px] border border-[var(--border)] bg-white pl-11 pr-4 text-sm"
                />
              </div>
            </div>
            <div className="rounded-[20px] bg-[var(--slate-50)] px-4 py-3 text-sm text-[var(--foreground-muted)]">
              Goal: 4-12 hours
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold">Symptoms</p>
              <p className="text-xs text-[var(--foreground-muted)]">Select all that apply today</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {SYMPTOM_OPTIONS.map((symptom) => (
                <HealthChip
                  key={symptom}
                  label={symptom}
                  selected={form.symptoms.includes(symptom)}
                  onToggle={() => toggleSymptom(symptom)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Notes</label>
            <textarea
              ref={notesRef}
              rows={3}
              maxLength={500}
              value={form.notes}
              onChange={(event) => {
                updateForm("notes", event.target.value);
                resizeNotes(event.target);
              }}
              className="min-h-[84px] max-h-28 w-full resize-none rounded-[24px] border border-[var(--border)] px-4 py-3 text-sm leading-6"
              placeholder="Add context about sleep, stress, appetite, bleeding, or routines."
            />
            <div className="text-right text-xs text-[var(--foreground-muted)]">{form.notes.length}/500</div>
          </div>

          <div className="space-y-2">
            <Button
              type="button"
              className="w-full gap-2 sm:w-auto"
              onClick={handleSubmit}
              disabled={isSaving || (Boolean(currentTodayLog) && !isEditMode)}
            >
              {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
              {isSaving ? "Saving..." : currentTodayLog ? "Update Log" : "Log Today"}
            </Button>
            {currentTodayLog && !isEditMode ? (
              <p className="text-sm text-[var(--foreground-muted)]">Already logged today - click to edit</p>
            ) : null}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="space-y-4 bg-[linear-gradient(135deg,rgba(61,191,173,0.18),rgba(46,168,152,0.08))]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--teal-700)]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Your Health Insight
                </div>
                <h3 className="mt-3 text-2xl font-semibold">Daily AI support</h3>
              </div>
              <Button type="button" variant="secondary" className="gap-2" onClick={refreshInsight} disabled={!latestLog || isRefreshingInsight}>
                {isRefreshingInsight ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Refresh insight
              </Button>
            </div>
            {isRefreshingInsight ? (
              <InsightSkeleton />
            ) : insight ? (
              <p className="text-sm leading-7 text-[var(--teal-800)]">{insight}</p>
            ) : (
              <p className="text-sm leading-7 text-[var(--teal-800)]">Log your first symptoms to get personalized insights.</p>
            )}
          </Card>

          <Card className="h-[320px] p-5">
            <p className="mb-4 text-sm uppercase tracking-[0.2em] text-[var(--foreground-muted)]">30-day mood + energy</p>
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={moodEnergyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(45,45,45,0.08)" />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} domain={[1, 10]} />
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={20} />
                  <Line type="monotone" dataKey="mood" stroke="#E87D9B" strokeWidth={3} dot={{ r: 3 }} name="Mood" connectNulls={false} />
                  <Line type="monotone" dataKey="energy" stroke="#3DBFAD" strokeWidth={3} dot={{ r: 3 }} name="Energy" connectNulls={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full animate-pulse rounded-[24px] bg-[var(--slate-50)]" />
            )}
          </Card>

          <Card className="h-[320px] p-5">
            <p className="mb-4 text-sm uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Symptom frequency</p>
            {symptomFrequencyData.length ? mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={symptomFrequencyData} margin={{ bottom: 32 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(45,45,45,0.08)" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={72} tickLine={false} axisLine={false} interval={0} />
                  <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#E87D9B" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full animate-pulse rounded-[24px] bg-[var(--slate-50)]" />
            ) : emptyChartState("Your symptom frequency chart will appear once you start logging symptoms.")}
          </Card>

          <Card className="h-[300px] p-5">
            <p className="mb-4 text-sm uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Pain level history</p>
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={painHistoryData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(45,45,45,0.08)" />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} domain={[0, 10]} />
                  <Tooltip />
                  <Area type="monotone" dataKey="lowPain" stroke="#3DBFAD" fill="rgba(61,191,173,0.25)" connectNulls={false} />
                  <Area type="monotone" dataKey="moderatePain" stroke="#F59E0B" fill="rgba(245,158,11,0.18)" connectNulls={false} />
                  <Area type="monotone" dataKey="highPain" stroke="#E87D9B" fill="rgba(232,125,155,0.22)" connectNulls={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full animate-pulse rounded-[24px] bg-[var(--slate-50)]" />
            )}
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Recent logs</p>
                <h3 className="mt-2 text-2xl font-semibold">Last 7 days</h3>
              </div>
            </div>
            {recentLogs.length ? (
              <div className="space-y-3">
                {recentLogs.map((log) => {
                  const expanded = expandedLogId === log.id;
                  return (
                    <button
                      key={log.id}
                      type="button"
                      onClick={() => setExpandedLogId(expanded ? null : log.id)}
                      className="w-full rounded-[24px] border border-[var(--border)] bg-white px-4 py-4 text-left transition hover:bg-[var(--slate-50)]"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold">{formatLogDate(log.loggedAt)}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[var(--foreground-muted)]">
                            <span>{getMoodEmoji(log.mood)} Mood {log.mood}/10</span>
                            <span>â€¢</span>
                            <span className="inline-flex items-center gap-2">
                              Energy
                              <span className="relative h-2 w-16 overflow-hidden rounded-full bg-[var(--slate-100)]">
                                <span className="absolute inset-y-0 left-0 rounded-full bg-[var(--teal-400)]" style={{ width: `${(log.energy / 10) * 100}%` }} />
                              </span>
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
                          <span>{expanded ? "Hide details" : "View details"}</span>
                          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {log.symptoms.length ? log.symptoms.map((symptom) => (
                          <span key={symptom} className="rounded-full bg-[var(--slate-50)] px-3 py-1 text-xs font-medium text-[var(--foreground)]">
                            {symptom}
                          </span>
                        )) : <span className="text-sm text-[var(--foreground-muted)]">No symptoms selected</span>}
                      </div>
                      {expanded ? (
                        <div className="mt-4 space-y-3 border-t border-[var(--border)] pt-4 text-sm text-[var(--foreground-muted)]">
                          <div className="flex flex-wrap gap-4">
                            <span>Sleep: {log.sleepHours ?? "-"} hrs</span>
                            <span>Pain: {log.painLevel}/10</span>
                            <span>Energy: {log.energy}/10</span>
                          </div>
                          {log.notes ? <p className="leading-6 text-[var(--foreground)]">{log.notes}</p> : <p>No notes added.</p>}
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-[var(--border)] bg-[var(--slate-50)] px-6 py-10 text-center text-sm leading-6 text-[var(--foreground-muted)]">
                Your recent logs will appear here once you complete your first daily check-in.
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}