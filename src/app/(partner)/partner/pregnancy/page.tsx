import { ComingSoonState } from "@/components/health/coming-soon-state";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { Card } from "@/components/ui/card";

export default function PartnerPregnancyPage() {
  return (
    <DashboardShell title="Pregnancy support" eyebrow="Partner workflow" section="partner">
      <Card className="mb-6">
        <h2 className="text-2xl font-semibold">Patient-approved milestone sharing</h2>
        <p className="mt-2 text-sm leading-7 text-[var(--foreground-muted)]">
          This page is the working entry point for partner pregnancy visibility. Milestone updates, checklists, and support prompts will attach here when the workflow is implemented.
        </p>
      </Card>
      <ComingSoonState
        badge="Partner workflow"
        title="Pregnancy support view is staged"
        description="Shared milestone views, pregnancy education, and partner-safe support prompts will be delivered here next."
        dashboardHref="/partner"
        dashboardLabel="Back to partner dashboard"
      />
    </DashboardShell>
  );
}
