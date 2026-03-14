import { DashboardShell } from "@/components/health/dashboard-shell";
import { AppointmentsView } from "@/features/appointments/appointments-view";
import { getAppointmentsPageData } from "@/lib/appointments-data";

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [data, params] = await Promise.all([getAppointmentsPageData(), searchParams]);
  const toast = typeof params.toast === "string" ? params.toast : null;

  return (
    <DashboardShell title="Appointments" eyebrow="Booking and upcoming visits">
      <AppointmentsView {...data} initialToast={toast} />
    </DashboardShell>
  );
}