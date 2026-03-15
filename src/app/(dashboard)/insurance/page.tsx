import type { Metadata } from "next";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { PageErrorState } from "@/components/ui/PageErrorState";
import { InsurancePage } from "@/features/patient/insurance-page";
import { getPatientInsurancePageData } from "@/lib/patient-pages";

export const metadata: Metadata = {
  title: "Insurance - Maven Clinic",
};

export const revalidate = 0;

export default async function InsuranceRoute() {
  try {
    const data = await getPatientInsurancePageData();

    return (
      <DashboardShell title="Insurance" eyebrow="Coverage and claims">
        <InsurancePage {...data} />
      </DashboardShell>
    );
  } catch (error) {
    console.error("Insurance page error:", error);
    return (
      <DashboardShell title="Insurance" eyebrow="Coverage and claims">
        <PageErrorState title="Unable to load insurance details" message="Please refresh the page to try again." href="/insurance" />
      </DashboardShell>
    );
  }
}
