import { ComingSoonState } from "@/components/health/coming-soon-state";
import { DashboardShell } from "@/components/health/dashboard-shell";

export default function Page() {
  return (
    <DashboardShell title="Wellness" eyebrow="Holistic score">
      <ComingSoonState
        badge="Coming soon"
        title="Wellness insights"
        description="Assessments, recovery scoring, and whole-person wellness trends will be surfaced here for patient follow-through."
        dashboardHref="/dashboard"
        dashboardLabel="Back to patient dashboard"
      />
    </DashboardShell>
  );
}
