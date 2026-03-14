import { DashboardShell } from "@/components/health/dashboard-shell";
import { Card } from "@/components/ui/card";

export default function AppointmentsLoading() {
  return (
    <DashboardShell title="Appointments" eyebrow="Booking and upcoming visits">
      <div className="space-y-6">
        <div className="h-12 w-80 animate-pulse rounded-full bg-[var(--slate-100)]" />
        <Card className="h-56 animate-pulse bg-[var(--slate-50)]" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="h-64 animate-pulse bg-[var(--slate-50)]" />
          <Card className="h-64 animate-pulse bg-[var(--slate-50)]" />
        </div>
      </div>
    </DashboardShell>
  );
}