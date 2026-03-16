export const dynamic = "force-dynamic";

import { ClipboardList, Pill } from "lucide-react";
import { createPrescriptionAction } from "@/app/(provider)/provider/actions";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageErrorState } from "@/components/ui/PageErrorState";
import { getProviderPrescriptionsData } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export default async function ProviderPrescriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  try {
    const params = await searchParams;
    const { prescriptions, patients } = await getProviderPrescriptionsData();

    return (
      <DashboardShell title="Prescriptions" eyebrow="Clinical workflow" section="provider">
        <div className="space-y-6">
          {params.message ? <Card className="border-[rgba(46,168,152,0.18)] bg-[rgba(46,168,152,0.08)] p-4 text-sm">{params.message}</Card> : null}
          {params.error ? <Card className="border-[rgba(190,68,100,0.18)] bg-[rgba(190,68,100,0.08)] p-4 text-sm">{params.error}</Card> : null}
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <Card className="space-y-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-[var(--rose-700)]">Write prescription</p>
                <h2 className="mt-2 text-2xl font-semibold">Issue medication guidance</h2>
              </div>
              <form action={createPrescriptionAction} className="space-y-4">
                <label className="block space-y-2 text-sm">
                  <span className="font-medium">Patient</span>
                  <select name="patientId" required className="h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4">
                    <option value="">Select patient</option>
                    {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}
                  </select>
                </label>
                <label className="block space-y-2 text-sm">
                  <span className="font-medium">Medication</span>
                  <input name="medicationName" required className="h-12 w-full rounded-xl border border-[var(--border)] px-4" placeholder="Progesterone" />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-2 text-sm">
                    <span className="font-medium">Dosage</span>
                    <input name="dosage" required className="h-12 w-full rounded-xl border border-[var(--border)] px-4" placeholder="200 mg" />
                  </label>
                  <label className="block space-y-2 text-sm">
                    <span className="font-medium">Frequency</span>
                    <input name="frequency" required className="h-12 w-full rounded-xl border border-[var(--border)] px-4" placeholder="Nightly" />
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-2 text-sm">
                    <span className="font-medium">Refills</span>
                    <input name="refillsRemaining" type="number" min="0" max="12" defaultValue="0" className="h-12 w-full rounded-xl border border-[var(--border)] px-4" />
                  </label>
                  <label className="block space-y-2 text-sm">
                    <span className="font-medium">Expires on</span>
                    <input name="expiresAt" type="date" className="h-12 w-full rounded-xl border border-[var(--border)] px-4" />
                  </label>
                </div>
                <label className="block space-y-2 text-sm">
                  <span className="font-medium">Instructions</span>
                  <textarea name="instructions" required rows={4} className="w-full rounded-xl border border-[var(--border)] px-4 py-3" placeholder="Take with food in the evening for 14 days." />
                </label>
                <Button type="submit" className="rounded-xl px-6">Save prescription</Button>
              </form>
            </Card>
            <Card className="space-y-4">
              <div className="flex items-center gap-3">
                <Pill className="h-5 w-5 text-[var(--teal-700)]" />
                <h2 className="text-2xl font-semibold">Active and recent prescriptions</h2>
              </div>
              {prescriptions.length ? (
                <div className="space-y-3">
                  {prescriptions.map((prescription) => (
                    <div key={prescription.id} className="rounded-[24px] border border-[var(--border)] bg-[var(--slate-50)] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold">{prescription.medicationName}</p>
                          <p className="text-sm text-[var(--foreground-muted)]">{prescription.patientName}</p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--teal-700)]">{prescription.status}</span>
                      </div>
                      <div className="mt-3 grid gap-2 text-sm text-[var(--foreground-muted)] sm:grid-cols-2">
                        <p>{prescription.dosage} ? {prescription.frequency}</p>
                        <p>Prescribed {formatDate(prescription.prescribedAt)}</p>
                        <p>Refills remaining: {prescription.refillsRemaining}</p>
                        <p>{prescription.expiresAt ? 'Expires ' + formatDate(prescription.expiresAt) : "No expiry set"}</p>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-[var(--foreground-muted)]">{prescription.instructions}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[24px] border border-dashed border-[var(--border)] bg-[var(--slate-50)] p-6 text-center">
                  <ClipboardList className="mx-auto h-8 w-8 text-[var(--teal-700)]" />
                  <p className="mt-3 font-semibold">No prescriptions yet</p>
                  <p className="mt-2 text-sm text-[var(--foreground-muted)]">Use the form to issue the first prescription for one of your active patients.</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </DashboardShell>
    );
  } catch (error) {
    console.error("Provider prescriptions page error:", error);
    return <PageErrorState title="Unable to load prescriptions" message="Please refresh the page to try again." href="/provider/prescriptions" />;
  }
}
