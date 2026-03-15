import { Toast } from "@/components/ui/Toast";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { SuperProvidersPanel } from "@/features/super/super-admin-panels";
import { getSuperProvidersPageData } from "@/lib/super-admin-data";

function getParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : null;
}

export default async function SuperProvidersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const data = await getSuperProvidersPageData();
  const message = getParam(params.message);
  const error = getParam(params.error);

  return (
    <DashboardShell title="Providers" eyebrow="Network management" section="super">
      <div className="space-y-6">
        {message ? <Toast message={message} variant="success" /> : null}
        {error ? <Toast message={error} variant="error" /> : null}
        <SuperProvidersPanel data={data} />
      </div>
    </DashboardShell>
  );
}
