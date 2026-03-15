import type { Metadata } from "next";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { PageErrorState } from "@/components/ui/PageErrorState";
import { SymptomTracker } from "@/features/symptoms/symptom-tracker";
import { getSymptomsTrackerData } from "@/lib/symptoms";

export const metadata: Metadata = {
  title: "Symptom Tracker - Maven Clinic",
};

export const revalidate = 0;

export default async function SymptomsPage() {
  try {
    const data = await getSymptomsTrackerData();

    return (
      <DashboardShell title="Symptom tracker" eyebrow="Daily patterns and AI insights">
        <SymptomTracker {...data} />
      </DashboardShell>
    );
  } catch (error) {
    console.error("Symptoms page error:", error);
    return (
      <DashboardShell title="Symptom tracker" eyebrow="Daily patterns and AI insights">
        <PageErrorState title="Unable to load symptom tracking" message="Please refresh the page to try again." href="/symptoms" />
      </DashboardShell>
    );
  }
}
