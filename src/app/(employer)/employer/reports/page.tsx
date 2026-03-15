import { EmployerReportsPageClient } from "@/components/health/employer-reports-page";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { getEmployerReportsPageData } from "@/lib/data";

export default async function EmployerReportsPage() {
  const data = await getEmployerReportsPageData();

  return (
    <DashboardShell title="Reports" eyebrow="Reporting & analytics" section="employer">
      <EmployerReportsPageClient {...data} />
    </DashboardShell>
  );
}
