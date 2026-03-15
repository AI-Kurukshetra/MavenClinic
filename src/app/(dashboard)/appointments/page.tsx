import type { Metadata } from "next";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { Card } from "@/components/ui/card";
import { AppointmentsView } from "@/features/appointments/appointments-view";
import { getAppointmentsPageData } from "@/lib/appointments-data";

export const metadata: Metadata = {
  title: "Appointments - Maven Clinic",
};

export const revalidate = 0;

function AppointmentsErrorState() {
  return (
    <Card className="space-y-3 border-[rgba(212,88,123,0.18)] bg-[rgba(212,88,123,0.08)]">
      <h2 className="text-2xl font-semibold text-[var(--foreground)]">Unable to load appointments</h2>
      <p className="text-sm text-[var(--foreground-muted)]">
        We could not load your appointments right now. Please refresh the page and try again.
      </p>
    </Card>
  );
}

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const toast = typeof params.toast === "string" ? params.toast : null;

  try {
    const data = await getAppointmentsPageData();

    return (
      <DashboardShell title="Appointments" eyebrow="Booking and upcoming visits">
        <AppointmentsView {...data} initialToast={toast} />
      </DashboardShell>
    );
  } catch (error) {
    console.error("Appointments data error:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return (
      <DashboardShell title="Appointments" eyebrow="Booking and upcoming visits">
        <AppointmentsErrorState />
      </DashboardShell>
    );
  }
}
