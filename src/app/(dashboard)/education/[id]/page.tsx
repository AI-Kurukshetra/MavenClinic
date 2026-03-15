import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { EducationArticleDetail } from "@/features/education/education-article-detail";
import { getEducationArticleData } from "@/lib/data";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const data = await getEducationArticleData(id);

  if (!data) {
    return {
      title: "Education Library - Maven Clinic",
    };
  }

  return {
    title: `${data.article.title} - Maven Clinic`,
  };
}

export const revalidate = 3600;

export default async function EducationArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getEducationArticleData(id);

  if (!data) {
    notFound();
  }

  return (
    <DashboardShell title="Education article" eyebrow="Clinical guidance you can revisit anytime">
      <EducationArticleDetail article={data.article} relatedArticles={data.relatedArticles} />
    </DashboardShell>
  );
}
