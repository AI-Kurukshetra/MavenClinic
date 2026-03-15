import { DashboardShell } from "@/components/health/dashboard-shell";
import { PageErrorState } from "@/components/ui/PageErrorState";
import { PatientReferralsPage } from "@/features/referrals/patient-referrals-page";
import { getPatientReferralsPageData } from "@/lib/referrals";

export const revalidate = 0;

export default async function ReferralsPage() {
  try {
    const data = await getPatientReferralsPageData();

    return (
      <DashboardShell title="Referrals" eyebrow="Care network" section="patient">
        <PatientReferralsPage {...data} />
      </DashboardShell>
    );
  } catch (error) {
    console.error("Referrals page error:", error);
    return (
      <DashboardShell title="Referrals" eyebrow="Care network" section="patient">
        <PageErrorState title="Unable to load referrals" message="Please refresh the page to try again." href="/referrals" />
      </DashboardShell>
    );
  }
}
