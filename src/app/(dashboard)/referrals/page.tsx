import { ComingSoonState } from "@/components/health/coming-soon-state";
import { DashboardShell } from "@/components/health/dashboard-shell";

export default function Page() {
  return (
    <DashboardShell title="Referrals" eyebrow="Care network">
      <ComingSoonState
        badge="Coming soon"
        title="Referral management"
        description="Specialist referrals, external care handoffs, and referral status tracking will appear here once that workflow is implemented."
        dashboardHref="/dashboard"
        dashboardLabel="Back to patient dashboard"
      />
    </DashboardShell>
  );
}
