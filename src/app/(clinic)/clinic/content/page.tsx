import { Toast } from "@/components/ui/Toast";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { ClinicContentManager } from "@/features/clinic/clinic-content-manager";
import { getClinicContentPageData } from "@/lib/clinic-admin-data";

function getParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : null;
}

export default async function ClinicContentPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const data = await getClinicContentPageData();
  const message = getParam(params.message);
  const error = getParam(params.error);

  return (
    <DashboardShell title="Content" eyebrow="Clinic administration" section="clinic">
      <div className="space-y-6">
        {message ? <Toast message={message} variant="success" /> : null}
        {error ? <Toast message={error} variant="error" /> : null}
        <ClinicContentManager articles={data.articles} redirectTo="/clinic/content" />
      </div>
    </DashboardShell>
  );
}
