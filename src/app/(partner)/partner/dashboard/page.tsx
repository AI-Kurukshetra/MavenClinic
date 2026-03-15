import { Calendar, MessageSquareHeart, Sparkles } from "lucide-react";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { Card } from "@/components/ui/card";
import { getPartnerDashboardPageData } from "@/lib/partner-data";
import { formatDateTime } from "@/lib/utils";
import { PartnerAccessChip, PartnerResourceCard } from "@/features/partner/partner-shared";

export default async function PartnerDashboardPage() {
  const data = await getPartnerDashboardPageData();

  return (
    <DashboardShell title="Shared care overview" eyebrow="Partner portal" section="partner">
      <div className="space-y-6">
        <Card className="bg-[linear-gradient(135deg,rgba(232,125,155,0.12),rgba(61,191,173,0.08))]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-[var(--rose-700)]">Supporting shared care</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                {data.context.hasActiveAccess ? `Supporting ${data.context.patientFirstName}'s health journey` : "Your partner portal is ready"}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--foreground-muted)]">
                {data.context.hasActiveAccess
                  ? `You have been granted access to share in this health journey with warm, read-only visibility into the areas ${data.context.patientFirstName} chose to share.`
                  : "Your account is active. As soon as shared access is granted, this portal will fill in with the care updates your partner chooses to share."}
              </p>
            </div>
            <span className="inline-flex h-fit items-center rounded-full bg-white px-4 py-2 text-sm font-medium text-[var(--rose-700)] shadow-sm">
              {data.context.hasActiveAccess ? `Viewing: ${data.context.accessLabel}` : "Waiting for shared access"}
            </span>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <p className="text-sm uppercase tracking-[0.22em] text-[var(--teal-700)]">Access summary</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight">What has been shared with you</h3>
            <div className="mt-5 flex flex-wrap gap-2">
              {data.accessChips.map((chip) => (
                <PartnerAccessChip key={chip.key} label={chip.label} granted={chip.granted} />
              ))}
            </div>
            <p className="mt-4 text-sm leading-7 text-[var(--foreground-muted)]">
              {data.context.hasActiveAccess
                ? `Access is managed by ${data.context.patientName}. If something changes, they can update it from their settings.`
                : "Access will appear here once your partner shares appointments, pregnancy, fertility, or message visibility with you."}
            </p>
          </Card>

          <Card>
            <p className="text-sm uppercase tracking-[0.22em] text-[var(--rose-700)]">Recent activity</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight">What&apos;s new</h3>
            <div className="mt-5 space-y-4">
              {data.recentActivity.length ? data.recentActivity.map((item) => (
                <div key={item.id} className="flex gap-3 rounded-2xl border border-[var(--border)] px-4 py-4">
                  <div className="mt-1 rounded-full bg-[rgba(61,191,173,0.14)] p-2 text-[var(--teal-700)]">
                    {item.kind === "appointment" ? <Calendar className="h-4 w-4" /> : item.kind === "pregnancy" ? <Sparkles className="h-4 w-4" /> : <MessageSquareHeart className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="font-medium text-[var(--foreground)]">{item.title}</p>
                    <p className="mt-1 text-sm text-[var(--foreground-muted)]">{item.description}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">{item.relativeTime}</p>
                  </div>
                </div>
              )) : <p className="text-sm leading-7 text-[var(--foreground-muted)]">Once shared care activity picks up, you&apos;ll see appointments, milestone updates, and provider communication notices here.</p>}
            </div>
          </Card>
        </div>

        {data.context.hasActiveAccess ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {data.nextAppointment ? (
              <Card>
                <p className="text-sm uppercase tracking-[0.22em] text-[var(--teal-700)]">Next appointment</p>
                <p className="mt-3 text-xl font-semibold tracking-tight">{data.nextAppointment.providerName}</p>
                <p className="mt-1 text-sm text-[var(--foreground-muted)]">{data.nextAppointment.providerSpecialty}</p>
                <p className="mt-3 text-sm text-[var(--foreground)]">{formatDateTime(data.nextAppointment.scheduledAt)}</p>
              </Card>
            ) : null}
            {data.pregnancy ? (
              <>
                <Card>
                  <p className="text-sm uppercase tracking-[0.22em] text-[var(--rose-700)]">Pregnancy progress</p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight">Week {data.pregnancy.currentWeek}</p>
                  <p className="mt-2 text-sm text-[var(--foreground-muted)]">{data.pregnancy.trimester} trimester</p>
                </Card>
                <Card>
                  <p className="text-sm uppercase tracking-[0.22em] text-[var(--rose-700)]">Due date</p>
                  <p className="mt-3 text-xl font-semibold tracking-tight">{data.pregnancy.dueDateLabel}</p>
                  <p className="mt-2 text-sm text-[var(--foreground-muted)]">{data.pregnancy.daysUntilDue} days away</p>
                </Card>
              </>
            ) : null}
            {data.fertility ? (
              <>
                <Card>
                  <p className="text-sm uppercase tracking-[0.22em] text-[var(--teal-700)]">Current cycle</p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight">Day {data.fertility.currentCycleDay}</p>
                  <p className="mt-2 text-sm text-[var(--foreground-muted)]">of {data.fertility.cycleLength}</p>
                </Card>
                <Card>
                  <p className="text-sm uppercase tracking-[0.22em] text-[var(--teal-700)]">Fertile window</p>
                  <p className="mt-3 text-lg font-semibold tracking-tight">{data.fertility.fertileWindowLabel}</p>
                  <p className="mt-2 text-sm text-[var(--foreground-muted)]">{data.fertility.statusLabel}</p>
                </Card>
              </>
            ) : null}
          </div>
        ) : (
          <Card>
            <p className="text-sm uppercase tracking-[0.22em] text-[var(--teal-700)]">No shared data yet</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight">Waiting for access from your partner</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--foreground-muted)]">Stay signed in. Once access is granted, appointments, fertility updates, or pregnancy milestones will appear here automatically.</p>
          </Card>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          <PartnerResourceCard
            source="NHS"
            title="Supporting your partner during pregnancy"
            description="Warm, practical guidance on emotional support, appointments, and everyday ways to help during pregnancy."
            href="https://www.nhs.uk/pregnancy/keeping-well/mental-health/partners-friends-and-family/"
          />
          <PartnerResourceCard
            source="WHO"
            title="Understanding fertility treatments"
            description="A reliable overview of fertility care pathways and when specialist support may be helpful."
            href="https://www.who.int/news-room/fact-sheets/detail/infertility"
          />
          <PartnerResourceCard
            source="NHS"
            title="Mental health support for partners"
            description="Guidance for recognizing overwhelm, asking for support, and caring for yourself while supporting someone else."
            href="https://www.nhs.uk/mental-health/"
          />
        </div>
      </div>
    </DashboardShell>
  );
}
