"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { EducationArticle } from "@/lib/education";
import { educationCategories, getEducationBadgeClass } from "@/lib/education";

export function EducationLibrary({ articles }: { articles: EducationArticle[] }) {
  const [selectedCategory, setSelectedCategory] = useState<(typeof educationCategories)[number]["key"]>("all");

  const filteredArticles = useMemo(() => {
    if (selectedCategory === "all") {
      return articles;
    }

    return articles.filter((article) => article.category === selectedCategory);
  }, [articles, selectedCategory]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        {educationCategories.map((category) => {
          const active = selectedCategory === category.key;
          return (
            <button
              key={category.key}
              type="button"
              onClick={() => setSelectedCategory(category.key)}
              className={active
                ? "rounded-full bg-[var(--rose-500)] px-4 py-2 text-sm font-medium text-white"
                : "rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              }
            >
              {category.label}
            </button>
          );
        })}
      </div>

      {filteredArticles.length ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {filteredArticles.map((article) => (
            <Link key={article.id} href={`/education/${article.id}`} className="block">
              <Card className="flex h-full cursor-pointer flex-col gap-4 transition hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(25,22,17,0.08)]">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getEducationBadgeClass(article.category)}`}>
                      {article.categoryLabel}
                    </span>
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">{article.formattedDate}</p>
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">{article.title}</h2>
                  <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                    {article.lifeStage}
                  </span>
                  <p className="text-sm leading-7 text-[var(--foreground-muted)]">{article.preview}</p>
                </div>
                <div className="mt-auto inline-flex items-center gap-2 text-sm font-medium text-[var(--rose-600)]">
                  Read article
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="border-dashed text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--slate-50)] text-[var(--teal-700)]">
            <BookOpen className="h-8 w-8" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold tracking-tight">Content coming soon</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--foreground-muted)]">
            Our clinical team is curating health resources for you. Check back soon.
          </p>
        </Card>
      )}
    </div>
  );
}

