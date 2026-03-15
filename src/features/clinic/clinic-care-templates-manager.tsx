"use client";

import { useState } from "react";
import { createCareTemplateAction } from "@/app/(clinic)/clinic/actions";
import type { ClinicCareTemplateItem } from "@/lib/clinic-admin-data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ClinicEmptyState, ClinicSubmitButton } from "@/features/clinic/clinic-ui";

export function ClinicCareTemplatesManager({ templates, redirectTo }: { templates: ClinicCareTemplateItem[]; redirectTo: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [milestones, setMilestones] = useState([{ title: "", description: "" }]);

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-[var(--rose-700)]">Care templates</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Reusable care plan templates</h2>
        </div>
        <Button type="button" className="h-11 rounded-xl px-5" onClick={() => setIsOpen(true)}>
          New template
        </Button>
      </div>

      {templates.length ? (
        <div className="mt-6 space-y-3">
          {templates.map((template) => (
            <div key={template.id} className="rounded-[24px] border border-[var(--border)] px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-[var(--foreground)]">{template.name}</p>
                  <p className="mt-1 text-sm text-[var(--foreground-muted)]">{template.specialty}</p>
                  <p className="mt-2 text-sm leading-7 text-[var(--foreground-muted)]">{template.description}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="text-[var(--foreground-muted)]">{template.milestoneCount} milestones</p>
                  <p className="mt-1 font-medium text-[var(--rose-700)]">Used {template.usageCount} times</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <ClinicEmptyState title="No care templates yet" body="Create a reusable template to speed up provider care planning." />
        </div>
      )}

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.42)] px-4">
          <Card className="w-full max-w-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-[var(--rose-700)]">New care template</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight">Build a reusable care journey</h3>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} className="rounded-full p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700">×</button>
            </div>
            <form action={createCareTemplateAction} className="mt-6 space-y-4">
              <input type="hidden" name="redirectTo" value={redirectTo} />
              <input type="hidden" name="milestones" value={JSON.stringify(milestones)} />
              <label className="block space-y-2 text-sm font-medium text-[var(--foreground)]">
                <span>Template name</span>
                <input name="name" required className="h-12 w-full rounded-xl border border-[var(--border)] px-4 outline-none focus:border-[var(--rose-300)] focus:ring-2 focus:ring-[rgba(232,125,155,0.2)]" />
              </label>
              <label className="block space-y-2 text-sm font-medium text-[var(--foreground)]">
                <span>Specialty</span>
                <input name="specialty" required className="h-12 w-full rounded-xl border border-[var(--border)] px-4 outline-none focus:border-[var(--rose-300)] focus:ring-2 focus:ring-[rgba(232,125,155,0.2)]" />
              </label>
              <label className="block space-y-2 text-sm font-medium text-[var(--foreground)]">
                <span>Description</span>
                <textarea name="description" rows={4} required className="w-full rounded-xl border border-[var(--border)] px-4 py-3 outline-none focus:border-[var(--rose-300)] focus:ring-2 focus:ring-[rgba(232,125,155,0.2)]" />
              </label>
              <div className="space-y-3">
                <p className="text-sm font-medium text-[var(--foreground)]">Milestones</p>
                {milestones.map((milestone, index) => (
                  <div key={`${index}-${milestone.title}`} className="rounded-2xl border border-[var(--border)] p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        value={milestone.title}
                        onChange={(event) => setMilestones((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item))}
                        placeholder="Milestone title"
                        className="h-11 rounded-xl border border-[var(--border)] px-4 outline-none focus:border-[var(--rose-300)] focus:ring-2 focus:ring-[rgba(232,125,155,0.2)]"
                      />
                      <input
                        value={milestone.description}
                        onChange={(event) => setMilestones((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, description: event.target.value } : item))}
                        placeholder="Milestone description"
                        className="h-11 rounded-xl border border-[var(--border)] px-4 outline-none focus:border-[var(--rose-300)] focus:ring-2 focus:ring-[rgba(232,125,155,0.2)]"
                      />
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Button type="button" variant="ghost" size="sm" className="rounded-xl" onClick={() => setMilestones((current) => current.length === 1 ? current : current.filter((_, itemIndex) => itemIndex !== index))}>
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="secondary" className="h-10 rounded-xl px-4" onClick={() => setMilestones((current) => [...current, { title: "", description: "" }])}>Add milestone</Button>
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="secondary" className="h-10 rounded-xl px-4" onClick={() => setIsOpen(false)}>Cancel</Button>
                <ClinicSubmitButton label="Save template" pendingLabel="Saving..." />
              </div>
            </form>
          </Card>
        </div>
      ) : null}
    </Card>
  );
}
