import { Toast } from "@/components/ui/Toast";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { ClinicProvidersManagementPage } from "@/features/clinic/clinic-providers-management-page";
import { getClinicProvidersManagementData } from "@/lib/clinic-provider-approvals";

function getParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : null;
}

export default async function ClinicProvidersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const data = await getClinicProvidersManagementData();
  const message = getParam(params.message);
  const error = getParam(params.error);

  return (
    <DashboardShell title="Providers" eyebrow="Clinic administration" section="clinic">
      <div className="space-y-6">
        {message ? <Toast message={message} variant="success" /> : null}
        {error ? <Toast message={error} variant="error" /> : null}
        <ClinicProvidersManagementPage {...data} />
      </div>
    </DashboardShell>
  );
}
