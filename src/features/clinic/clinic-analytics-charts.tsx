"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ClinicAnalyticsData } from "@/lib/clinic-admin-data";
import { Card } from "@/components/ui/card";

export function ClinicAnalyticsCharts({ data }: { data: ClinicAnalyticsData }) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card className="overflow-hidden p-6">
        <p className="text-sm font-medium text-[var(--foreground)]">Monthly active users</p>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">All platform participants active each month</p>
        <div className="mt-6 h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.mauTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
              <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#3DBFAD" strokeWidth={3} dot={{ r: 4, fill: "#3DBFAD" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="overflow-hidden p-6">
        <p className="text-sm font-medium text-[var(--foreground)]">Appointment completion rate</p>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">Scheduled visits completed each month</p>
        <div className="mt-6 h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.completionTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
              <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip formatter={(value) => [`${value}%`, "Completion rate"]} />
              <Line type="monotone" dataKey="value" stroke="#D4587B" strokeWidth={3} dot={{ r: 4, fill: "#D4587B" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="overflow-hidden p-6">
        <p className="text-sm font-medium text-[var(--foreground)]">Top specialties</p>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">Most-booked specialties across the platform</p>
        <div className="mt-6 h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.topSpecialties}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
              <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#3DBFAD" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="overflow-hidden p-6">
        <p className="text-sm font-medium text-[var(--foreground)]">New user signups</p>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">Patient and provider profile creation over time</p>
        <div className="mt-6 h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.signups}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
              <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#D4587B" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
