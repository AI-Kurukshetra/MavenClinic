import { Toast } from "@/components/ui/Toast";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { ClinicCareTemplatesManager } from "@/features/clinic/clinic-care-templates-manager";
import { getClinicCareTemplatesPageData } from "@/lib/clinic-admin-data";

function getParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : null;
}

export default async function ClinicCareTemplatesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const data = await getClinicCareTemplatesPageData();
  const message = getParam(params.message);
  const error = getParam(params.error);

  return (
    <DashboardShell title="Care Templates" eyebrow="Clinic administration" section="clinic">
      <div className="space-y-6">
        {message ? <Toast message={message} variant="success" /> : null}
        {error ? <Toast message={error} variant="error" /> : null}
        <ClinicCareTemplatesManager templates={data.templates} redirectTo="/clinic/care-templates" />
      </div>
    </DashboardShell>
  );
}
