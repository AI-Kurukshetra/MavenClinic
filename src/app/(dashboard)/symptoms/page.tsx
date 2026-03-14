import type { Metadata } from "next";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { SymptomTracker } from "@/features/symptoms/symptom-tracker";
import { getSymptomsTrackerData } from "@/lib/symptoms";

export const metadata: Metadata = {
  title: "Symptom Tracker — Maven Clinic",
};

export const revalidate = 0;

export default async function SymptomsPage() {
  const data = await getSymptomsTrackerData();

  return (
    <DashboardShell title="Symptom tracker" eyebrow="Daily patterns and AI insights">
      <SymptomTracker {...data} />
    </DashboardShell>
  );
}