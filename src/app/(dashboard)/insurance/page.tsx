import { ComingSoonState } from "@/components/health/coming-soon-state";
import { DashboardShell } from "@/components/health/dashboard-shell";

export default function Page() {
  return (
    <DashboardShell title="Insurance" eyebrow="Coverage">
      <ComingSoonState
        badge="Coming soon"
        title="Insurance and claims"
        description="Coverage verification, claims tracking, and billing support will be added here while keeping this patient route protected today."
        dashboardHref="/dashboard"
        dashboardLabel="Back to patient dashboard"
      />
    </DashboardShell>
  );
}
