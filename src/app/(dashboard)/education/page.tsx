import type { Metadata } from "next";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { EducationLibrary } from "@/features/education/education-library";
import { getEducationData } from "@/lib/data";

export const metadata: Metadata = {
  title: "Education Library - Maven Clinic",
};

export const revalidate = 3600;

export default async function EducationPage() {
  const { articles } = await getEducationData();

  return (
    <DashboardShell title="Education library" eyebrow="Curated learning for every chapter">
      <EducationLibrary articles={articles} />
    </DashboardShell>
  );
}
