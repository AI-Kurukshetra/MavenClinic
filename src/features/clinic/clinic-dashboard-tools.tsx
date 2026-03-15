"use client";

import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { suspendProviderAction } from "@/app/(clinic)/clinic/actions";
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

export function ClinicProviderDetailActions({ providerId, redirectTo }: { providerId: string; redirectTo: string }) {
  return (
    <div className="flex flex-wrap gap-3">
      <form action={suspendProviderAction} onSubmit={(event) => { if (!window.confirm("Suspend this provider?")) event.preventDefault(); }}>
        <input type="hidden" name="providerId" value={providerId} />
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <button type="submit" className="inline-flex h-11 cursor-pointer items-center rounded-xl border border-[rgba(212,88,123,0.22)] px-5 text-sm font-medium text-[var(--rose-700)] transition hover:bg-rose-50">
          Suspend provider
        </button>
      </form>
      <Link href={`/clinic/providers/${providerId}?panel=edit` as Route} className="inline-flex h-11 items-center rounded-xl border border-[var(--border)] px-5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
        Edit profile
      </Link>
      <Link href={`/clinic/providers/${providerId}?panel=appointments` as Route} className="inline-flex h-11 items-center rounded-xl border border-[var(--border)] px-5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
        View appointments
      </Link>
    </div>
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
