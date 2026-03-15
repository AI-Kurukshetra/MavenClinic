import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getProviderDashboardData } from "@/lib/data";
import { formatRelativeTime } from "@/lib/utils";

export default async function ProviderPatientsPage() {
  const { patients } = await getProviderDashboardData();

  return (
    <DashboardShell title="Patients" eyebrow="Caseload overview" section="provider">
      <div className="grid gap-4">
        {patients.length ? (
          patients.map((patient) => (
            <Link
              key={patient.id}
              href={`/provider/patients/${patient.id}`}
              className="block cursor-pointer"
            >
              <Card className="flex flex-wrap items-center justify-between gap-4 transition hover:bg-slate-50">
                <div>
                  <h2 className="text-2xl font-semibold">{patient.name}</h2>
                  <p className="text-sm text-[var(--foreground-muted)]">Last visit {formatRelativeTime(patient.lastVisit)}</p>
                  <p className="mt-2 text-sm text-[var(--foreground-muted)]">{patient.reason}</p>
                </div>
                <div className="ml-auto flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-medium">{patient.carePlan}</p>
                    <Badge variant={patient.carePlan === "Active" ? "success" : "neutral"}>{patient.carePlan}</Badge>
                  </div>
                  <ChevronRight className="h-5 w-5 text-[var(--foreground-muted)]" />
                </div>
              </Card>
            </Link>
          ))
        ) : (
          <Card>
            <p className="text-sm text-[var(--foreground-muted)]">Patients will appear here after appointments are booked with this provider.</p>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}