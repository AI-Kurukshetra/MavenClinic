export const dynamic = "force-dynamic";

import { DashboardShell } from "@/components/health/dashboard-shell";
import { PageErrorState } from "@/components/ui/PageErrorState";
import { ProviderReferralsPage } from "@/features/referrals/provider-referrals-page";
import { getProviderReferralsPageData } from "@/lib/referrals";

export default async function ProviderReferralsRoute() {
  try {
    const data = await getProviderReferralsPageData();

    return (
      <DashboardShell title="Referrals" eyebrow="Provider workflow" section="provider">
        <ProviderReferralsPage {...data} />
      </DashboardShell>
    );
  } catch (error) {
    console.error("Provider referrals page error:", error);
    return <PageErrorState title="Unable to load referrals" message="Please refresh the page to try again." href="/provider/referrals" />;
  }
}
