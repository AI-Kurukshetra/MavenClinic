import { ComingSoonState } from "@/components/health/coming-soon-state";
import { DashboardShell } from "@/components/health/dashboard-shell";

export default function ProviderEarningsPage() {
  return (
    <DashboardShell title="Earnings" eyebrow="Provider operations" section="provider">
      <ComingSoonState
        badge="Provider workflow"
        title="Earnings reporting is queued"
        description="This route will surface visit payouts, reimbursement history, and provider earnings summaries in one place."
        dashboardHref="/provider/dashboard"
        dashboardLabel="Back to provider dashboard"
      />
    </DashboardShell>
  );
}