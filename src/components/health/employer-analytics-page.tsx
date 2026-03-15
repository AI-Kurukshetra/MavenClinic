"use client";

import type { Route } from "next";
import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { EmployerAdvancedAnalyticsData } from "@/lib/data";

const colors = ["#E87D9B", "#2EA898", "#F5B942", "#8C7CE5", "#94A3B8", "#34D399"];
const rangeOptions = [
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "180d", label: "Last 6 months" },
  { value: "365d", label: "Last 1 year" },
] as const;

type Props = EmployerAdvancedAnalyticsData;

function EmptyChart({ label }: { label: string }) {
  return <div className="flex h-[320px] items-center justify-center rounded-[24px] border border-dashed border-[var(--border)] bg-[var(--slate-50)] px-6 text-center text-sm leading-6 text-[var(--foreground-muted)]">{label}</div>;
}

export function EmployerAnalyticsPage({ employerName, selectedRange, trends, specialties, engagement, monthlyComparison }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const hasTrendData = trends.some((entry) => entry.activeUsers > 0 || entry.appointments > 0 || entry.messages > 0);
  const bestValues = useMemo(() => ({
    activeUsers: Math.max(...monthlyComparison.map((row) => row.activeUsers), 0),
    appointments: Math.max(...monthlyComparison.map((row) => row.appointments), 0),
    messages: Math.max(...monthlyComparison.map((row) => row.messages), 0),
    newUsers: Math.max(...monthlyComparison.map((row) => row.newUsers), 0),
    completionRate: Math.max(...monthlyComparison.map((row) => row.completionRate), 0),
  }), [monthlyComparison]);

  function handleRangeChange(value: string) {
    router.replace(`${pathname}?range=${value}` as Route);
  }

  function exportCsv() {
    const header = ["Month", "Active users", "Appointments", "Messages", "New users", "Completion rate"];
    const rows = monthlyComparison.map((row) => [row.month, row.activeUsers, row.appointments, row.messages, row.newUsers, `${row.completionRate}%`]);
    const csv = [header, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `maven-clinic-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-[var(--rose-700)]">Employer analytics</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Deep utilization insights for {employerName}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedRange}
            onChange={(event) => handleRangeChange(event.target.value)}
            className="h-11 rounded-full border border-[var(--border)] bg-white px-4 text-sm font-medium text-[var(--foreground)] outline-none transition focus:border-[var(--rose-400)] focus:ring-2 focus:ring-[rgba(245,163,183,0.3)]"
            aria-label="Select analytics date range"
          >
            {rangeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <Button variant="secondary" onClick={exportCsv}>Export CSV</Button>
        </div>
      </div>

      <Card className="space-y-4 p-6">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-[var(--rose-700)]">Utilization trends</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight">Activity across your covered population</h3>
        </div>
        {hasTrendData ? (
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={trends} margin={{ top: 16, right: 20, left: 0, bottom: 8 }}>
              <CartesianGrid stroke="rgba(148,163,184,0.16)" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} minTickGap={24} />
              <YAxis yAxisId="left" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} allowDecimals={false} />
              <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} allowDecimals={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const point = payload[0]?.payload as Props["trends"][number] | undefined;
                  if (!point) return null;
                  return (
                    <div className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm shadow-[0_18px_40px_rgba(25,22,17,0.08)]">
                      <p className="font-medium text-[var(--foreground)]">{point.fullLabel}</p>
                      <p className="mt-1 text-[var(--teal-700)]">Active users: {point.activeUsers}</p>
                      <p className="text-[var(--rose-600)]">Appointments: {point.appointments}</p>
                      <p className="text-[var(--amber-700)]">Messages sent: {point.messages}</p>
                    </div>
                  );
                }}
              />
              <Legend verticalAlign="bottom" height={24} />
              <Line yAxisId="left" type="monotone" dataKey="activeUsers" name="Active users" stroke="#2EA898" strokeWidth={3} dot={false} />
              <Line yAxisId="left" type="monotone" dataKey="appointments" name="Appointments" stroke="#E87D9B" strokeWidth={3} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="messages" name="Messages sent" stroke="#F5B942" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart label="Trends will appear once employees begin booking visits or using messaging." />
        )}
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="space-y-4 p-6">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-[var(--rose-700)]">Specialty breakdown</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight">Appointments by specialty</h3>
          </div>
          {specialties.length ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={specialties} margin={{ top: 10, right: 16, left: -18, bottom: 24 }}>
                <CartesianGrid stroke="rgba(148,163,184,0.16)" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} angle={-18} textAnchor="end" height={70} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[12, 12, 0, 0]} fill="#E87D9B" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="No specialty utilization data is available for this date range." />
          )}
        </Card>
        <Card className="space-y-4 p-6">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-[var(--rose-700)]">Distribution</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight">Share of visits by specialty</h3>
          </div>
          {specialties.length ? (
            <div>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={specialties} dataKey="count" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={4}>
                    {specialties.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value) => typeof value === "number" ? `${value} visits` : "0 visits"} />
                </PieChart>
              </ResponsiveContainer>
              <div className={`grid gap-3 ${specialties.length <= 2 ? "grid-cols-1" : "sm:grid-cols-2"}`}>
                {specialties.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-3 rounded-[20px] bg-[var(--slate-50)] px-4 py-3">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                    <span className="flex-1 text-sm text-[var(--foreground-muted)]">{entry.name}</span>
                    <span className="text-sm font-medium text-[var(--foreground)]">{entry.percent}% ({entry.count})</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyChart label="No specialty distribution yet for the selected range." />
          )}
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="space-y-2 p-5"><p className="text-sm text-[var(--foreground-muted)]">Avg sessions per user / month</p><p className="text-3xl font-semibold tracking-tight">{engagement.avgSessionsPerUserPerMonth.toFixed(1)}</p></Card>
        <Card className="space-y-2 p-5"><p className="text-sm text-[var(--foreground-muted)]">Avg signup to first appointment</p><p className="text-3xl font-semibold tracking-tight">{engagement.avgHoursToFirstAppointment} hrs</p></Card>
        <Card className="space-y-2 p-5"><p className="text-sm text-[var(--foreground-muted)]">Message response rate</p><p className="text-3xl font-semibold tracking-tight">{engagement.messageResponseRate}%</p></Card>
        <Card className="space-y-2 p-5"><p className="text-sm text-[var(--foreground-muted)]">Care plan adoption</p><p className="text-3xl font-semibold tracking-tight">{engagement.carePlanAdoptionRate}%</p></Card>
      </div>

      <Card className="space-y-4 p-6">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-[var(--rose-700)]">Monthly comparison</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight">Last 6 months side by side</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--foreground-muted)]">
                <th className="pb-3 pr-4 font-medium">Month</th>
                <th className="pb-3 pr-4 font-medium">Active users</th>
                <th className="pb-3 pr-4 font-medium">Appointments</th>
                <th className="pb-3 pr-4 font-medium">Messages</th>
                <th className="pb-3 pr-4 font-medium">New users</th>
                <th className="pb-3 font-medium">Completion rate</th>
              </tr>
            </thead>
            <tbody>
              {monthlyComparison.map((row) => (
                <tr key={row.month} className="border-b border-[rgba(15,23,42,0.06)] align-top">
                  <td className="py-4 pr-4 font-medium text-[var(--foreground)]">{row.month}</td>
                  <td className={`py-4 pr-4 ${row.activeUsers === bestValues.activeUsers && row.activeUsers > 0 ? "rounded-xl bg-[rgba(46,168,152,0.1)] font-medium text-[var(--teal-700)]" : "text-[var(--foreground)]"}`}>{row.activeUsers}</td>
                  <td className={`py-4 pr-4 ${row.appointments === bestValues.appointments && row.appointments > 0 ? "rounded-xl bg-[rgba(46,168,152,0.1)] font-medium text-[var(--teal-700)]" : "text-[var(--foreground)]"}`}>{row.appointments}</td>
                  <td className={`py-4 pr-4 ${row.messages === bestValues.messages && row.messages > 0 ? "rounded-xl bg-[rgba(46,168,152,0.1)] font-medium text-[var(--teal-700)]" : "text-[var(--foreground)]"}`}>{row.messages}</td>
                  <td className={`py-4 pr-4 ${row.newUsers === bestValues.newUsers && row.newUsers > 0 ? "rounded-xl bg-[rgba(46,168,152,0.1)] font-medium text-[var(--teal-700)]" : "text-[var(--foreground)]"}`}>{row.newUsers}</td>
                  <td className={`py-4 ${row.completionRate === bestValues.completionRate && row.completionRate > 0 ? "rounded-xl bg-[rgba(46,168,152,0.1)] font-medium text-[var(--teal-700)]" : "text-[var(--foreground)]"}`}>{row.completionRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}