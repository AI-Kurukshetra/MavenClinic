"use client";

import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useSyncExternalStore } from "react";
import { Card } from "@/components/ui/card";

type Props = {
  mau: { month: string; users: number }[];
  categories: { name: string; value: number }[];
};

const colors = ["#E87D9B", "#2EA898", "#f5b942", "#8c7ce5", "#a3a3a3"];
const subscribe = () => () => {};

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-[24px] border border-dashed border-[var(--border)] bg-[var(--slate-50)] px-6 text-center text-sm leading-6 text-[var(--foreground-muted)]">
      {label}
    </div>
  );
}

export function EmployerAnalyticsCharts({ mau, categories }: Props) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const hasMauData = mau.some((entry) => entry.users > 0);
  const hasCategoryData = categories.length > 0;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <Card className="h-[360px] p-5">
        <p className="mb-4 text-sm uppercase tracking-[0.2em] text-[var(--foreground-muted)]">MAU trend</p>
        {mounted ? (
          hasMauData ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mau}>
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="users" stroke="#2EA898" strokeWidth={3} dot={{ fill: "#E87D9B", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label="Monthly activity will appear once covered employees begin booking visits or opening conversations." />
          )
        ) : <div className="h-full animate-pulse rounded-[24px] bg-[var(--slate-50)]" />}
      </Card>
      <Card className="h-[360px] p-5">
        <p className="mb-4 text-sm uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Top specialties used</p>
        {mounted ? (
          hasCategoryData ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categories} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={4}>
                  {categories.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label="Specialty utilization will appear after covered employees start completing visits." />
          )
        ) : <div className="h-full animate-pulse rounded-[24px] bg-[var(--slate-50)]" />}
      </Card>
    </div>
  );
}
