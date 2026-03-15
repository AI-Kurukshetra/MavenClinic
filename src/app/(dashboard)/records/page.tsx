import { FileText, FlaskConical, Pill } from "lucide-react";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { Card } from "@/components/ui/card";
import { PageErrorState } from "@/components/ui/PageErrorState";
import { getRecordsData } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export const revalidate = 0;

export default async function RecordsPage() {
  try {
    const { records, prescriptions, labs } = await getRecordsData();
    const timelineItems = [
      ...labs.map((lab) => ({ id: lab.id, title: lab.panelName, date: lab.resultedAt ?? lab.orderedAt, summary: lab.summary })),
      ...records.map((record) => ({ id: record.id, title: record.title, date: record.date, summary: record.summary })),
    ].sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());

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

          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="space-y-4 p-6">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">Prescriptions</h2>
                <p className="text-sm text-[var(--foreground-muted)]">Medication plans from your care team.</p>
              </div>
              <div className="space-y-3">
                {prescriptions.length ? (
                  prescriptions.map((prescription) => (
                    <div key={prescription.id} className="rounded-[24px] border border-[var(--border)] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[var(--foreground)]">{prescription.medicationName}</p>
                          <p className="text-sm text-[var(--foreground-muted)]">{prescription.dosage} - {prescription.frequency}</p>
                        </div>
                        <span className="rounded-full bg-[var(--teal-50)] px-3 py-1 text-xs font-medium text-[var(--teal-700)]">{prescription.status}</span>
                      </div>
                      <p className="mt-3 text-sm text-[var(--foreground-muted)]">{prescription.instructions}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[var(--foreground-muted)]">No prescriptions available yet.</p>
                )}
              </div>
            </Card>

            <Card className="space-y-4 p-6">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">Labs and visit records</h2>
                <p className="text-sm text-[var(--foreground-muted)]">Recent labs and chart notes.</p>
              </div>
              <div className="space-y-3">
                {timelineItems.length ? (
                  timelineItems.map((item) => (
                    <div key={item.id} className="rounded-[24px] border border-[var(--border)] p-4">
                      <p className="font-semibold text-[var(--foreground)]">{item.title}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--foreground-subtle)]">{formatDate(item.date)}</p>
                      <p className="mt-3 text-sm text-[var(--foreground-muted)]">{item.summary}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[var(--foreground-muted)]">No records available yet.</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </DashboardShell>
    );
  } catch (error) {
    console.error("Records page error:", error);
    return (
      <DashboardShell title="Medical records" eyebrow="Lab results, prescriptions, and visit history">
        <PageErrorState title="Unable to load medical records" message="Please refresh the page to try again." href="/records" />
      </DashboardShell>
    );
  }
}
