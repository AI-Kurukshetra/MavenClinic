import { ComingSoonState } from "@/components/health/coming-soon-state";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { Card } from "@/components/ui/card";

export default function SuperSystemPage() {
  return (
    <DashboardShell title="System controls" eyebrow="Super admin workflow" section="super">
      <Card className="mb-6">
        <h2 className="text-2xl font-semibold">Operational control center</h2>
        <p className="mt-2 text-sm leading-7 text-[var(--foreground-muted)]">
          Feature-flag governance, operational policy rollout, and key system controls belong here for the super admin workflow.
        </p>
      </Card>
      <ComingSoonState
        badge="System workflow"
        title="System management is queued"
        description="This protected page is ready for feature flags, API configuration, and platform-wide administrative controls."
        dashboardHref="/super/dashboard"
        dashboardLabel="Back to super dashboard"
      />
    </DashboardShell>
  );
}
