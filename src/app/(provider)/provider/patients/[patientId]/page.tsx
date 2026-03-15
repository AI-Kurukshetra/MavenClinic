import { notFound } from "next/navigation";
import { CalendarRange, NotebookTabs, UserRound } from "lucide-react";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getProviderPatientDetailData } from "@/lib/data";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";

export default async function ProviderPatientDetailPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;
  const patient = await getProviderPatientDetailData(patientId);

  if (!patient) {
    notFound();
  }

  return (
    <DashboardShell title={patient.name} eyebrow="Patient chart" section="provider">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <div className="flex items-center gap-3">
              <UserRound className="h-5 w-5 text-[var(--teal-700)]" />
              <div>
                <p className="text-sm text-[var(--foreground-muted)]">Last visit</p>
                <p className="font-semibold">{formatRelativeTime(patient.lastVisit)}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <NotebookTabs className="h-5 w-5 text-[var(--teal-700)]" />
              <div>
                <p className="text-sm text-[var(--foreground-muted)]">Active care plan</p>
                <p className="font-semibold">{patient.carePlan}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <CalendarRange className="h-5 w-5 text-[var(--teal-700)]" />
              <div>
                <p className="text-sm text-[var(--foreground-muted)]">Date of birth</p>
                <p className="font-semibold">{patient.dateOfBirth ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(patient.dateOfBirth)) : "Not provided"}</p>
              </div>
            </div>
          </Card>
        </div>

        <Card>
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--rose-700)]">Primary concern</p>
          <h2 className="mt-2 text-2xl font-semibold">{patient.reason}</h2>
        </Card>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="space-y-4">
            <h2 className="text-2xl font-semibold">Upcoming appointments</h2>
            {patient.upcomingAppointments.length ? (
              <div className="space-y-3">
                {patient.upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="rounded-[24px] border border-[var(--border)] bg-[var(--slate-50)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{formatDateTime(appointment.scheduledAt)}</p>
                      <Badge variant="info">{appointment.status}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-[var(--foreground-muted)]">{appointment.chiefComplaint}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--foreground-muted)]">No upcoming appointments scheduled.</p>
            )}
          </Card>

          <Card className="space-y-4">
            <h2 className="text-2xl font-semibold">Recent visits</h2>
            {patient.recentAppointments.length ? (
              <div className="space-y-3">
                {patient.recentAppointments.map((appointment) => (
                  <div key={appointment.id} className="rounded-[24px] border border-[var(--border)] bg-[var(--slate-50)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{formatDateTime(appointment.scheduledAt)}</p>
                      <Badge variant={appointment.status === "completed" ? "success" : appointment.status === "cancelled" ? "warning" : "neutral"}>
                        {appointment.status}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-[var(--foreground-muted)]">{appointment.chiefComplaint}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--foreground-muted)]">No completed visits yet for this patient.</p>
            )}
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}