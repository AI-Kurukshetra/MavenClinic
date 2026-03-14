import { Activity, DollarSign, SmilePlus, Users } from "lucide-react";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { EmployerAnalyticsCharts } from "@/components/health/employer-analytics-charts";
import { StatCard } from "@/components/ui/stat-card";
import { getEmployerAnalyticsData } from "@/lib/data";

export default async function EmployerDashboardPage() {
  const data = await getEmployerAnalyticsData();

  return (
    <DashboardShell title="Employer dashboard" eyebrow="Population health" section="employer">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard title="Monthly active users" value="2,050" delta="+12% QoQ" icon={Users} />
          <StatCard title="Completion rate" value="92%" delta="Consultations attended" icon={Activity} />
          <StatCard title="Employee NPS" value="68" delta="Strong satisfaction" icon={SmilePlus} />
          <StatCard title="Cost savings" value="$307K" delta="ER deflection model" icon={DollarSign} />
        </div>
        <EmployerAnalyticsCharts mau={data.mau} categories={data.categories} />
      </div>
    </DashboardShell>
  );
}
