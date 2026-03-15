import type { Metadata } from "next";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { EmployerAnalyticsPage } from "@/components/health/employer-analytics-page";
import { getEmployerAdvancedAnalyticsData } from "@/lib/data";

export const metadata: Metadata = {
  title: "Employer Analytics - Maven Clinic",
};

export const revalidate = 0;

export default async function EmployerAnalyticsRoute({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const range = typeof params.range === "string" ? params.range : undefined;
  const data = await getEmployerAdvancedAnalyticsData(range);

  return (
    <DashboardShell title="Analytics" eyebrow="Population intelligence" section="employer">
      <EmployerAnalyticsPage {...data} />
    </DashboardShell>
  );
}