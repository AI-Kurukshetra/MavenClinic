import type { Metadata } from "next";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getEducationData } from "@/lib/data";

export const metadata: Metadata = {
  title: "Education Library — Maven Clinic",
};

export const revalidate = 3600;

export default async function EducationPage() {
  const { articles } = await getEducationData();

  return (
    <DashboardShell title="Education library" eyebrow="Curated learning for every chapter">
      <div className="grid gap-4 lg:grid-cols-3">
        {articles.map((article) => (
          <Card key={article.id} className="space-y-4">
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--rose-700)]">{article.category}</p>
            <h2 className="text-2xl font-semibold">{article.title}</h2>
            <p className="text-sm text-[var(--foreground-muted)]">{article.duration}</p>
            <p className="text-sm leading-7 text-[var(--foreground-muted)]">{article.summary}</p>
            <Button variant="secondary">Open article</Button>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}