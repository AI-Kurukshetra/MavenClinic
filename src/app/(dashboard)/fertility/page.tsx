import type { Metadata } from "next";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { PageErrorState } from "@/components/ui/PageErrorState";
import { FertilityPage } from "@/features/patient/fertility-page";
import { getPatientFertilityPageData } from "@/lib/patient-pages";

export const metadata: Metadata = {
  title: "Fertility - Maven Clinic",
};

export const revalidate = 0;

export default async function FertilityRoute() {
  try {
    const data = await getPatientFertilityPageData();

    return (
      <DashboardShell title="Fertility" eyebrow="Conception support">
        <FertilityPage {...data} />
      </DashboardShell>
    );
  } catch (error) {
    console.error("Fertility page error:", error);
    return (
      <DashboardShell title="Fertility" eyebrow="Conception support">
        <PageErrorState title="Unable to load fertility insights" message="Please refresh the page to try again." href="/fertility" />
      </DashboardShell>
    );
  }
}
