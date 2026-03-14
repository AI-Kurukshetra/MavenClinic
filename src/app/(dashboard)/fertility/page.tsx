import { ComingSoonState } from "@/components/health/coming-soon-state";
import { DashboardShell } from "@/components/health/dashboard-shell";

export default function Page() {
  return (
    <DashboardShell title="Fertility" eyebrow="Planning support">
      <ComingSoonState
        badge="Coming soon"
        title="Fertility planning workspace"
        description="Cycle-linked fertility trends, conception planning, and provider guidance will live here once the next patient module is ready."
        dashboardHref="/dashboard"
        dashboardLabel="Back to patient dashboard"
      />
    </DashboardShell>
  );
}
