import { Toast } from "@/components/ui/Toast";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { ClinicSupportGroupsManager } from "@/features/clinic/clinic-support-groups-manager";
import { getClinicSupportGroupsPageData } from "@/lib/clinic-admin-data";

function getParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : null;
}

export default async function ClinicSupportGroupsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const groupsData = await getClinicSupportGroupsPageData();
  const message = getParam(params.message);
  const error = getParam(params.error);

  return (
    <DashboardShell title="Support Groups" eyebrow="Clinic administration" section="clinic">
      <div className="space-y-6">
        {message ? <Toast message={message} variant="success" /> : null}
        {error ? <Toast message={error} variant="error" /> : null}
        <ClinicSupportGroupsManager
          groups={groupsData.groups}
          moderators={groupsData.moderators}
          redirectTo="/clinic/support-groups"
        />
      </div>
    </DashboardShell>
  );
}