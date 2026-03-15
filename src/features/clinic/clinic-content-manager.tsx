"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { createEducationalContentAction, toggleEducationalContentPublishAction } from "@/app/(clinic)/clinic/actions";
import type { ClinicContentItem } from "@/lib/clinic-admin-data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ClinicEmptyState, ClinicSubmitButton } from "@/features/clinic/clinic-ui";

export function ClinicContentManager({ articles, redirectTo }: { articles: ClinicContentItem[]; redirectTo: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-[var(--rose-700)]">Content</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Educational content CMS</h2>
        </div>
        <Button type="button" className="h-11 rounded-xl px-5" onClick={() => setIsOpen(true)}>
          <FileText className="mr-2 h-4 w-4" />
          New article
        </Button>
      </div>

      {articles.length ? (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border)] text-left text-sm">
            <thead className="bg-[var(--slate-50)] text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">
              <tr>
                <th className="px-4 py-4 font-medium">Title</th>
                <th className="px-4 py-4 font-medium">Category</th>
                <th className="px-4 py-4 font-medium">Life stage</th>
                <th className="px-4 py-4 font-medium">Status</th>
                <th className="px-4 py-4 font-medium">Author</th>
                <th className="px-4 py-4 font-medium">Date</th>
                <th className="px-4 py-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {articles.map((article) => (
                <tr key={article.id}>
                  <td className="px-4 py-4 font-medium">{article.title}</td>
                  <td className="px-4 py-4 text-[var(--foreground-muted)]">{article.category}</td>
                  <td className="px-4 py-4 text-[var(--foreground-muted)]">{article.lifeStage}</td>
                  <td className="px-4 py-4">{article.published ? "Published" : "Draft"}</td>
                  <td className="px-4 py-4 text-[var(--foreground-muted)]">{article.author}</td>
                  <td className="px-4 py-4 text-[var(--foreground-muted)]">{article.date}</td>
                  <td className="px-4 py-4">
                    <form action={toggleEducationalContentPublishAction}>
                      <input type="hidden" name="id" value={article.id} />
                      <input type="hidden" name="published" value={article.published ? "false" : "true"} />
                      <input type="hidden" name="redirectTo" value={redirectTo} />
                      <button type="submit" className="inline-flex h-10 items-center rounded-xl border border-[var(--border)] px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
                        {article.published ? "Unpublish" : "Publish"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6">
          <ClinicEmptyState title="No content yet" body="Create your first educational article for the clinic content library." />
        </div>
      )}

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.42)] px-4">
          <Card className="w-full max-w-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-[var(--rose-700)]">New article</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight">Publish clinic education content</h3>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} className="rounded-full p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700">×</button>
            </div>
            <form action={createEducationalContentAction} className="mt-6 space-y-4">
              <input type="hidden" name="redirectTo" value={redirectTo} />
              <label className="block space-y-2 text-sm font-medium text-[var(--foreground)]">
                <span>Title</span>
                <input name="title" required className="h-12 w-full rounded-xl border border-[var(--border)] px-4 outline-none focus:border-[var(--rose-300)] focus:ring-2 focus:ring-[rgba(232,125,155,0.2)]" />
              </label>
              <label className="block space-y-2 text-sm font-medium text-[var(--foreground)]">
                <span>Content</span>
                <textarea name="content" rows={6} required className="w-full rounded-xl border border-[var(--border)] px-4 py-3 outline-none focus:border-[var(--rose-300)] focus:ring-2 focus:ring-[rgba(232,125,155,0.2)]" />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-2 text-sm font-medium text-[var(--foreground)]">
                  <span>Category</span>
                  <input name="category" required className="h-12 w-full rounded-xl border border-[var(--border)] px-4 outline-none focus:border-[var(--rose-300)] focus:ring-2 focus:ring-[rgba(232,125,155,0.2)]" />
                </label>
                <label className="block space-y-2 text-sm font-medium text-[var(--foreground)]">
                  <span>Life stage</span>
                  <input name="lifeStage" required className="h-12 w-full rounded-xl border border-[var(--border)] px-4 outline-none focus:border-[var(--rose-300)] focus:ring-2 focus:ring-[rgba(232,125,155,0.2)]" />
                </label>
              </div>
              <label className="flex items-center gap-3 text-sm font-medium text-[var(--foreground)]">
                <input type="checkbox" name="published" value="true" className="h-4 w-4 rounded border-[var(--border)]" />
                Publish immediately
              </label>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="secondary" className="h-10 rounded-xl px-4" onClick={() => setIsOpen(false)}>Cancel</Button>
                <ClinicSubmitButton label="Save article" pendingLabel="Saving..." />
              </div>
            </form>
          </Card>
        </div>
      ) : null}
    </Card>
  );
}
