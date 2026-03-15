import { ComingSoonState } from "@/components/health/coming-soon-state";
import { DashboardShell } from "@/components/health/dashboard-shell";

export default function ProviderAvailabilityPage() {
  return (
    <DashboardShell title="Availability" eyebrow="Provider settings" section="provider">
      <ComingSoonState
        badge="Provider workflow"
        title="Availability controls are next"
        description="This route will manage provider hours, same-day slots, and availability overrides without leaving the provider workspace."
        dashboardHref="/provider/dashboard"
        dashboardLabel="Back to provider dashboard"
      />
    </DashboardShell>
  );
}