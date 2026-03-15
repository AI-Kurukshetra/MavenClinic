import type { Metadata } from "next";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { PageErrorState } from "@/components/ui/PageErrorState";
import { PatientPartnerSettings } from "@/features/settings/patient-partner-settings";
import { getPatientSettingsPageData } from "@/lib/data";

export const metadata: Metadata = {
  title: "Settings - Maven Clinic",
};

export const revalidate = 0;

export default async function SettingsPage() {
  try {
    const data = await getPatientSettingsPageData();

    return (
      <DashboardShell title="Settings" eyebrow="Profile and partner access">
        <PatientPartnerSettings {...data} />
      </DashboardShell>
    );
  } catch (error) {
    console.error("Settings page error:", error);
    return (
      <DashboardShell title="Settings" eyebrow="Profile and partner access">
        <PageErrorState title="Unable to load settings" message="Please refresh the page to try again." href="/settings" />
      </DashboardShell>
    );
  }
}
