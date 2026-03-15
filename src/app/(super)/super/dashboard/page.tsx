import { Toast } from "@/components/ui/Toast";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { SuperDashboardPanel } from "@/features/super/super-admin-panels";
import { getSuperDashboardData } from "@/lib/super-admin-data";

function getParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : null;
}

export default async function SuperDashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const data = await getSuperDashboardData();
  const message = getParam(params.message);
  const error = getParam(params.error);

  return (
    <DashboardShell title="Super admin dashboard" eyebrow="Platform command center" section="super">
      <div className="space-y-6">
        {message ? <Toast message={message} variant="success" /> : null}
        {error ? <Toast message={error} variant="error" /> : null}
        <SuperDashboardPanel data={data} />
      </div>
    </DashboardShell>
  );
}
