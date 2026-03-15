import type { Metadata } from "next";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { PatientCarePlansPage } from "@/features/care-plans/patient-care-plans-page";
import { getPatientCarePlansPageData } from "@/lib/data";

export const metadata: Metadata = {
  title: "Care Plans - Maven Clinic",
};

export const revalidate = 0;

export default async function CarePlansPage() {
  const data = await getPatientCarePlansPageData();

  return (
    <DashboardShell title="Care plans" eyebrow="Provider-guided next steps">
      <PatientCarePlansPage {...data} />
    </DashboardShell>
  );
}
