import type { Metadata } from "next";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { FertilityPage } from "@/features/patient/fertility-page";
import { getPatientFertilityPageData } from "@/lib/patient-pages";

export const metadata: Metadata = {
  title: "Fertility - Maven Clinic",
};

export const revalidate = 0;

export default async function FertilityRoute() {
  const data = await getPatientFertilityPageData();

  return (
    <DashboardShell title="Fertility" eyebrow="Conception support">
      <FertilityPage {...data} />
    </DashboardShell>
  );
}