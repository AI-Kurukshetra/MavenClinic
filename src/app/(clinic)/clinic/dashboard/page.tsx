import { BellRing, MessageSquareMore, UserRoundCheck, UserRoundPlus } from "lucide-react";
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
          <StatCard title="Active providers" value={String(data.stats.activeProviders)} delta="Live provider roster" icon={UserRoundCheck} />
          <StatCard title="Pending invites" value={String(data.stats.pendingInvites)} delta="Provider onboarding queue" icon={UserRoundPlus} />
          <StatCard title="Open conversations" value={String(data.stats.openConversations)} delta="Patient-provider threads" icon={MessageSquareMore} />
          <StatCard title="Recent notifications" value={String(data.stats.recentNotifications)} delta="Operational events in the last 7 days" icon={BellRing} />
        </div>
        <Card className="p-6">
          <p className="text-sm leading-7 text-[var(--foreground-muted)]">
            This operations workspace now reflects the actual database state: provider records, invitation flow, conversation load, and recent system notifications. It no longer relies on fabricated content or support-group queues.
          </p>
        </Card>
        <ClinicDashboard {...data} />
      </div>
    </DashboardShell>
  );
}
