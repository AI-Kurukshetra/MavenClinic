import { DashboardShell } from "@/components/health/dashboard-shell";
import { Card } from "@/components/ui/card";
import { ClinicAnalyticsCharts } from "@/features/clinic/clinic-analytics-charts";
import { getClinicAnalyticsPageData } from "@/lib/clinic-admin-data";

export default async function ClinicAnalyticsPage() {
  const data = await getClinicAnalyticsPageData();

  return (
    <DashboardShell title="Analytics" eyebrow="Clinic administration" section="clinic">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="p-5"><p className="text-sm text-[var(--foreground-muted)]">Total patients</p><p className="mt-3 text-3xl font-semibold tracking-tight">{data.totals.patients}</p></Card>
          <Card className="p-5"><p className="text-sm text-[var(--foreground-muted)]">Total providers</p><p className="mt-3 text-3xl font-semibold tracking-tight">{data.totals.providers}</p></Card>
          <Card className="p-5"><p className="text-sm text-[var(--foreground-muted)]">Total appointments</p><p className="mt-3 text-3xl font-semibold tracking-tight">{data.totals.appointments}</p></Card>
          <Card className="p-5"><p className="text-sm text-[var(--foreground-muted)]">Total messages</p><p className="mt-3 text-3xl font-semibold tracking-tight">{data.totals.messages}</p></Card>
        </div>
        <ClinicAnalyticsCharts data={data} />
      </div>
    </DashboardShell>
  );
}
