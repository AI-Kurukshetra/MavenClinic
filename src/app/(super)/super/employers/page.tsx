import { ComingSoonState } from "@/components/health/coming-soon-state";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { Card } from "@/components/ui/card";

export default function SuperEmployersPage() {
  return (
    <DashboardShell title="Employer operations" eyebrow="Super admin workflow" section="super">
      <Card className="mb-6">
        <h2 className="text-2xl font-semibold">Account review queue</h2>
        <p className="mt-2 text-sm leading-7 text-[var(--foreground-muted)]">
          This page is the working entry point for the super admin employer workflow. Renewal tracking, contract status, and exception handling will be layered in here next.
        </p>
      </Card>
      <ComingSoonState
        badge="Employer workflow"
        title="Employer controls are staged"
        description="The protected employer-operations route is live. Next work should add contract actions, lifecycle updates, and financial controls here."
        dashboardHref="/super/dashboard"
        dashboardLabel="Back to super dashboard"
      />
    </DashboardShell>
  );
}
