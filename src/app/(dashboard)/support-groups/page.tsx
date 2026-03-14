import { ComingSoonState } from "@/components/health/coming-soon-state";
import { DashboardShell } from "@/components/health/dashboard-shell";

export default function Page() {
  return (
    <DashboardShell title="Support groups" eyebrow="Community">
      <ComingSoonState
        badge="Coming soon"
        title="Support group hub"
        description="Moderated groups, group matching, and safe community participation will be added here without changing the protected route structure."
        dashboardHref="/dashboard"
        dashboardLabel="Back to patient dashboard"
      />
    </DashboardShell>
  );
}
