"use client";

import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { reactivateProviderAction, suspendProviderAction } from "@/app/(clinic)/clinic/actions";
import type { ClinicConversationListItem, ClinicInvitationListItem, ClinicNotificationListItem, ClinicProviderListItem } from "@/lib/clinic-admin-data";
import { ClinicConversationsPanel } from "@/features/clinic/clinic-conversations-panel";
import { ClinicInvitationsPanel } from "@/features/clinic/clinic-invitations-panel";
import { ClinicNotificationsPanel } from "@/features/clinic/clinic-notifications-panel";
import { ClinicProvidersPanel } from "@/features/clinic/clinic-providers-panel";

export function ClinicDashboardTabs({ initialTab, providers, invitations, conversations, notifications, redirectTo }: {
  initialTab?: string;
  providers: ClinicProviderListItem[];
  invitations: ClinicInvitationListItem[];
  conversations: ClinicConversationListItem[];
  notifications: ClinicNotificationListItem[];
  redirectTo: string;
}) {
  const [activeTab, setActiveTab] = useState(initialTab === "invitations" || initialTab === "conversations" || initialTab === "notifications" ? initialTab : "providers");
  const tabs = [
    { id: "providers", label: "Providers" },
    { id: "invitations", label: "Invitations" },
    { id: "conversations", label: "Conversations" },
    { id: "notifications", label: "Notifications" },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={activeTab === tab.id ? "rounded-full bg-[var(--rose-500)] px-4 py-2 text-sm font-medium text-white" : "rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "providers" ? <ClinicProvidersPanel providers={providers} redirectTo={redirectTo} /> : null}
      {activeTab === "invitations" ? <ClinicInvitationsPanel invitations={invitations} redirectTo={redirectTo} /> : null}
      {activeTab === "conversations" ? <ClinicConversationsPanel conversations={conversations} /> : null}
      {activeTab === "notifications" ? <ClinicNotificationsPanel notifications={notifications} redirectTo={redirectTo} /> : null}
    </div>
  );
}

export function ClinicProviderDetailActions({ providerId, providerName, providerStatus, redirectTo }: { providerId: string; providerName: string; providerStatus: ClinicProviderListItem["status"]; redirectTo: string }) {
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap gap-3">
        {providerStatus === "Suspended" ? (
          <form action={reactivateProviderAction} onSubmit={(event) => { if (!window.confirm(`Reactivate ${providerName}?`)) event.preventDefault(); }}>
            <input type="hidden" name="providerId" value={providerId} />
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <button type="submit" className="inline-flex h-11 cursor-pointer items-center rounded-xl border border-[rgba(61,191,173,0.22)] px-5 text-sm font-medium text-[var(--teal-700)] transition hover:bg-[var(--teal-50)]">
              Reactivate provider
            </button>
          </form>
        ) : (
          <button type="button" onClick={() => setOpen(true)} className="inline-flex h-11 cursor-pointer items-center rounded-xl border border-[rgba(212,88,123,0.22)] px-5 text-sm font-medium text-[var(--rose-700)] transition hover:bg-rose-50">
            Suspend provider
          </button>
        )}
        <Link href={`/clinic/providers/${providerId}?panel=edit` as Route} className="inline-flex h-11 items-center rounded-xl border border-[var(--border)] px-5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
          Edit profile
        </Link>
        <Link href={`/clinic/providers/${providerId}?panel=appointments` as Route} className="inline-flex h-11 items-center rounded-xl border border-[var(--border)] px-5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
          View appointments
        </Link>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-[var(--rose-700)]">Provider access</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight">Suspend {providerName}</h3>
                <p className="mt-2 text-sm leading-7 text-[var(--foreground-muted)]">This immediately removes provider access across the platform.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-[var(--border)] px-3 py-1 text-sm text-slate-600 transition hover:bg-slate-50">
                Close
              </button>
            </div>
            <form action={suspendProviderAction} className="mt-6 space-y-4">
              <input type="hidden" name="providerId" value={providerId} />
              <input type="hidden" name="redirectTo" value={redirectTo} />
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                <span>Suspension reason</span>
                <textarea
                  name="suspendedReason"
                  required
                  minLength={5}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className="min-h-32 rounded-2xl border border-[var(--border)] px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--rose-300)] focus:ring-2 focus:ring-[rgba(232,125,155,0.22)]"
                  placeholder="Document the reason for this suspension."
                />
              </label>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setOpen(false)} className="inline-flex h-11 items-center rounded-xl border border-[var(--border)] px-5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" className="inline-flex h-11 items-center rounded-xl bg-[var(--rose-500)] px-5 text-sm font-medium text-white transition hover:bg-[var(--rose-600)]">
                  Confirm suspend
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function ClinicQuickLink({ href, label, detail }: { href: string; label: string; detail: string }) {
  return (
    <Link href={href as Route} className="flex items-center justify-between rounded-[24px] border border-[var(--border)] px-5 py-4 transition hover:bg-slate-50">
      <div>
        <p className="font-medium text-[var(--foreground)]">{label}</p>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">{detail}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-slate-400" />
    </Link>
  );
}
