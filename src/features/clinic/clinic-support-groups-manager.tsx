"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { createSupportGroupAction, toggleSupportGroupAction } from "@/app/(clinic)/clinic/actions";
import type { ClinicSupportGroupItem } from "@/lib/clinic-admin-data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ClinicEmptyState, ClinicSubmitButton } from "@/features/clinic/clinic-ui";

export function ClinicSupportGroupsManager({ groups, moderators, redirectTo }: { groups: ClinicSupportGroupItem[]; moderators: Array<{ id: string; name: string }>; redirectTo: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-[var(--rose-700)]">Support groups</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Support groups management</h2>
        </div>
        <Button type="button" className="h-11 rounded-xl px-5" onClick={() => setIsOpen(true)}>
          <Users className="mr-2 h-4 w-4" />
          New group
        </Button>
      </div>

      {groups.length ? (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border)] text-left text-sm">
            <thead className="bg-[var(--slate-50)] text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">
              <tr>
                <th className="px-4 py-4 font-medium">Name</th>
                <th className="px-4 py-4 font-medium">Category</th>
                <th className="px-4 py-4 font-medium">Members</th>
                <th className="px-4 py-4 font-medium">Moderator</th>
                <th className="px-4 py-4 font-medium">Status</th>
                <th className="px-4 py-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {groups.map((group) => (
                <tr key={group.id}>
                  <td className="px-4 py-4 font-medium">{group.name}</td>
                  <td className="px-4 py-4 text-[var(--foreground-muted)]">{group.category}</td>
                  <td className="px-4 py-4 text-[var(--foreground-muted)]">{group.members}</td>
                  <td className="px-4 py-4 text-[var(--foreground-muted)]">{group.moderator}</td>
                  <td className="px-4 py-4">{group.active ? "Active" : "Inactive"}</td>
                  <td className="px-4 py-4">
                    <form action={toggleSupportGroupAction}>
                      <input type="hidden" name="id" value={group.id} />
                      <input type="hidden" name="active" value={group.active ? "false" : "true"} />
                      <input type="hidden" name="redirectTo" value={redirectTo} />
                      <button type="submit" className="inline-flex h-10 items-center rounded-xl border border-[var(--border)] px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
                        {group.active ? "Deactivate" : "Activate"}
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
          <ClinicEmptyState title="No support groups yet" body="Create a support group to organize community programming." />
        </div>
      )}

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.42)] px-4">
          <Card className="w-full max-w-lg p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-[var(--rose-700)]">New support group</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight">Create a moderated group</h3>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} className="rounded-full p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700">×</button>
            </div>
            <form action={createSupportGroupAction} className="mt-6 space-y-4">
              <input type="hidden" name="redirectTo" value={redirectTo} />
              <label className="block space-y-2 text-sm font-medium text-[var(--foreground)]">
                <span>Name</span>
                <input name="name" required className="h-12 w-full rounded-xl border border-[var(--border)] px-4 outline-none focus:border-[var(--rose-300)] focus:ring-2 focus:ring-[rgba(232,125,155,0.2)]" />
              </label>
              <label className="block space-y-2 text-sm font-medium text-[var(--foreground)]">
                <span>Description</span>
                <textarea name="description" rows={4} required className="w-full rounded-xl border border-[var(--border)] px-4 py-3 outline-none focus:border-[var(--rose-300)] focus:ring-2 focus:ring-[rgba(232,125,155,0.2)]" />
              </label>
              <label className="block space-y-2 text-sm font-medium text-[var(--foreground)]">
                <span>Category</span>
                <input name="category" required className="h-12 w-full rounded-xl border border-[var(--border)] px-4 outline-none focus:border-[var(--rose-300)] focus:ring-2 focus:ring-[rgba(232,125,155,0.2)]" />
              </label>
              <label className="block space-y-2 text-sm font-medium text-[var(--foreground)]">
                <span>Assign moderator</span>
                <select name="moderatorId" className="h-12 w-full rounded-xl border border-[var(--border)] px-4 outline-none focus:border-[var(--rose-300)] focus:ring-2 focus:ring-[rgba(232,125,155,0.2)]">
                  <option value="">Unassigned</option>
                  {moderators.map((moderator) => <option key={moderator.id} value={moderator.id}>{moderator.name}</option>)}
                </select>
              </label>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="secondary" className="h-10 rounded-xl px-4" onClick={() => setIsOpen(false)}>Cancel</Button>
                <ClinicSubmitButton label="Save group" pendingLabel="Saving..." />
              </div>
            </form>
          </Card>
        </div>
      ) : null}
    </Card>
  );
}
