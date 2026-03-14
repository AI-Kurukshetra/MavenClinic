import { Building2, FileCheck, Shield, Users } from "lucide-react";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { ClinicDashboard } from "@/features/clinic/clinic-dashboard";
import { getClinicDashboardData } from "@/lib/data";

export default async function ClinicDashboardPage() {
  const data = await getClinicDashboardData();

  return (
    <DashboardShell title="Clinic dashboard" eyebrow="Operations and governance" section="clinic">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard title="Pending provider reviews" value="3" delta="2 require approval today" icon={Users} />
          <StatCard title="Published resources" value="42" delta="5 updated this week" icon={Building2} />
          <StatCard title="Moderation alerts" value="4" delta="1 urgent escalation" icon={Shield} />
          <StatCard title="Audit events" value="128" delta="Last 7 days" icon={FileCheck} />
        </div>
        <Card className="p-6">
          <p className="text-sm leading-7 text-[var(--foreground-muted)]">
            Clinic administrators oversee provider access, educational publishing, group moderation, and compliance reviews from one workspace. Use the tabs below to move between the four operational queues.
          </p>
        </Card>
        <ClinicDashboard {...data} />
      </div>
    </DashboardShell>
  );
}