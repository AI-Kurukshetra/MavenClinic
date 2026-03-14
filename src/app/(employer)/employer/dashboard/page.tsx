import { Activity, HeartPulse, ShieldCheck, Users } from "lucide-react";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { EmployerAnalyticsCharts } from "@/components/health/employer-analytics-charts";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { getEmployerAnalyticsData } from "@/lib/data";

function formatContractEnd(value: string | null) {
  if (!value) {
    return "No contract end date on file";
  }

  return `Contract ends ${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))}`;
}

export default async function EmployerDashboardPage() {
  const data = await getEmployerAnalyticsData();

  return (
    <DashboardShell title="Employer dashboard" eyebrow="Population health" section="employer">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard title="Covered employees" value={String(data.stats.coveredEmployees)} delta={`${data.stats.employerName} Â· ${data.stats.planType}`} icon={Users} />
          <StatCard title="Monthly active users" value={String(data.stats.monthlyActiveUsers)} delta="Employees active this month" icon={Activity} />
          <StatCard title="Visit completion rate" value={`${data.stats.completionRate}%`} delta="Completed scheduled visits" icon={ShieldCheck} />
          <StatCard title="Active care plans" value={String(data.stats.activeCarePlans)} delta={formatContractEnd(data.stats.contractEnd)} icon={HeartPulse} />
        </div>
        <Card className="p-6">
          <p className="text-sm leading-7 text-[var(--foreground-muted)]">
            This workspace is now driven by live employer-scoped utilization data. Every chart and headline card is aggregated from covered employees only, with no individual patient detail exposed.
          </p>
        </Card>
        <EmployerAnalyticsCharts mau={data.mau} categories={data.categories} />
      </div>
    </DashboardShell>
  );
}
