import type { Metadata } from "next";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { PageErrorState } from "@/components/ui/PageErrorState";
import { EducationLibrary } from "@/features/education/education-library";
import { getEducationData } from "@/lib/data";

export const metadata: Metadata = {
  title: "Education Library - Maven Clinic",
};

export const revalidate = 0;

export default async function EducationPage() {
  try {
    const { articles } = await getEducationData();

    return (
      <DashboardShell title="Education library" eyebrow="Curated learning for every chapter">
        <EducationLibrary articles={articles} />
      </DashboardShell>
    );
  } catch (error) {
    console.error("Education page error:", error);
    return (
      <DashboardShell title="Education library" eyebrow="Curated learning for every chapter">
        <PageErrorState title="Unable to load education" message="Please refresh the page to try again." href="/education" />
      </DashboardShell>
    );
  }
}
