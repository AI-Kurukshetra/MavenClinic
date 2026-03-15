import { DashboardShell } from "@/components/health/dashboard-shell";
import { Card } from "@/components/ui/card";

export default function ClinicCompliancePage() {
  const metrics = [
    { title: "HIPAA training", value: "100% compliant", detail: "All required training is current" },
    { title: "Data retention", value: "Active", detail: "Retention policies are enabled" },
    { title: "Breach incidents", value: "0 this year", detail: "No reported incidents in the current year" },
    { title: "Last audit", value: "Coming soon", detail: "Full audit reporting arrives in Phase 5" },
  ];

  return (
    <DashboardShell title="Compliance" eyebrow="Clinic administration" section="clinic">
      <div className="space-y-6">
        <Card className="p-6">
          <p className="text-sm uppercase tracking-[0.22em] text-[var(--rose-700)]">Compliance & audit</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Compliance & audit</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--foreground-muted)]">Full compliance reporting available in Phase 5.</p>
        </Card>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <Card key={metric.title} className="p-5">
              <p className="text-sm text-[var(--foreground-muted)]">{metric.title}</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight">{metric.value}</p>
              <p className="mt-2 text-sm text-[var(--teal-700)]">{metric.detail}</p>
            </Card>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
