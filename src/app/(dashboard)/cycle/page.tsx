import type { Metadata } from "next";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { CycleTracker } from "@/features/cycle/cycle-tracker";
import { getCycleTrackerData } from "@/lib/cycle";

export const metadata: Metadata = {
  title: "Cycle Tracker — Maven Clinic",
};

export const revalidate = 0;

export default async function CyclePage() {
  const data = await getCycleTrackerData();

  return (
    <DashboardShell title="Cycle tracking" eyebrow="Calendar and forecasting">
      <CycleTracker {...data} todayIso={new Date().toISOString()} />
    </DashboardShell>
  );
}