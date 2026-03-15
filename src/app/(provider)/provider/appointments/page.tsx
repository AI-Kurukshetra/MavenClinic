import { DashboardShell } from "@/components/health/dashboard-shell";
import { ProviderAppointmentsPage } from "@/features/appointments/provider-appointments-page";
import { getProviderAppointmentsPageData } from "@/lib/provider-appointments";

function getParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : null;
}

export default async function ProviderAppointmentsRoute({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [data, params] = await Promise.all([getProviderAppointmentsPageData(), searchParams]);
  const toast = getParam(params.toast);

  return (
    <DashboardShell title="Appointments" eyebrow="Provider workflow" section="provider">
      <ProviderAppointmentsPage {...data} initialToast={toast} />
    </DashboardShell>
  );
}
