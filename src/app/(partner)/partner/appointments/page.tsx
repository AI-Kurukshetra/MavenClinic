import { DashboardShell } from "@/components/health/dashboard-shell";
import { Card } from "@/components/ui/card";
import { PartnerCalendarButton } from "@/features/partner/partner-client";
import { PartnerAccessDeniedCard, PartnerEmptyState } from "@/features/partner/partner-shared";
import { getPartnerAppointmentsPageData } from "@/lib/partner-data";
import { formatDateTime } from "@/lib/utils";

export default async function PartnerAppointmentsPage() {
  const data = await getPartnerAppointmentsPageData();

  return (
    <DashboardShell title="Shared appointments" eyebrow="Partner portal" section="partner">
      <div className="space-y-6">
        {!data.context.flags.appointments ? (
          <PartnerAccessDeniedCard patientName={data.context.patientName} area="appointments" />
        ) : data.appointments.length === 0 ? (
          <PartnerEmptyState title="No upcoming appointments" description="When new visits are booked for shared care, they will appear here in a calm read-only view." />
        ) : (
          data.appointments.map((appointment) => (
            <Card key={appointment.id} className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-[var(--rose-700)]">{appointment.status}</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">{appointment.providerName}</h2>
                <p className="mt-1 text-sm text-[var(--foreground-muted)]">{appointment.providerSpecialty}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[var(--foreground-muted)]">
                  <span>{formatDateTime(appointment.scheduledAt)}</span>
                  <span className="text-slate-300">|</span>
                  <span>{appointment.type}</span>
                </div>
              </div>
              <PartnerCalendarButton
                title={`Maven Clinic with ${appointment.providerName}`}
                start={appointment.scheduledAt}
                description={`${appointment.providerSpecialty} appointment`}
                location="Maven Clinic virtual care"
              />
            </Card>
          ))
        )}
      </div>
    </DashboardShell>
  );
}
