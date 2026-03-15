import { Activity, Clock3, HeartPulse, ShieldCheck, Users } from "lucide-react";
import { EmployerAnalyticsCharts } from "@/components/health/employer-analytics-charts";
import { DashboardShell } from "@/components/health/dashboard-shell";
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

function formatPlanType(value: string | null) {
  if (!value) {
    return "No plan";
  }

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function EmployerDashboardPage() {
  const data = await getEmployerAnalyticsData();

  return (
    <DashboardShell title="Employer dashboard" eyebrow="Population health" section="employer">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Covered employees"
            value={String(data.stats.coveredEmployees)}
            delta={`${data.stats.employerName} - ${formatPlanType(data.stats.planType)}`}
            icon={Users}
          />
          <StatCard title="Monthly active users" value={String(data.stats.monthlyActiveUsers)} delta="Employees active this month" icon={Activity} />
          <StatCard title="Visit completion rate" value={`${data.stats.completionRate}%`} delta="Completed scheduled visits" icon={ShieldCheck} />
          <StatCard title="Active care plans" value={String(data.stats.activeCarePlans)} delta={formatContractEnd(data.stats.contractEnd)} icon={HeartPulse} />
        </div>

        <Card className="border-[rgba(46,168,152,0.18)] bg-[rgba(46,168,152,0.08)] p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-white/80 p-3 text-[var(--teal-700)]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">All data is aggregated and anonymized.</p>
              <p className="mt-1 text-sm leading-6 text-[var(--foreground-muted)]">
                Individual employee health information is never shared.
              </p>
            </div>
          </div>
        </Card>

        <EmployerAnalyticsCharts mau={data.mau} categories={data.categories} coveredEmployees={data.stats.coveredEmployees} />

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-[var(--foreground-muted)]">Estimated cost savings</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight">{formatCurrency(data.roi.estimatedSavings)} saved</p>
                <p className="mt-1 text-sm text-[var(--teal-700)]">vs. traditional ER/urgent care visits</p>
              </div>
              <div className="rounded-2xl bg-[rgba(61,191,173,0.12)] p-3 text-[var(--teal-700)]">
                <HeartPulse className="h-5 w-5" />
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-[var(--foreground-muted)]">Average time to appointment</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight">{data.roi.averageHoursToAppointment} hours</p>
                <p className="mt-1 text-sm text-[var(--teal-700)]">average time to see a specialist</p>
              </div>
              <div className="rounded-2xl bg-[rgba(61,191,173,0.12)] p-3 text-[var(--teal-700)]">
                <Clock3 className="h-5 w-5" />
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-[var(--foreground-muted)]">Employee satisfaction</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight">
                  {data.roi.satisfaction.toFixed(1)} / 5.0 <span className="text-amber-400">{"\u2605"}</span>
                </p>
                <p className="mt-1 text-sm text-[var(--teal-700)]">Based on post-visit surveys</p>
              </div>
              <div className="rounded-2xl bg-[rgba(61,191,173,0.12)] p-3 text-[var(--teal-700)]">
                <Activity className="h-5 w-5" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
