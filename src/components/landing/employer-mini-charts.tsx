"use client";

import { useSyncExternalStore } from "react";
import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const trendData = [
  { month: "Jan", users: 320 },
  { month: "Feb", users: 460 },
  { month: "Mar", users: 610 },
  { month: "Apr", users: 780 },
  { month: "May", users: 920 },
  { month: "Jun", users: 1100 },
];

const specialtyData = [
  { name: "OB/GYN", value: 38 },
  { name: "Fertility", value: 24 },
  { name: "Mental", value: 18 },
  { name: "Nutrition", value: 12 },
  { name: "Other", value: 8 },
];

const colors = ["#E87D9B", "#3DBFAD", "#F59E0B", "#CBD5E1", "#94A3B8"];
const subscribe = () => () => {};

type TooltipProps = {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
};

function TrendTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white px-3 py-2 text-xs text-[var(--foreground)] shadow-[0_16px_36px_rgba(25,22,17,0.08)]">
      <p className="font-semibold">{label}</p>
      <p className="mt-1 text-[var(--foreground-muted)]">{payload[0]?.value} active users</p>
    </div>
  );
}

export function EmployerMiniCharts() {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  if (!mounted) {
    return (
      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="h-52 animate-pulse rounded-[28px] bg-white/70" />
        <div className="h-52 animate-pulse rounded-[28px] bg-white/70" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="h-52 rounded-[28px] bg-white p-4 shadow-[0_22px_60px_rgba(29,24,17,0.08)]">
        <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">
          <span>Monthly active users</span>
          <span className="rounded-full bg-[var(--rose-50)] px-3 py-1 text-[var(--rose-700)]">+18%</span>
        </div>
        <ResponsiveContainer width="100%" height="88%">
          <LineChart data={trendData}>
            <XAxis dataKey="month" tickLine={false} axisLine={false} stroke="#94A3B8" fontSize={11} />
            <YAxis hide />
            <Tooltip content={<TrendTooltip />} cursor={{ stroke: "rgba(232,125,155,0.16)", strokeWidth: 1 }} />
            <Line type="monotone" dataKey="users" stroke="#E87D9B" strokeWidth={3} dot={{ r: 3, fill: "#3DBFAD" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid h-52 gap-4 rounded-[28px] bg-white p-4 shadow-[0_22px_60px_rgba(29,24,17,0.08)] sm:grid-cols-[0.9fr_1.1fr] lg:grid-cols-1 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="h-28 sm:h-full lg:h-28 xl:h-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={specialtyData} dataKey="value" innerRadius={22} outerRadius={38} paddingAngle={3}>
                {specialtyData.map((item, index) => (
                  <Cell key={item.name} fill={colors[index % colors.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col justify-between text-sm">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Top specialties</p>
            <p className="mt-1 text-xl font-semibold text-[var(--foreground)]">Employee satisfaction</p>
          </div>
          <div className="space-y-3">
            <div className="space-y-2">
              {specialtyData.slice(0, 3).map((item, index) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                    <span className="text-[var(--foreground-muted)]">{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[var(--foreground-muted)]">Score</span>
                <span className="font-semibold">87%</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--slate-100)]">
                <div className="h-2 w-[87%] rounded-full bg-[var(--teal-400)]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
