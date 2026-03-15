import type { Metadata } from "next";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { PageErrorState } from "@/components/ui/PageErrorState";
import { SupportGroupsPage } from "@/features/patient/support-groups-page";
import { getPatientSupportGroupsPageData } from "@/lib/patient-pages";

export const metadata: Metadata = {
  title: "Support Groups - Maven Clinic",
};

export const revalidate = 0;

export default async function SupportGroupsRoute() {
  try {
    const data = await getPatientSupportGroupsPageData();

    return (
      <DashboardShell title="Support Groups" eyebrow="Community care">
        <SupportGroupsPage {...data} />
      </DashboardShell>
    );
  } catch (error) {
    console.error("Support groups page error:", error);
    return (
      <DashboardShell title="Support Groups" eyebrow="Community care">
        <PageErrorState title="Unable to load support groups" message="Please refresh the page to try again." href="/support-groups" />
      </DashboardShell>
    );
  }
}
