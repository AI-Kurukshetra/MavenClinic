"use client";

import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useSyncExternalStore } from "react";
import { Card } from "@/components/ui/card";

type Props = {
  mau: { month: string; fullLabel: string; users: number }[];
  categories: { name: string; value: number; percent: number }[];
  coveredEmployees: number;
};

const colors = ["#E87D9B", "#2EA898", "#f5b942", "#8c7ce5", "#94a3b8"];
const subscribe = () => () => {};

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex h-[280px] items-center justify-center rounded-[24px] border border-dashed border-[var(--border)] bg-[var(--slate-50)] px-6 text-center text-sm leading-6 text-[var(--foreground-muted)]">
      {label}
    </div>
  );
}

function formatUtilizationRate(value: number, coveredEmployees: number, digits = 2) {
  if (!coveredEmployees) {
    return (0).toFixed(digits);
  }

  return ((value / coveredEmployees) * 100).toFixed(digits);
}

function getYAxisTicks(maxValue: number) {
  if (maxValue <= 4) {
    return Array.from({ length: maxValue + 1 }, (_, index) => index);
  }

  const step = Math.max(1, Math.ceil(maxValue / 4));
  return Array.from({ length: 5 }, (_, index) => index * step);
}

function getGrowth(currentValue: number, baselineValue: number) {
  if (baselineValue <= 0) {
    return currentValue > 0 ? 100 : 0;
  }

  return ((currentValue - baselineValue) / baselineValue) * 100;
}

export function EmployerAnalyticsCharts({ mau, categories, coveredEmployees }: Props) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const hasMauData = mau.some((entry) => entry.users > 0);
  const hasCategoryData = categories.length > 0;
  const maxMauValue = Math.max(...mau.map((entry) => entry.users), 0);
  const yAxisMax = Math.max(maxMauValue + 2, 4);
  const yAxisTicks = getYAxisTicks(maxMauValue);
  const currentMonth = mau.at(-1);
  const peakMonth = mau.reduce((best, entry) => (entry.users > best.users ? entry : best), mau[0] ?? { month: "No data", fullLabel: "No data", users: 0 });
  const baselineMonth = mau.length >= 3 ? mau[mau.length - 3] : mau[0];
  const growth = getGrowth(currentMonth?.users ?? 0, baselineMonth?.users ?? 0);
  const growthLabel = `${growth >= 0 ? "+" : ""}${growth.toFixed(0)}%`;
  const legendColumns = categories.length <= 2 ? "grid-cols-1" : "grid-cols-2";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card className="w-full overflow-hidden rounded-[28px] p-5 min-h-[420px]">
        <div className="mb-4 space-y-1">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Utilization trend</p>
          <h3 className="text-xl font-semibold tracking-tight">Monthly active users — last 6 months</h3>
        </div>
        {mounted ? (
          hasMauData ? (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={mau} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} allowDecimals={false} domain={[0, yAxisMax]} ticks={yAxisTicks} tick={{ fill: "#64748b", fontSize: 12 }} />
                  <Tooltip
                    cursor={{ stroke: "rgba(148, 163, 184, 0.24)", strokeDasharray: "4 4" }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) {
                        return null;
                      }

                      const entry = payload[0]?.payload as Props["mau"][number] | undefined;
                      if (!entry) {
                        return null;
                      }

                      return (
                        <div className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm shadow-[0_18px_40px_rgba(25,22,17,0.08)]">
                          <p className="font-medium text-[var(--foreground)]">
                            {entry.fullLabel}: {entry.users} active employees ({formatUtilizationRate(entry.users, coveredEmployees)}% utilization)
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#2EA898"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#3DBFAD" }}
                    activeDot={{ r: 6, fill: "#2EA898" }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-[var(--slate-50)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">Utilization rate</p>
                  <p className="mt-1 text-lg font-semibold tracking-tight text-[var(--foreground)]">
                    {formatUtilizationRate(currentMonth?.users ?? 0, coveredEmployees, 1)}%
                  </p>
                </div>
                <div className="rounded-2xl bg-[var(--slate-50)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">Peak month</p>
                  <p className="mt-1 text-lg font-semibold tracking-tight text-[var(--foreground)]">{peakMonth.month}</p>
                </div>
                <div className="rounded-2xl bg-[var(--slate-50)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">Growth</p>
                  <p className={`mt-1 text-lg font-semibold tracking-tight ${growth >= 0 ? "text-[var(--teal-700)]" : "text-[var(--rose-700)]"}`}>
                    {growthLabel}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <EmptyState label="Monthly activity will appear once covered employees begin booking visits or opening conversations." />
          )
        ) : <div className="h-[280px] animate-pulse rounded-[24px] bg-[var(--slate-50)]" />}
      </Card>
      <Card className="w-full overflow-hidden rounded-[28px] p-5 min-h-[320px]">
        <div className="mb-4 space-y-1">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Utilization mix</p>
          <h3 className="text-xl font-semibold tracking-tight">Top specialties used this month</h3>
        </div>
        {mounted ? (
          hasCategoryData ? (
            <div>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={categories} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4}>
                    {categories.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) {
                        return null;
                      }

                      const entry = payload[0]?.payload as Props["categories"][number] | undefined;
                      if (!entry) {
                        return null;
                      }

                      return (
                        <div className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm shadow-[0_18px_40px_rgba(25,22,17,0.08)]">
                          <p className="font-medium text-[var(--foreground)]">{entry.name}</p>
                          <p className="mt-1 text-[var(--foreground-muted)]">{entry.value} ({entry.percent}%)</p>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className={`mt-4 grid gap-x-4 gap-y-2 ${legendColumns}`}>
                {categories.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2 rounded-2xl bg-[var(--slate-50)] px-3 py-2 overflow-hidden">
                    <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: colors[index % colors.length] }} />
                    <span className="min-w-0 flex-1 truncate text-sm text-slate-600">{entry.name}</span>
                    <span className="ml-auto shrink-0 text-sm font-medium text-[var(--foreground)]">{entry.value} ({entry.percent}%)</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState label="No specialty data yet" />
          )
        ) : <div className="h-[280px] animate-pulse rounded-[24px] bg-[var(--slate-50)]" />}
      </Card>
    </div>
  );
}
