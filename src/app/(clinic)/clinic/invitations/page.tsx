import { Toast } from "@/components/ui/Toast";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { ClinicInvitationsPanel } from "@/features/clinic/clinic-invitations-panel";
import { getClinicInvitationsPageData } from "@/lib/clinic-admin-data";

function getParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : null;
}

export default async function ClinicInvitationsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const data = await getClinicInvitationsPageData();
  const message = getParam(params.message);
  const error = getParam(params.error);

  return (
    <DashboardShell title="Invitations" eyebrow="Clinic administration" section="clinic">
      <div className="space-y-6">
        {message ? <Toast message={message} variant="success" /> : null}
        {error ? <Toast message={error} variant="error" /> : null}
        <ClinicInvitationsPanel invitations={data.invitations} redirectTo="/clinic/invitations" />
      </div>
    </DashboardShell>
  );
}
