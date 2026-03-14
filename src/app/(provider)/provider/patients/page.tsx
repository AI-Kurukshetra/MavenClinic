import { DashboardShell } from "@/components/health/dashboard-shell";
import { Card } from "@/components/ui/card";

const patients = [
  { name: "Ariana Bennett", lastVisit: "Mar 8", plan: "Preconception support", status: "Active" },
  { name: "Naomi Ellis", lastVisit: "Mar 11", plan: "Hormone transition check-ins", status: "Needs review" },
  { name: "Claire Dawson", lastVisit: "Mar 13", plan: "Fertility diagnostics", status: "Active" },
];

export default function ProviderPatientsPage() {
  return (
    <DashboardShell title="Patients" eyebrow="Caseload overview" section="provider">
      <div className="grid gap-4">
        {patients.map((patient) => (
          <Card key={patient.name} className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">{patient.name}</h2>
              <p className="text-sm text-[var(--foreground-muted)]">Last visit {patient.lastVisit}</p>
            </div>
            <div className="text-right">
              <p className="font-medium">{patient.plan}</p>
              <p className="text-sm text-[var(--teal-700)]">{patient.status}</p>
            </div>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}

