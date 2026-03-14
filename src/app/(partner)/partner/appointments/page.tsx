import { ComingSoonState } from "@/components/health/coming-soon-state";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { Card } from "@/components/ui/card";

export default function PartnerAppointmentsPage() {
  return (
    <DashboardShell title="Shared appointments" eyebrow="Partner workflow" section="partner">
      <Card className="mb-6">
        <h2 className="text-2xl font-semibold">Appointment visibility</h2>
        <p className="mt-2 text-sm leading-7 text-[var(--foreground-muted)]">
          This route is the working entry point for partner-facing appointment visibility. It is ready for patient-approved schedule sharing and visit summaries.
        </p>
      </Card>
      <ComingSoonState
        badge="Partner workflow"
        title="Appointments view is staged"
        description="Shared appointment timing, provider details, and reminder visibility will be added here without changing the protected partner route structure."
        dashboardHref="/partner"
        dashboardLabel="Back to partner dashboard"
        nextHref="/partner/pregnancy"
        nextLabel="Open pregnancy support"
      />
    </DashboardShell>
  );
}
