import { ComingSoonState } from "@/components/health/coming-soon-state";
import { DashboardShell } from "@/components/health/dashboard-shell";

export default function Page() {
  return (
    <DashboardShell title="Care plans" eyebrow="Action items">
      <ComingSoonState
        badge="Coming soon"
        title="Care plan workspace"
        description="This route will bring active care plans, milestone tracking, and provider-issued follow-up tasks into one patient view."
        dashboardHref="/dashboard"
        dashboardLabel="Back to patient dashboard"
      />
    </DashboardShell>
  );
}
