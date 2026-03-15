import type { Metadata } from "next";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { WellnessPage } from "@/features/patient/wellness-page";
import { getPatientWellnessPageData } from "@/lib/patient-pages";

export const metadata: Metadata = {
  title: "Wellness - Maven Clinic",
};

export const revalidate = 0;

export default async function WellnessRoute() {
  const data = await getPatientWellnessPageData();

  return (
    <DashboardShell title="Wellness" eyebrow="Score and assessments">
      <WellnessPage {...data} />
    </DashboardShell>
  );
}