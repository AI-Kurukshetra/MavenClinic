export const dynamic = "force-dynamic";

import { DashboardShell } from "@/components/health/dashboard-shell";
import { PageErrorState } from "@/components/ui/PageErrorState";
import { ProviderCarePlansPage } from "@/features/care-plans/provider-care-plans-page";
import { getProviderCarePlansPageData } from "@/lib/data";

function getParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : null;
}

export default async function ProviderCarePlansRoute({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  try {
    const [data, params] = await Promise.all([getProviderCarePlansPageData(), searchParams]);
    const initialPatientId = getParam(params.patientId);

    return (
      <DashboardShell title="Care plans" eyebrow="Provider workflow" section="provider">
        <ProviderCarePlansPage {...data} initialPatientId={initialPatientId} />
      </DashboardShell>
    );
  } catch (error) {
    console.error("Provider care plans page error:", error);
    return <PageErrorState title="Unable to load care plans" message="Please refresh the page to try again." href="/provider/care-plans" />;
  }
}
