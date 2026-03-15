import Link from "next/link";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getProviderDashboardData, getProviderScheduleData } from "@/lib/data";
import { formatTime } from "@/lib/appointments";
import { formatDateTime } from "@/lib/utils";

export default async function ProviderSchedulePage() {
  const [appointments, dashboard] = await Promise.all([
    getProviderScheduleData(),
    getProviderDashboardData(),
  ]);

  return (
    <DashboardShell title="Provider schedule" eyebrow="Today's timeline" section="provider">
      <div className="space-y-6">
        <div className="grid gap-4">
          {appointments.length ? (
            appointments.map((item) => (
              <Card key={item.id} className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-[var(--rose-700)]">{formatDateTime(item.scheduledAt)}</p>
                  <h2 className="mt-2 text-2xl font-semibold">{item.patientName}</h2>
                  <p className="text-sm text-[var(--foreground-muted)]">{item.chiefComplaint}</p>
                </div>
                <div className="ml-auto flex items-center gap-3">
                  <Badge variant={item.status === "completed" ? "neutral" : item.status === "cancelled" ? "warning" : "info"}>
                    {item.status}
                  </Badge>
                  <Link
                    href={`/provider/patients/${item.patientId}`}
                    className="cursor-pointer rounded-full border border-[var(--border)] px-4 py-2 text-sm transition hover:border-[var(--rose-200)] hover:bg-[var(--rose-50)] hover:text-[var(--rose-600)]"
                  >
                    Open chart
                  </Link>
                </div>
              </Card>
            ))
          ) : (
            <Card>
              <p className="text-sm text-[var(--foreground-muted)]">No appointments are scheduled for today.</p>
            </Card>
          )}
        </div>

        <Card className="space-y-4">
          <h2 className="text-2xl font-semibold">Availability</h2>
          {dashboard.schedule.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {dashboard.schedule.map((slot) => (
                <div key={slot.id} className="rounded-[24px] border border-[var(--border)] bg-[var(--slate-50)] p-4">
                  <p className="font-semibold">{slot.dayOfWeek}</p>
                  <p className="mt-1 text-sm text-[var(--foreground-muted)]">{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</p>
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