import type { Metadata } from "next";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { PageErrorState } from "@/components/ui/PageErrorState";
import { PregnancyPage } from "@/features/patient/pregnancy-page";
import { getPatientPregnancyPageData } from "@/lib/patient-pages";

export const metadata: Metadata = {
  title: "Pregnancy - Maven Clinic",
};

export const revalidate = 0;

export default async function PregnancyRoute() {
  try {
    const data = await getPatientPregnancyPageData();

    return (
      <DashboardShell title="Pregnancy" eyebrow="Weekly milestone tracking">
        <PregnancyPage {...data} />
      </DashboardShell>
    );
  } catch (error) {
    console.error("Pregnancy page error:", error);
    return (
      <DashboardShell title="Pregnancy" eyebrow="Weekly milestone tracking">
        <PageErrorState title="Unable to load pregnancy tracking" message="Please refresh the page to try again." href="/pregnancy" />
      </DashboardShell>
    );
  }
}
