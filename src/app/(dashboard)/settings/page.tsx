import { ComingSoonState } from "@/components/health/coming-soon-state";
import { DashboardShell } from "@/components/health/dashboard-shell";

export default function Page() {
  return (
    <DashboardShell title="Settings" eyebrow="Profile and security">
      <ComingSoonState
        badge="Coming soon"
        title="Account settings"
        description="Profile preferences, notifications, and security controls will move into this protected settings area in the next pass."
        dashboardHref="/dashboard"
        dashboardLabel="Back to patient dashboard"
      />
    </DashboardShell>
  );
}
