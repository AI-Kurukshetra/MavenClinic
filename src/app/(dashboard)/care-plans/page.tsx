import type { Metadata } from "next";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { PageErrorState } from "@/components/ui/PageErrorState";
import { PatientCarePlansPage } from "@/features/care-plans/patient-care-plans-page";
import { getPatientCarePlansPageData } from "@/lib/data";

export const metadata: Metadata = {
  title: "Care Plans - Maven Clinic",
};

export const revalidate = 0;

export default async function CarePlansPage() {
  try {
    const data = await getPatientCarePlansPageData();

    return (
      <DashboardShell title="Care plans" eyebrow="Provider-guided next steps">
        <PatientCarePlansPage {...data} />
      </DashboardShell>
    );
  } catch (error) {
    console.error("Care plans page error:", error);
    return (
      <DashboardShell title="Care plans" eyebrow="Provider-guided next steps">
        <PageErrorState title="Unable to load care plans" message="Please refresh the page to try again." href="/care-plans" />
      </DashboardShell>
    );
  }
}
