"use client";

import { useState } from "react";
import { MailPlus } from "lucide-react";
import { createClinicInvitationAction } from "@/app/(clinic)/clinic/actions";
import type { ClinicInvitationListItem } from "@/lib/clinic-admin-data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ClinicEmptyState, ClinicSubmitButton, InvitationStatusBadge } from "@/features/clinic/clinic-ui";

export function ClinicInvitationsPanel({ invitations, redirectTo }: { invitations: ClinicInvitationListItem[]; redirectTo: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-[var(--rose-700)]">Invitations</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Invitation queue</h2>
        </div>
        <Button type="button" className="h-11 rounded-xl px-5" onClick={() => setIsModalOpen(true)}>
          <MailPlus className="mr-2 h-4 w-4" />
          Send new invitation
        </Button>
      </div>

      {invitations.length ? (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border)] text-left text-sm">
            <thead className="bg-[var(--slate-50)] text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">
              <tr>
                <th className="px-4 py-4 font-medium">Email</th>
                <th className="px-4 py-4 font-medium">Role</th>
                <th className="px-4 py-4 font-medium">Invited by</th>
                <th className="px-4 py-4 font-medium">Sent date</th>
                <th className="px-4 py-4 font-medium">Expires</th>
                <th className="px-4 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {invitations.map((invitation) => (
                <tr key={invitation.id}>
                  <td className="px-4 py-4 font-medium">{invitation.email}</td>
                  <td className="px-4 py-4 text-[var(--foreground-muted)]">{invitation.role}</td>
                  <td className="px-4 py-4 text-[var(--foreground-muted)]">{invitation.invitedBy}</td>
                  <td className="px-4 py-4 text-[var(--foreground-muted)]">{invitation.sentDate}</td>
                  <td className="px-4 py-4 text-[var(--foreground-muted)]">{invitation.expiresDate}</td>
                  <td className="px-4 py-4"><InvitationStatusBadge status={invitation.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6">
          <ClinicEmptyState title="No invitations yet" body="Send onboarding invites to providers or administrators from this workspace." />
        </div>
      )}

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.42)] px-4">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-[var(--rose-700)]">New invitation</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight">Send an admin or provider invite</h3>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-full p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700">×</button>
            </div>
            <form action={createClinicInvitationAction} className="mt-6 space-y-4">
              <input type="hidden" name="redirectTo" value={redirectTo} />
              <label className="block space-y-2 text-sm font-medium text-[var(--foreground)]">
                <span>Email</span>
                <input name="email" type="email" required className="h-12 w-full rounded-xl border border-[var(--border)] px-4 outline-none focus:border-[var(--rose-300)] focus:ring-2 focus:ring-[rgba(232,125,155,0.2)]" />
              </label>
              <label className="block space-y-2 text-sm font-medium text-[var(--foreground)]">
                <span>Role</span>
                <select name="role" className="h-12 w-full rounded-xl border border-[var(--border)] px-4 outline-none focus:border-[var(--rose-300)] focus:ring-2 focus:ring-[rgba(232,125,155,0.2)]">
                  <option value="provider">Provider</option>
                  <option value="employer_admin">Employer admin</option>
                  <option value="clinic_admin">Clinic admin</option>
                </select>
              </label>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="secondary" className="h-10 rounded-xl px-4" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <ClinicSubmitButton label="Send invitation" pendingLabel="Sending..." />
              </div>
            </form>
          </Card>
        </div>
      ) : null}
    </Card>
  );
}
