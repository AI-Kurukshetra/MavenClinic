import { DashboardShell } from "@/components/health/dashboard-shell";
import { Card } from "@/components/ui/card";
import { PartnerAccessDeniedCard, PartnerEmptyState } from "@/features/partner/partner-shared";
import { getPartnerFertilityPageData } from "@/lib/partner-data";

export default async function PartnerFertilityPage() {
  const data = await getPartnerFertilityPageData();

  return (
    <DashboardShell title="Fertility view" eyebrow="Partner portal" section="partner">
      <div className="space-y-6">
        {!data.context.flags.fertility ? (
          <PartnerAccessDeniedCard patientName={data.context.patientName} area="fertility tracking" />
        ) : !data.fertility ? (
          <PartnerEmptyState title="No fertility data shared yet" description="When cycle and fertility records are shared, this page will offer a warm read-only view to help you stay aligned together." />
        ) : (
          <>
            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              <Card>
                <p className="text-sm uppercase tracking-[0.22em] text-[var(--teal-700)]">Cycle overview</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-[var(--foreground-muted)]">Current cycle day</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight">Day {data.fertility.currentCycleDay}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--foreground-muted)]">Next predicted period</p>
                    <p className="mt-2 text-base font-medium text-[var(--foreground)]">{data.fertility.nextPredictedPeriodLabel}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--foreground-muted)]">Fertile window</p>
                    <p className="mt-2 text-base font-medium text-[var(--foreground)]">{data.fertility.fertileWindowLabel}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--foreground-muted)]">Ovulation day prediction</p>
                    <p className="mt-2 text-base font-medium text-[var(--foreground)]">{data.fertility.ovulationLabel}</p>
                  </div>
                </div>
                <span className={`mt-5 inline-flex rounded-full px-4 py-2 text-sm font-medium ${data.fertility.statusTone === "teal" ? "bg-[rgba(61,191,173,0.14)] text-[var(--teal-700)]" : "bg-slate-100 text-slate-500"}`}>
                  {data.fertility.statusLabel}
                </span>
              </Card>
              <Card>
                <p className="text-sm uppercase tracking-[0.22em] text-[var(--rose-700)]">Read-only note</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight">Read-only view of {data.context.patientFirstName}&apos;s cycle</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--foreground-muted)]">This view is for understanding and support only. Logging and edits stay with the patient.</p>
                {data.fertility.latestFertilityEntry ? <p className="mt-4 text-sm text-[var(--foreground-muted)]">Latest fertility snapshot: {data.fertility.latestFertilityEntry.date}{data.fertility.latestFertilityEntry.opk_result ? ` | OPK ${data.fertility.latestFertilityEntry.opk_result}` : ""}</p> : null}
              </Card>
            </div>

            <Card>
              <p className="text-sm uppercase tracking-[0.22em] text-[var(--teal-700)]">Fertility calendar</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight">Shared monthly snapshot</h3>
              <div className="mt-5 grid grid-cols-7 gap-2 text-center text-xs uppercase tracking-[0.18em] text-slate-400">
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((day) => <div key={day}>{day}</div>)}
              </div>
              <div className="mt-3 grid grid-cols-7 gap-2">
                {data.fertility.calendar.map((day) => (
                  <div
                    key={day.date}
                    className={`min-h-16 rounded-2xl border px-2 py-2 text-sm ${day.inCurrentMonth ? 'border-[var(--border)] bg-white' : 'border-transparent bg-slate-50 text-slate-400'} ${day.isToday ? 'ring-2 ring-[rgba(232,125,155,0.22)]' : ''}`}
                  >
                    <div className="font-medium">{day.dayNumber}</div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {day.isPeriod ? <span className="h-2 w-2 rounded-full bg-[var(--rose-500)]" /> : null}
                      {day.isFertile ? <span className="h-2 w-2 rounded-full bg-[var(--teal-500)]" /> : null}
                      {day.isOvulation ? <span className="h-2 w-2 rounded-full bg-amber-400" /> : null}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <div className="grid gap-4 lg:grid-cols-3">
              <Card>
                <h3 className="text-xl font-semibold tracking-tight">Optimal timing guidance</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--foreground-muted)]">Shared cycle awareness can make timing conversations gentler and less stressful. Focus on calm coordination rather than pressure.</p>
              </Card>
              <Card>
                <h3 className="text-xl font-semibold tracking-tight">Lifestyle factors that help</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--foreground-muted)]">Sleep, stress recovery, meals, and movement all shape how supported the cycle can feel. Small routines matter more than perfect ones.</p>
              </Card>
              <Card>
                <h3 className="text-xl font-semibold tracking-tight">When to speak with a specialist</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--foreground-muted)]">If questions, uncertainty, or timing stress keep building, a fertility specialist can help both of you understand what comes next.</p>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
