import type { Metadata } from "next";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { SupportGroupsPage } from "@/features/patient/support-groups-page";
import { getPatientSupportGroupsPageData } from "@/lib/patient-pages";

export const metadata: Metadata = {
  title: "Support Groups - Maven Clinic",
};

export const revalidate = 0;

export default async function SupportGroupsRoute() {
  const data = await getPatientSupportGroupsPageData();

  return (
    <DashboardShell title="Support Groups" eyebrow="Community care">
      <SupportGroupsPage {...data} />
    </DashboardShell>
  );
}