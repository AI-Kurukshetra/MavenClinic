import { ComingSoonState } from "@/components/health/coming-soon-state";
import { DashboardShell } from "@/components/health/dashboard-shell";

export default function ProviderCarePlansPage() {
  return (
    <DashboardShell title="Care plans" eyebrow="Provider workflow" section="provider">
      <ComingSoonState
        badge="Provider workflow"
        title="Care plan authoring is queued"
        description="This route will centralize provider-authored care plans, milestone progress, and follow-up tasks for each patient."
        dashboardHref="/provider/dashboard"
        dashboardLabel="Back to provider dashboard"
      />
    </DashboardShell>
  );
}