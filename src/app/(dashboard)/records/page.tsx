import { FileText, FlaskConical, Pill } from "lucide-react";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { Card } from "@/components/ui/card";
import { getRecordsData } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export default async function RecordsPage() {
  const { records, prescriptions, labs } = await getRecordsData();

  return (
    <DashboardShell title="Medical records" eyebrow="Lab results, prescriptions, and visit history">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <Pill className="h-5 w-5 text-[var(--teal-700)]" />
              <div>
                <p className="text-sm text-[var(--foreground-muted)]">Prescriptions</p>
                <p className="text-2xl font-semibold">{prescriptions.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <FlaskConical className="h-5 w-5 text-[var(--teal-700)]" />
              <div>
                <p className="text-sm text-[var(--foreground-muted)]">Lab results</p>
                <p className="text-2xl font-semibold">{labs.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-[var(--teal-700)]" />
              <div>
                <p className="text-sm text-[var(--foreground-muted)]">Total records</p>
                <p className="text-2xl font-semibold">{records.length}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="space-y-4">
            <div className="flex items-center gap-3">
              <Pill className="h-5 w-5 text-[var(--teal-700)]" />
              <h2 className="text-2xl font-semibold">Prescriptions</h2>
            </div>
            {prescriptions.length ? (
              <div className="space-y-3">
                {prescriptions.map((prescription) => (
                  <div key={prescription.id} className="rounded-[24px] border border-[var(--border)] bg-[var(--slate-50)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{prescription.medicationName}</p>
                        <p className="text-sm text-[var(--foreground-muted)]">{prescription.providerName}</p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--teal-700)]">{prescription.status}</span>
                    </div>
                    <p className="mt-3 text-sm text-[var(--foreground-muted)]">{prescription.dosage} · {prescription.frequency}</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">{prescription.instructions}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.16em] text-[var(--foreground-muted)]">Issued {formatDate(prescription.prescribedAt)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--foreground-muted)]">No prescriptions have been added to your chart yet.</p>
            )}
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center gap-3">
              <FlaskConical className="h-5 w-5 text-[var(--teal-700)]" />
              <h2 className="text-2xl font-semibold">Lab results</h2>
            </div>
            {labs.length ? (
              <div className="space-y-3">
                {labs.map((lab) => (
                  <div key={lab.id} className="rounded-[24px] border border-[var(--border)] bg-[var(--slate-50)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{lab.panelName}</p>
                        <p className="text-sm text-[var(--foreground-muted)]">{lab.providerName}</p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--teal-700)]">{lab.status}</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[var(--foreground-muted)]">{lab.summary}</p>
                    {lab.markers.length ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {lab.markers.map((marker) => (
                          <span key={`${lab.id}-${marker.label}`} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--foreground-muted)]">
                            {marker.label}: {marker.value}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <p className="mt-3 text-xs uppercase tracking-[0.16em] text-[var(--foreground-muted)]">{lab.resultedAt ? `Resulted ${formatDate(lab.resultedAt)}` : `Ordered ${formatDate(lab.orderedAt)}`}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--foreground-muted)]">No lab results are available yet. Your provider will share them here once reviewed.</p>
            )}
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}