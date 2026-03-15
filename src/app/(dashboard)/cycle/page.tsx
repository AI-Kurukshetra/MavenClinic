import type { Metadata } from "next";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { PageErrorState } from "@/components/ui/PageErrorState";
import { CycleTracker } from "@/features/cycle/cycle-tracker";
import { getCycleTrackerData } from "@/lib/cycle";

export const metadata: Metadata = {
  title: "Cycle Tracker - Maven Clinic",
};

export const revalidate = 0;

export default async function CyclePage() {
  try {
    const data = await getCycleTrackerData();

    return (
      <DashboardShell title="Cycle tracking" eyebrow="Calendar and forecasting">
        <CycleTracker {...data} todayIso={new Date().toISOString()} />
      </DashboardShell>
    );
  } catch (error) {
    console.error("Cycle page error:", error);
    return (
      <DashboardShell title="Cycle tracking" eyebrow="Calendar and forecasting">
        <PageErrorState title="Unable to load cycle tracker" message="Please refresh the page to try again." href="/cycle" />
      </DashboardShell>
    );
  }
}
