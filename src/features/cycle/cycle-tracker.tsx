"use client";

import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
} from "date-fns";
import { useState, useTransition } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Droplets, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Toast } from "@/components/ui/Toast";
import { type CycleLogInput, cycleLogSchema, FLOW_INTENSITY_OPTIONS, OPK_RESULT_OPTIONS, type OpkResult } from "@/lib/cycle-shared";
import { SYMPTOM_OPTIONS } from "@/lib/symptoms-shared";
import { cn } from "@/lib/utils";
import type { CycleLog } from "@/types/domain";

type FertilityEntry = {
  date: string;
  bbtTemp?: number;
  opkResult?: OpkResult;
} | null;

type ToastState = {
  message: string;
  variant: "success" | "error" | "info";
};

type Props = {
  logs: CycleLog[];
  fertilityEntry: FertilityEntry;
  todayIso: string;
};

const flowStyles: Record<(typeof FLOW_INTENSITY_OPTIONS)[number], string> = {
  spotting: "border-[var(--border)] bg-[var(--slate-50)] text-[var(--foreground)]",
  light: "border-transparent bg-[rgba(245,163,183,0.28)] text-[var(--rose-700)]",
  medium: "border-transparent bg-[var(--rose-400)] text-white",
  heavy: "border-transparent bg-[var(--rose-600)] text-white",
};

function getAverageCycleLength(logs: CycleLog[]) {
  if (logs.length < 2) {
    return 28;
  }

  const last3 = logs.slice(-3);
  return Math.round(last3.reduce((sum, log) => sum + log.cycleLength, 0) / last3.length);
}

function getAveragePeriodDuration(logs: CycleLog[]) {
  if (!logs.length) {
    return 5;
  }

  const last3 = logs.slice(-3);
  const average = last3.reduce((sum, log) => sum + differenceInCalendarDays(new Date(log.periodEnd), new Date(log.periodStart)) + 1, 0) / last3.length;
  return Math.max(1, Math.round(average));
}

function createDraft(date: Date): CycleLogInput {
  const formatted = format(date, "yyyy-MM-dd");
  return {
    periodStart: formatted,
    periodEnd: formatted,
    flowIntensity: "medium",
    symptoms: [],
    notes: "",
  };
}

