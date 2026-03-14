import { Card } from "@/components/ui/card";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { getRecordsData } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export default async function RecordsPage() {
  const { records } = await getRecordsData();

  return (
    <DashboardShell title="Medical records" eyebrow="Labs, imaging, and visit summaries">
      <div className="grid gap-4">
        {records.map((record) => (
          <Card key={record.id} className="space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--teal-700)]">{record.category}</p>
            <h2 className="text-2xl font-semibold">{record.title}</h2>
            <p className="text-sm text-[var(--foreground-muted)]">{formatDate(record.date)} · {record.provider}</p>
            <p className="text-sm leading-7 text-[var(--foreground-muted)]">{record.summary}</p>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}

