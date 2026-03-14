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

export function EmployerAnalyticsCharts({ mau, categories }: Props) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <Card className="h-[360px] p-5">
        <p className="mb-4 text-sm uppercase tracking-[0.2em] text-[var(--foreground-muted)]">MAU trend</p>
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mau}>
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="users" stroke="#2EA898" strokeWidth={3} dot={{ fill: "#E87D9B", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : <div className="h-full animate-pulse rounded-[24px] bg-[var(--slate-50)]" />}
      </Card>
      <Card className="h-[360px] p-5">
        <p className="mb-4 text-sm uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Top health categories used</p>
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={categories} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={4}>
                {categories.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : <div className="h-full animate-pulse rounded-[24px] bg-[var(--slate-50)]" />}
      </Card>
    </div>
  );
}