export function CycleTracker({ logs: initialLogs, fertilityEntry, todayIso }: Props) {
  const today = startOfDay(new Date(todayIso));
  const [logs, setLogs] = useState(initialLogs);
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(today));
  const [conceptionMode, setConceptionMode] = useState(Boolean(fertilityEntry));
  const [draft, setDraft] = useState<CycleLogInput>(() => createDraft(today));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bbtValue, setBbtValue] = useState(fertilityEntry?.bbtTemp ? String(fertilityEntry.bbtTemp) : "");
  const [opkValue, setOpkValue] = useState<OpkResult | "">(fertilityEntry?.opkResult ?? "");
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isSavingLog, startLogTransition] = useTransition();
  const [isSavingFertility, startFertilityTransition] = useTransition();

  const latestLog = logs.at(-1) ?? null;
  const averageCycleLength = getAverageCycleLength(logs);
  const averagePeriodDuration = getAveragePeriodDuration(logs);
  const predictedNextPeriod = latestLog ? addDays(new Date(latestLog.periodStart), averageCycleLength) : addDays(today, averageCycleLength);
  const ovulation = subDays(predictedNextPeriod, 14);
  const fertileStart = subDays(ovulation, 5);
  const fertileEnd = addDays(ovulation, 1);
  const predictedPeriodEnd = addDays(predictedNextPeriod, averagePeriodDuration - 1);
  const nextPeriodDaysAway = Math.max(0, Math.ceil((startOfDay(predictedNextPeriod).getTime() - today.getTime()) / 86400000));
  const currentCycleDay = latestLog ? differenceInCalendarDays(today, new Date(latestLog.periodStart)) + 1 : 1;

  const monthStart = startOfWeek(startOfMonth(currentMonth));
  const monthEnd = endOfWeek(endOfMonth(currentMonth));
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  function openModal(date?: Date) {
    const nextDate = date ?? today;
    setDraft(createDraft(nextDate));
    setIsModalOpen(true);
  }

  function updateDraft<K extends keyof CycleLogInput>(key: K, value: CycleLogInput[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }


  function saveCycleLog() {
    const payload = cycleLogSchema.safeParse(draft);

    if (!payload.success) {
      setToast({ message: payload.error.issues[0]?.message ?? "Invalid cycle log.", variant: "error" });
      return;
    }

    startLogTransition(async () => {
      const response = await fetch("/api/cycle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload.data),
      });

      const data = await response.json();
      if (!response.ok) {
        setToast({ message: data.error ?? "Unable to save cycle log.", variant: "error" });
        return;
      }

      setLogs((current) => [...current, data.log as CycleLog].sort((left, right) => new Date(left.periodStart).getTime() - new Date(right.periodStart).getTime()));
      setCurrentMonth(startOfMonth(new Date((data.log as CycleLog).periodStart)));
      setIsModalOpen(false);
      setToast({ message: "Cycle log saved.", variant: "success" });
    });
  }

  function persistFertility(nextBbt: string, nextOpk: OpkResult | "") {
    startFertilityTransition(async () => {
      const bbtNumber = nextBbt.trim() ? Number(nextBbt) : undefined;
      const response = await fetch("/api/fertility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bbtTemp: typeof bbtNumber === "number" && !Number.isNaN(bbtNumber) ? bbtNumber : undefined,
          opkResult: nextOpk || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setToast({ message: data.error ?? "Unable to save fertility data.", variant: "error" });
        return;
      }

      setToast({ message: "Fertility data saved.", variant: "info" });
    });
  }

  return (
    <>
      {toast ? <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} /> : null}

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Card className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--rose-700)]">Cycle calendar</p>
              <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-white hover:bg-[var(--slate-50)]"
                  onClick={() => setCurrentMonth(startOfMonth(subDays(currentMonth, 1)))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <h2 className="text-3xl font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-white hover:bg-[var(--slate-50)]"
                  onClick={() => setCurrentMonth(startOfMonth(addDays(endOfMonth(currentMonth), 1)))}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            <Button variant="secondary" className="gap-2" onClick={() => openModal()}>
              <CalendarDays className="h-4 w-4" />
              Log Period
            </Button>
          </div>
          <div className="grid grid-cols-7 gap-2 text-center text-sm text-[var(--foreground-muted)]">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => <div key={label}>{label}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {days.map((day) => {
              const inCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const inPeriod = logs.some((log) => isWithinInterval(day, { start: new Date(log.periodStart), end: new Date(log.periodEnd) }));
              const inPredictedPeriod = isWithinInterval(day, { start: predictedNextPeriod, end: predictedPeriodEnd });
              const inFertileWindow = isWithinInterval(day, { start: fertileStart, end: fertileEnd });
              const isOvulation = isSameDay(day, ovulation);
              const isToday = isSameDay(day, today);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => openModal(day)}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-2xl border text-sm transition",
                    !inCurrentMonth && "opacity-40",
                    inPeriod
                      ? "border-transparent bg-[var(--rose-400)] text-white"
                      : inPredictedPeriod
                        ? "border border-dashed border-[rgba(245,163,183,0.9)] bg-[rgba(245,163,183,0.18)] text-[var(--rose-700)]"
                        : inFertileWindow
                          ? "border-[var(--teal-400)] bg-[rgba(61,191,173,0.12)] text-[var(--teal-700)]"
                          : "border-[var(--border)] bg-white hover:bg-[var(--slate-50)]",
                    isToday && "ring-2 ring-[rgba(148,163,184,0.9)] ring-offset-1",
                  )}
                >
                  <span className="relative">
                    {format(day, 'd')}
                    {isOvulation ? <span className="absolute -right-2 -top-1 h-2 w-2 rounded-full bg-amber-400" /> : null}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-5 rounded-[20px] bg-[var(--slate-50)] px-4 py-3 text-sm text-[var(--foreground-muted)]">
            <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[var(--rose-400)]" />Period</span>
            <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full border border-[var(--teal-400)] bg-[rgba(61,191,173,0.16)]" />Fertile window</span>
            <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-amber-400" />Ovulation</span>
            <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full border border-dashed border-[rgba(245,163,183,0.95)] bg-[rgba(245,163,183,0.18)]" />Predicted</span>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="space-y-4">
            <h3 className="text-2xl font-semibold">Cycle statistics</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-[var(--slate-50)] p-4"><p className="text-sm text-[var(--foreground-muted)]">Average cycle</p><p className="mt-2 text-2xl font-semibold">{averageCycleLength} days</p></div>
              <div className="rounded-2xl bg-[var(--slate-50)] p-4"><p className="text-sm text-[var(--foreground-muted)]">Average period</p><p className="mt-2 text-2xl font-semibold">{averagePeriodDuration} days</p></div>
              <div className="rounded-2xl bg-[var(--slate-50)] p-4"><p className="text-sm text-[var(--foreground-muted)]">Next period</p><p className="mt-2 text-xl font-semibold">{format(predictedNextPeriod, 'MMM d')} <span className="text-base text-[var(--foreground-muted)]">(in {nextPeriodDaysAway} days)</span></p></div>
              <div className="rounded-2xl bg-[var(--slate-50)] p-4"><p className="text-sm text-[var(--foreground-muted)]">Current cycle day</p><p className="mt-2 text-2xl font-semibold">Day {currentCycleDay} of {averageCycleLength}</p></div>
              <div className="rounded-2xl bg-[var(--slate-50)] p-4 sm:col-span-2"><p className="text-sm text-[var(--foreground-muted)]">Fertile window</p><p className="mt-2 text-xl font-semibold">{format(fertileStart, 'MMM d')} - {format(fertileEnd, 'MMM d')}</p></div>
            </div>
          </Card>
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-semibold">Conception mode</h3>
                <p className="text-sm text-[var(--foreground-muted)]">Enable BBT and OPK tracking when you want deeper fertility detail.</p>
              </div>
              <button
                type="button"
                onClick={() => setConceptionMode((value) => !value)}
                className={cn("flex h-8 w-14 items-center rounded-full p-1 transition", conceptionMode ? "bg-[var(--teal-500)]" : "bg-[var(--slate-100)]")}
              >
                <span className={cn("h-6 w-6 rounded-full bg-white transition", conceptionMode ? "translate-x-6" : "translate-x-0")} />
              </button>
            </div>
            {conceptionMode ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm text-[var(--foreground-muted)]">BBT</span>
                  <input
                    inputMode="decimal"
                    value={bbtValue}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setBbtValue(nextValue);
                      persistFertility(nextValue, opkValue);
                    }}
                    className="w-full rounded-2xl border border-[var(--border)] px-4 py-3"
                    placeholder="97.6"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-[var(--foreground-muted)]">OPK result</span>
                  <select
                    value={opkValue}
                    onChange={(event) => {
                      const nextValue = event.target.value as OpkResult | '';
                      setOpkValue(nextValue);
                      persistFertility(bbtValue, nextValue);
                    }}
                    className="w-full rounded-2xl border border-[var(--border)] px-4 py-3"
                  >
                    <option value="">Select result</option>
                    {OPK_RESULT_OPTIONS.map((option) => <option key={option} value={option}>{option[0].toUpperCase() + option.slice(1)}</option>)}
                  </select>
                </label>
                <div className="sm:col-span-2 rounded-[20px] bg-[var(--slate-50)] px-4 py-3 text-sm text-[var(--foreground-muted)]">
                  {isSavingFertility ? 'Saving fertility data...' : 'Today\'s fertility snapshot will be saved automatically.'}
                </div>
              </div>
            ) : null}
          </Card>
        </div>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.45)] p-4">
          <Card className="max-h-[90vh] w-full max-w-2xl overflow-auto space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-[var(--rose-700)]">Log period</p>
                <h3 className="mt-2 text-2xl font-semibold">Add a cycle entry</h3>
              </div>
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Close</Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium">Period start</span>
                <input type="date" value={draft.periodStart} onChange={(event) => updateDraft('periodStart', event.target.value)} className="h-12 w-full rounded-[20px] border border-[var(--border)] px-4" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium">Period end</span>
                <input type="date" value={draft.periodEnd} onChange={(event) => updateDraft('periodEnd', event.target.value)} className="h-12 w-full rounded-[20px] border border-[var(--border)] px-4" />
              </label>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium">Flow intensity</p>
              <div className="flex flex-wrap gap-3">
                {FLOW_INTENSITY_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => updateDraft('flowIntensity', option)}
                    className={cn(
                      'rounded-full border px-4 py-2 text-sm font-medium transition capitalize',
                      draft.flowIntensity === option ? flowStyles[option] : 'border-[var(--border)] bg-white text-[var(--foreground)] hover:bg-[var(--slate-50)]',
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium">Symptoms</p>
              <div className="flex flex-wrap gap-3">
                {SYMPTOM_OPTIONS.map((symptom) => (
                  <button
                    key={symptom}
                    type="button"
                    onClick={() => {
                      const nextSymptoms = draft.symptoms.includes(symptom)
                        ? draft.symptoms.filter((item) => item !== symptom)
                        : [...draft.symptoms, symptom];
                      updateDraft('symptoms', nextSymptoms);
                    }}
                    className={cn(
                      'rounded-full border px-4 py-2 text-sm font-medium transition',
                      draft.symptoms.includes(symptom)
                        ? 'border-transparent bg-[var(--rose-500)] text-white shadow-[0_10px_24px_rgba(212,88,123,0.24)]'
                        : 'border-[var(--border)] bg-white text-[var(--foreground)] hover:border-[var(--rose-300)] hover:bg-[var(--rose-50)]',
                    )}
                  >
                    {symptom}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <textarea
                rows={3}
                maxLength={300}
                value={draft.notes}
                onChange={(event) => updateDraft('notes', event.target.value)}
                className="min-h-[96px] w-full rounded-[24px] border border-[var(--border)] px-4 py-3"
                placeholder="Optional context about symptoms, stress, or routines."
              />
              <div className="text-right text-xs text-[var(--foreground-muted)]">{draft.notes.length}/300</div>
            </div>
            <Button type="button" className="gap-2" onClick={saveCycleLog} disabled={isSavingLog}>
              {isSavingLog ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Droplets className="h-4 w-4" />}
              {isSavingLog ? 'Saving...' : 'Save'}
            </Button>
          </Card>
        </div>
      ) : null}
    </>
  );
}
