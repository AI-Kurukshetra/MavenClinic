import { DashboardShell } from "@/components/health/dashboard-shell";

export default function PartnerWorkspaceLoading() {
  return (
    <DashboardShell title="Partner portal" eyebrow="Partner portal" section="partner">
      <div className="space-y-6 animate-pulse">
        <div className="h-40 rounded-[28px] bg-white/70" />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="h-32 rounded-[28px] bg-white/70" />
          <div className="h-32 rounded-[28px] bg-white/70" />
          <div className="h-32 rounded-[28px] bg-white/70" />
        </div>
        <div className="h-80 rounded-[28px] bg-white/70" />
      </div>
    </DashboardShell>
  );
}
