import { Toast } from "@/components/ui/Toast";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { ClinicProvidersPanel } from "@/features/clinic/clinic-providers-panel";
import { getClinicProvidersPageData } from "@/lib/clinic-admin-data";

function getParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : null;
}

export default async function ClinicProvidersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const data = await getClinicProvidersPageData();
  const message = getParam(params.message);
  const error = getParam(params.error);

  return (
    <DashboardShell title="Providers" eyebrow="Clinic administration" section="clinic">
      <div className="space-y-6">
        {message ? <Toast message={message} variant="success" /> : null}
        {error ? <Toast message={error} variant="error" /> : null}
        <ClinicProvidersPanel providers={data.providers} redirectTo="/clinic/providers" />
      </div>
    </DashboardShell>
  );
}
