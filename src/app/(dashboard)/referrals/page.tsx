import { DashboardShell } from "@/components/health/dashboard-shell";
import { PatientReferralsPage } from "@/features/referrals/patient-referrals-page";
import { getPatientReferralsPageData } from "@/lib/referrals";

export default async function ReferralsPage() {
  const data = await getPatientReferralsPageData();

  return (
    <DashboardShell title="Referrals" eyebrow="Care network" section="patient">
      <PatientReferralsPage {...data} />
    </DashboardShell>
  );
}
