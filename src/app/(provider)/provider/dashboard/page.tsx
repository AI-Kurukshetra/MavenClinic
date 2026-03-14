import { CalendarRange, Clock3, MessageSquareReply, Users } from "lucide-react";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { getProviderDashboardData } from "@/lib/data";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";

export default async function ProviderDashboardPage() {
  const { stats, todaysAppointments, patients, schedule } = await getProviderDashboardData();

  return (
    <DashboardShell title="Provider dashboard" eyebrow="Clinical operations" section="provider">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="Total appointments" value={String(stats.totalAppointments)} delta="All-time provider caseload" icon={CalendarRange} />
          <StatCard title="Messages to respond" value={String(stats.pendingMessages)} delta="Unread patient messages" icon={MessageSquareReply} />
          <StatCard title="Active patients" value={String(stats.activePatients)} delta="Distinct patients with appointments" icon={Users} />
        </div>
        <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
          <Card className="space-y-4">
            <h2 className="text-2xl font-semibold">Today&apos;s appointments</h2>
            {todaysAppointments.length ? (
              <div className="space-y-3">
                {todaysAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-[var(--slate-50)] p-4">
                    <div>
                      <p className="font-semibold">{appointment.patientName}</p>
                      <p className="text-sm text-[var(--foreground-muted)]">{appointment.chiefComplaint}</p>
                    </div>
                    <div className="text-right text-sm text-[var(--foreground-muted)]">
                      <p>{formatDateTime(appointment.scheduledAt)}</p>
                      <p>{appointment.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--foreground-muted)]">No appointments are scheduled for today.</p>
            )}
          </Card>
          <Card className="space-y-4">
            <h2 className="text-2xl font-semibold">Patient list</h2>
            {patients.length ? (
              <div className="space-y-3">
                {patients.map((patient) => (
                  <div key={patient.id} className="rounded-[24px] border border-[var(--border)] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{patient.name}</p>
                        <p className="text-sm text-[var(--foreground-muted)]">Last visit: {formatRelativeTime(patient.lastVisit)}</p>
                      </div>
                      <p className="text-sm text-[var(--teal-700)]">{patient.carePlan}</p>
                    </div>
                    <p className="mt-3 text-sm text-[var(--foreground-muted)]">{patient.reason}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--foreground-muted)]">Patients will appear here after appointments are booked with this provider.</p>
            )}
          </Card>
        </div>
        <Card className="space-y-4">
          <div className="flex items-center gap-3">
            <Clock3 className="h-5 w-5 text-[var(--teal-700)]" />
            <h2 className="text-2xl font-semibold">Availability schedule</h2>
          </div>
          {schedule.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {schedule.map((slot) => (
                <div key={slot.id} className="rounded-[24px] border border-[var(--border)] bg-[var(--slate-50)] p-4">
                  <p className="font-semibold">{slot.dayOfWeek}</p>
                  <p className="mt-1 text-sm text-[var(--foreground-muted)]">{slot.startTime} - {slot.endTime}</p>
                  <p className="mt-2 text-sm text-[var(--foreground-muted)]">{slot.location}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--foreground-muted)]">No provider availability has been configured yet.</p>
          )}
        </Card>
      </div>
    </DashboardShell>
  );
}
