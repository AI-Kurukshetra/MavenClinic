import { ComingSoonState } from "@/components/health/coming-soon-state";
import { DashboardShell } from "@/components/health/dashboard-shell";

export default function Page() {
  return (
    <DashboardShell title="Pregnancy" eyebrow="Milestones">
      <ComingSoonState
        badge="Coming soon"
        title="Pregnancy milestone tracker"
        description="Pregnancy week-by-week updates, care checklists, and shared milestone views are protected by middleware and ready for the next build pass."
        dashboardHref="/dashboard"
        dashboardLabel="Back to patient dashboard"
      />
    </DashboardShell>
  );
}
