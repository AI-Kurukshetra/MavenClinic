import type { Route } from "next";
import Link from "next/link";
import { Toast } from "@/components/ui/Toast";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { ClinicDashboardTabs, ClinicQuickLink } from "@/features/clinic/clinic-dashboard-tools";
import { getClinicDashboardData } from "@/lib/clinic-admin-data";

function parseMessage(value: string | string[] | undefined) {
  return typeof value === "string" ? value : null;
}

export default async function ClinicDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const data = await getClinicDashboardData();
  const message = parseMessage(params.message);
  const error = parseMessage(params.error);
  const tab = parseMessage(params.tab) ?? undefined;

  return (
    <DashboardShell title="Clinic dashboard" eyebrow="Operations and governance" section="clinic">
      <div className="space-y-6">
        {message ? <Toast message={message} variant="success" /> : null}
        {error ? <Toast message={error} variant="error" /> : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.stats.cards.map((card) => (
            <Link key={card.title} href={card.href as Route}>
              <StatCard title={card.title} value={card.value} delta={card.delta} />
            </Link>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {data.stats.summary.map((item) => (
            <Card key={item} className="p-5 text-sm leading-7 text-[var(--foreground-muted)]">
              {item}
            </Card>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <ClinicQuickLink href="/clinic/content" label="Content library" detail="Review educational content, authors, and publishing state." />
          <ClinicQuickLink href="/clinic/support-groups" label="Support groups" detail="Manage moderated groups and active community programming." />
          <ClinicQuickLink href="/clinic/analytics" label="Platform analytics" detail="Track platform growth, usage trends, and completion rates." />
        </div>

        <ClinicDashboardTabs
          initialTab={tab}
          providers={data.providerManagement}
          invitations={data.invitationQueue}
          conversations={data.conversationLoad}
          notifications={data.notifications}
          redirectTo="/clinic/dashboard"
        />
      </div>
    </DashboardShell>
  );
}
