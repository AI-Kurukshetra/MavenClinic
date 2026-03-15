import { DashboardShell } from "@/components/health/dashboard-shell";
import { Card } from "@/components/ui/card";
import { PartnerPregnancyChecklist } from "@/features/partner/partner-client";
import { PartnerAccessDeniedCard, PartnerEmptyState } from "@/features/partner/partner-shared";
import { getPartnerPregnancyPageData } from "@/lib/partner-data";

function getChecklist(trimester: "First" | "Second" | "Third") {
  if (trimester === "First") {
    return ["Support prenatal vitamin routines", "Attend an OB visit if invited", "Discuss early screening questions together"];
  }

  if (trimester === "Second") {
    return ["Plan for the anatomy scan and follow-up questions", "Look into childbirth classes together", "Start gentle nursery and home planning"];
  }

  return ["Pack a hospital bag together", "Review the birth plan and support preferences", "Check car seat installation and ride-home logistics"];
}

export default async function PartnerPregnancyPage() {
  const data = await getPartnerPregnancyPageData();

  return (
    <DashboardShell title="Pregnancy support" eyebrow="Partner portal" section="partner">
      <div className="space-y-6">
        {!data.context.flags.pregnancy ? (
          <PartnerAccessDeniedCard patientName={data.context.patientName} area="pregnancy updates" />
        ) : !data.pregnancy ? (
          <PartnerEmptyState title="No active pregnancy to display" description="If an active pregnancy is shared later, you will see milestones and preparation guidance here with a warm, read-only view." />
        ) : (
          <>
            <Card>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.22em] text-[var(--rose-700)]">Pregnancy overview</p>
                  <h2 className="mt-2 text-4xl font-semibold tracking-tight">Week {data.pregnancy.currentWeek}</h2>
                  <p className="mt-3 text-sm text-[var(--foreground-muted)]">Due {data.pregnancy.dueDateLabel} | {data.pregnancy.daysUntilDue} days away</p>
                </div>
                <span className="inline-flex rounded-full bg-[rgba(232,125,155,0.12)] px-4 py-2 text-sm font-medium text-[var(--rose-700)]">{data.pregnancy.trimester} trimester</span>
              </div>
              <div className="mt-6 h-3 rounded-full bg-slate-100">
                <div className="h-3 rounded-full bg-[linear-gradient(90deg,var(--rose-400),var(--teal-400))]" style={{ width: `${data.pregnancy.progressPercent}%` }} />
              </div>
            </Card>

            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              <Card>
                <p className="text-sm uppercase tracking-[0.22em] text-[var(--teal-700)]">Weekly milestone</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight">{data.pregnancy.milestoneTitle}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--foreground-muted)]">{data.pregnancy.milestoneNote}</p>
              </Card>
              <Card>
                <p className="text-sm uppercase tracking-[0.22em] text-[var(--rose-700)]">Upcoming milestones</p>
                <div className="mt-4 space-y-4">
                  {data.pregnancy.timeline.map((item) => (
                    <div key={item.title} className="rounded-2xl border border-[var(--border)] px-4 py-4">
                      <p className="font-medium text-[var(--foreground)]">{item.title}</p>
                      <p className="mt-1 text-sm text-[var(--teal-700)]">{item.dateLabel}</p>
                      <p className="mt-2 text-sm text-[var(--foreground-muted)]">{item.description}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <Card>
              <p className="text-sm uppercase tracking-[0.22em] text-[var(--teal-700)]">Support checklist</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight">This trimester&apos;s practical support moments</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--foreground-muted)]">These checkboxes stay local to your browser, so you can privately track the ways you want to show up.</p>
              <div className="mt-5">
                <PartnerPregnancyChecklist storageKey={`partner-pregnancy-${data.context.accessId}-${data.pregnancy.trimester.toLowerCase()}`} items={getChecklist(data.pregnancy.trimester)} />
              </div>
            </Card>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
