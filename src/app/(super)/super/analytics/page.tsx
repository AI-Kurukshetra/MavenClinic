import { DashboardShell } from "@/components/health/dashboard-shell";
import { SuperAnalyticsPanel } from "@/features/super/super-admin-panels";
import { getSuperAnalyticsPageData } from "@/lib/super-admin-data";

export default async function SuperAnalyticsPage() {
  const data = await getSuperAnalyticsPageData();

  return (
    <DashboardShell title="Analytics" eyebrow="Platform intelligence" section="super">
      <SuperAnalyticsPanel data={data} />
    </DashboardShell>
  );
}
