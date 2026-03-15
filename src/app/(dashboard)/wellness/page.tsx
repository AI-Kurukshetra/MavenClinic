import type { Metadata } from "next";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { PageErrorState } from "@/components/ui/PageErrorState";
import { WellnessPage } from "@/features/patient/wellness-page";
import { getPatientWellnessPageData } from "@/lib/patient-pages";

export const metadata: Metadata = {
  title: "Wellness - Maven Clinic",
};

export const revalidate = 0;

export default async function WellnessRoute() {
  try {
    const data = await getPatientWellnessPageData();

    return (
      <DashboardShell title="Wellness" eyebrow="Score and assessments">
        <WellnessPage {...data} />
      </DashboardShell>
    );
  } catch (error) {
    console.error("Wellness page error:", error);
    return (
      <DashboardShell title="Wellness" eyebrow="Score and assessments">
        <PageErrorState title="Unable to load wellness" message="Please refresh the page to try again." href="/wellness" />
      </DashboardShell>
    );
  }
}
