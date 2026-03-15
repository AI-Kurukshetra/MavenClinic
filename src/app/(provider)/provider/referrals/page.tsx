import { DashboardShell } from "@/components/health/dashboard-shell";
import { ProviderReferralsPage } from "@/features/referrals/provider-referrals-page";
import { getProviderReferralsPageData } from "@/lib/referrals";

export default async function ProviderReferralsRoute() {
  const data = await getProviderReferralsPageData();

  return (
    <DashboardShell title="Referrals" eyebrow="Provider workflow" section="provider">
      <ProviderReferralsPage {...data} />
    </DashboardShell>
  );
}
