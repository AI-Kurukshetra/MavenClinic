import type { Metadata } from "next";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { PatientPartnerSettings } from "@/features/settings/patient-partner-settings";
import { getPatientSettingsPageData } from "@/lib/data";

export const metadata: Metadata = {
  title: "Settings - Maven Clinic",
};

export const revalidate = 0;

export default async function SettingsPage() {
  const data = await getPatientSettingsPageData();

  return (
    <DashboardShell title="Settings" eyebrow="Profile and partner access">
      <PatientPartnerSettings {...data} />
    </DashboardShell>
  );
}
