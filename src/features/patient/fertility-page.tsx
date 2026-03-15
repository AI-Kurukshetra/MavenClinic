"use client";

import Link from "next/link";
import { HeartPulse, LineChart as LineChartIcon, MessageCircle, Sparkles } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { FertilityPageData } from "@/lib/patient-pages";
import { formatDate } from "@/lib/utils";

function getStatusVariant(status: FertilityPageData["fertileStatus"]) {
  if (status === "fertile") return "success" as const;
  if (status === "ovulation") return "warning" as const;
  return "neutral" as const;
}

function getOpkVariant(value: "negative" | "high" | "peak" | null) {
  if (value === "peak") return "success" as const;
  if (value === "high") return "warning" as const;
  return "neutral" as const;
}

export function FertilityPage({ currentCycleDay, cycleLength, fertileStatus, fertileStatusLabel, nextFertileWindowStart, nextFertileWindowEnd, conceptionProbability, bbtChart, opkTimeline }: FertilityPageData) {
  const hasBbtData = bbtChart.some((point) => typeof point.value === "number");

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="space-y-5 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-[var(--rose-700)]">Fertility overview</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">Cycle timing for conception planning</h2>
            </div>
            <Badge variant={getStatusVariant(fertileStatus)}>{fertileStatusLabel}</Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[24px] bg-[var(--slate-50)] p-5"><p className="text-sm text-[var(--foreground-muted)]">Current cycle day</p><p className="mt-2 text-3xl font-semibold tracking-tight">Day {currentCycleDay}</p><p className="mt-1 text-sm text-[var(--foreground-muted)]">of {cycleLength}</p></div>
            <div className="rounded-[24px] bg-[var(--slate-50)] p-5"><p className="text-sm text-[var(--foreground-muted)]">Next fertile window</p><p className="mt-2 text-lg font-semibold tracking-tight">{nextFertileWindowStart ? `${formatDate(nextFertileWindowStart, "MMM d")} - ${formatDate(nextFertileWindowEnd ?? nextFertileWindowStart, "MMM d")}` : "Not enough data yet"}</p></div>
            <div className="rounded-[24px] bg-[var(--slate-50)] p-5"><p className="text-sm text-[var(--foreground-muted)]">Conception probability</p><p className="mt-2 text-3xl font-semibold tracking-tight">{conceptionProbability}</p><p className="mt-1 text-sm text-[var(--foreground-muted)]">based on this week&apos;s timing</p></div>
          </div>
        </Card>
        <Card className="space-y-4 p-6">
          <div><p className="text-sm uppercase tracking-[0.18em] text-[var(--rose-700)]">Conception tips</p><h3 className="mt-2 text-2xl font-semibold tracking-tight">This week&apos;s guidance</h3></div>
          <div className="space-y-3">
            <div className="rounded-[22px] border border-[var(--border)] p-4"><div className="flex items-center gap-3"><Sparkles className="h-5 w-5 text-[var(--teal-700)]" /><p className="font-medium">Best timing</p></div><p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">{conceptionProbability === "High" ? "Today and the next day are your strongest timing window for conception." : conceptionProbability === "Medium" ? "This is a good window to stay consistent with timing while ovulation approaches." : "Keep tracking so your next fertile window is easier to plan around."}</p></div>
            <div className="rounded-[22px] border border-[var(--border)] p-4"><div className="flex items-center gap-3"><HeartPulse className="h-5 w-5 text-[var(--rose-600)]" /><p className="font-medium">Lifestyle support</p></div><p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">Protect sleep, hydration, and regular meals this week so cycle-related patterns stay easier to interpret.</p></div>
            <div className="rounded-[22px] border border-[var(--border)] p-4"><div className="flex items-center gap-3"><MessageCircle className="h-5 w-5 text-[var(--teal-700)]" /><p className="font-medium">Need support?</p></div><div className="mt-3 flex flex-wrap gap-3"><Link href="/messages?topic=fertility planning" className="inline-flex h-10 items-center justify-center rounded-full bg-[var(--rose-500)] px-4 text-sm font-medium text-white transition hover:bg-[var(--rose-600)]">Message your fertility specialist</Link><Link href="/cycle" className="inline-flex h-10 items-center justify-center rounded-full border border-[var(--border)] px-4 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--slate-50)]">View full cycle calendar</Link></div></div>
          </div>
        </Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="space-y-4 p-6">
          <div className="flex items-center gap-3"><LineChartIcon className="h-5 w-5 text-[var(--teal-700)]" /><div><h3 className="text-2xl font-semibold tracking-tight">BBT chart</h3><p className="text-sm text-[var(--foreground-muted)]">Last 14 days of basal body temperature</p></div></div>
          {hasBbtData ? <div className="h-[280px] w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={bbtChart}><XAxis dataKey="label" tickLine={false} axisLine={false} /><YAxis domain={[96, 100]} tickLine={false} axisLine={false} width={44} /><Tooltip formatter={(value) => typeof value === "number" ? `${value.toFixed(1)} deg F` : "No reading"} /><Line type="monotone" dataKey="value" stroke="#3DBFAD" strokeWidth={3} dot={{ r: 4, fill: "#3DBFAD" }} activeDot={{ r: 5 }} connectNulls /></LineChart></ResponsiveContainer></div> : <div className="rounded-[24px] border border-dashed border-[var(--border)] px-5 py-10 text-center"><h4 className="text-xl font-semibold tracking-tight">No BBT data yet</h4><p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">Enable conception mode in your cycle tracker and log your temperature daily to build this chart.</p></div>}
        </Card>
        <Card className="space-y-4 p-6">
          <div><h3 className="text-2xl font-semibold tracking-tight">OPK tracking</h3><p className="text-sm text-[var(--foreground-muted)]">Last 7 days of ovulation predictor results</p></div>
          {opkTimeline.length ? <div className="flex flex-wrap gap-3">{opkTimeline.map((item) => <div key={item.date} className="rounded-[22px] border border-[var(--border)] p-4 text-center"><p className="text-xs uppercase tracking-[0.16em] text-[var(--foreground-muted)]">{item.label}</p><div className="mt-3"><Badge variant={getOpkVariant(item.value)}>{item.value ? item.value.toUpperCase() : "NO LOG"}</Badge></div></div>)}</div> : <div className="rounded-[24px] border border-dashed border-[var(--border)] px-5 py-10 text-center text-sm text-[var(--foreground-muted)]">No OPK entries in the last week.</div>}
        </Card>
      </div>
    </div>
  );
}