import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { EducationArticle } from "@/lib/education";
import { getEducationBadgeClass } from "@/lib/education";

function renderMarkdown(content: string) {
  const blocks = content.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);

  return blocks.map((block, index) => {
    if (block.startsWith("### ")) {
      return <h3 key={index} className="mt-8 text-2xl font-semibold tracking-tight text-[var(--foreground)]">{block.replace(/^###\s+/, "")}</h3>;
    }

    if (block.startsWith("## ")) {
      return <h2 key={index} className="mt-10 text-3xl font-semibold tracking-tight text-[var(--foreground)]">{block.replace(/^##\s+/, "")}</h2>;
    }

    if (block.startsWith("# ")) {
      return <h1 key={index} className="mt-10 text-4xl font-semibold tracking-tight text-[var(--foreground)]">{block.replace(/^#\s+/, "")}</h1>;
    }

    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    if (lines.every((line) => line.startsWith("- "))) {
      return (
        <ul key={index} className="mt-6 list-disc space-y-2 pl-6 text-base leading-8 text-[var(--foreground-muted)]">
          {lines.map((line) => (
            <li key={line}>{line.replace(/^-\s+/, "")}</li>
          ))}
        </ul>
      );
    }

    return <p key={index} className="mt-6 whitespace-pre-wrap text-base leading-8 text-[var(--foreground-muted)]">{block}</p>;
  });
}

export function EducationArticleDetail({ article, relatedArticles }: { article: EducationArticle; relatedArticles: EducationArticle[] }) {
  return (
    <div className="space-y-6">
      <Link href="/education" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" />
        Back to education
      </Link>

      <Card className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getEducationBadgeClass(article.category)}`}>
            {article.categoryLabel}
          </span>
          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
            {article.lifeStage}
          </span>
          <span className="text-sm text-[var(--foreground-muted)]">{article.formattedDate}</span>
        </div>
        <div className="space-y-4">
          <h1 className="font-[family:var(--font-playfair)] text-4xl font-semibold tracking-tight text-[var(--foreground)] lg:text-5xl">
            {article.title}
          </h1>
        </div>
        <div className="border-t border-[var(--border)] pt-2">
          {renderMarkdown(article.content || "Our clinical team is curating this article right now.")}
        </div>
        <div className="border-t border-[var(--border)] pt-6">
          <Link
            href={`/messages?topic=${encodeURIComponent(article.title)}`}
            className="inline-flex items-center rounded-full bg-[var(--rose-500)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[var(--rose-600)]"
          >
            Ask your provider about this topic
          </Link>
        </div>
      </Card>

      <Card className="space-y-5">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-[var(--rose-700)]">Related reading</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">More in {article.categoryLabel}</h2>
        </div>
        {relatedArticles.length ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {relatedArticles.map((related) => (
              <Link key={related.id} href={`/education/${related.id}`} className="rounded-[24px] border border-[var(--border)] px-5 py-5 transition hover:bg-slate-50">
                <div className="flex h-full flex-col gap-3">
                  <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-medium ${getEducationBadgeClass(related.category)}`}>
                    {related.categoryLabel}
                  </span>
                  <h3 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">{related.title}</h3>
                  <p className="text-sm leading-7 text-[var(--foreground-muted)]">{related.preview}</p>
                  <span className="mt-auto inline-flex items-center gap-2 text-sm font-medium text-[var(--rose-600)]">
                    Open article
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm leading-7 text-[var(--foreground-muted)]">More resources in this category are coming soon.</p>
        )}
      </Card>
    </div>
  );
}
