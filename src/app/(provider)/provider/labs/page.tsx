export const dynamic = "force-dynamic";

import { ClipboardPlus, FlaskConical } from "lucide-react";
import { createLabOrderAction } from "@/app/(provider)/provider/actions";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageErrorState } from "@/components/ui/PageErrorState";
import { getProviderLabsData } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export default async function ProviderLabsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  try {
    const params = await searchParams;
    const { labs, patients } = await getProviderLabsData();

    return (
      <DashboardShell title="Lab results" eyebrow="Clinical workflow" section="provider">
        <div className="space-y-6">
          {params.message ? <Card className="border-[rgba(46,168,152,0.18)] bg-[rgba(46,168,152,0.08)] p-4 text-sm">{params.message}</Card> : null}
          {params.error ? <Card className="border-[rgba(190,68,100,0.18)] bg-[rgba(190,68,100,0.08)] p-4 text-sm">{params.error}</Card> : null}
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <Card className="space-y-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-[var(--rose-700)]">Order labs</p>
                <h2 className="mt-2 text-2xl font-semibold">Create a new lab order</h2>
              </div>
              <form action={createLabOrderAction} className="space-y-4">
                <label className="block space-y-2 text-sm">
                  <span className="font-medium">Patient</span>
                  <select name="patientId" required className="h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4">
                    <option value="">Select patient</option>
                    {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}
                  </select>
                </label>
                <label className="block space-y-2 text-sm">
                  <span className="font-medium">Panel name</span>
                  <input name="panelName" required className="h-12 w-full rounded-xl border border-[var(--border)] px-4" placeholder="Hormone panel" />
                </label>
                <label className="block space-y-2 text-sm">
                  <span className="font-medium">Clinical note</span>
                  <textarea name="summary" required rows={4} className="w-full rounded-xl border border-[var(--border)] px-4 py-3" placeholder="Review estradiol, LH, FSH, and thyroid markers before the next follow-up." />
                </label>
                <Button type="submit" className="rounded-xl px-6">Create lab order</Button>
              </form>
            </Card>
            <Card className="space-y-4">
              <div className="flex items-center gap-3">
                <FlaskConical className="h-5 w-5 text-[var(--teal-700)]" />
                <h2 className="text-2xl font-semibold">Ordered and reviewed labs</h2>
              </div>
              {labs.length ? (
                <div className="space-y-3">
                  {labs.map((lab) => (
                    <div key={lab.id} className="rounded-[24px] border border-[var(--border)] bg-[var(--slate-50)] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold">{lab.panelName}</p>
                          <p className="text-sm text-[var(--foreground-muted)]">{lab.patientName}</p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--teal-700)]">{lab.status}</span>
                      </div>
                      <div className="mt-3 grid gap-2 text-sm text-[var(--foreground-muted)] sm:grid-cols-2">
                        <p>Ordered {formatDate(lab.orderedAt)}</p>
                        <p>{lab.resultedAt ? 'Resulted ' + formatDate(lab.resultedAt) : 'Awaiting results'}</p>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-[var(--foreground-muted)]">{lab.summary}</p>
                      {lab.markers.length ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {lab.markers.map((marker) => (
                            <span key={String(lab.id) + '-' + marker.label} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--foreground-muted)]">
                              {marker.label}: {marker.value}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[24px] border border-dashed border-[var(--border)] bg-[var(--slate-50)] p-6 text-center">
                  <ClipboardPlus className="mx-auto h-8 w-8 text-[var(--teal-700)]" />
                  <p className="mt-3 font-semibold">No lab orders yet</p>
                  <p className="mt-2 text-sm text-[var(--foreground-muted)]">Create a lab order to start tracking lab workflows and patient-ready summaries.</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </DashboardShell>
    );
  } catch (error) {
    console.error("Provider labs page error:", error);
    return <PageErrorState title="Unable to load lab results" message="Please refresh the page to try again." href="/provider/labs" />;
  }
}
