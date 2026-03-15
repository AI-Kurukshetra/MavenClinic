import { DashboardShell } from "@/components/health/dashboard-shell";
import { ProviderCarePlansPage } from "@/features/care-plans/provider-care-plans-page";
import { getProviderCarePlansPageData } from "@/lib/data";

function getParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : null;
}

export default async function ProviderCarePlansRoute({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [data, params] = await Promise.all([getProviderCarePlansPageData(), searchParams]);
  const initialPatientId = getParam(params.patientId);

  return (
    <DashboardShell title="Care plans" eyebrow="Provider workflow" section="provider">
      <ProviderCarePlansPage {...data} initialPatientId={initialPatientId} />
    </DashboardShell>
  );
}
