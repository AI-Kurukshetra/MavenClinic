"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";

type ProviderManagementItem = {
  id: string;
  name: string;
  specialty: string;
  status: string;
  submittedAt: string;
  action: string;
};

type InvitationQueueItem = {
  id: string;
  email: string;
  status: string;
  createdAt: string;
  expiresAt: string;
};

type ConversationLoadItem = {
  id: string;
  providerName: string;
  openThreads: number;
  unreadMessages: number;
  lastActivity: string;
};

type NotificationItem = {
  id: string;
  event: string;
  actor: string;
  timestamp: string;
  severity: string;
};

type Props = {
  providerManagement: ProviderManagementItem[];
  invitationQueue: InvitationQueueItem[];
  conversationLoad: ConversationLoadItem[];
  notifications: NotificationItem[];
};

const tabs = [
  { id: "providers", label: "Providers" },
  { id: "invites", label: "Invitations" },
  { id: "conversations", label: "Conversations" },
  { id: "notifications", label: "Notifications" },
] as const;

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-[24px] border border-dashed border-[var(--border)] bg-[var(--slate-50)] px-6 py-10 text-center text-sm leading-6 text-[var(--foreground-muted)]">
      {message}
    </div>
  );
}

export function ClinicDashboard({ providerManagement, invitationQueue, conversationLoad, notifications }: Props) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("providers");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${activeTab === tab.id ? "bg-[var(--rose-500)] text-white" : "border border-[var(--border)] bg-white text-[var(--foreground-muted)] hover:bg-[var(--slate-50)] hover:text-[var(--foreground)]"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "providers" ? (
        <Card className="space-y-4 p-6">
          <div>
            <h2 className="text-2xl font-semibold">Provider roster</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">Review live provider records, availability posture, and current panel status from one queue.</p>
          </div>
          {providerManagement.length ? (
            <div className="space-y-3">
              {providerManagement.map((provider) => (
                <div key={provider.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-[var(--border)] p-4">
                  <div>
                    <p className="font-semibold">{provider.name}</p>
                    <p className="text-sm text-[var(--foreground-muted)]">{provider.specialty} Â· Added {provider.submittedAt}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[var(--teal-700)]">{provider.status}</p>
                    <p className="mt-1 text-sm font-medium text-[var(--rose-700)]">{provider.action}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="Provider records will appear here once clinicians are added to the platform." />
          )}
        </Card>
      ) : null}

      {activeTab === "invites" ? (
        <Card className="space-y-4 p-6">
          <div>
            <h2 className="text-2xl font-semibold">Invitation queue</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">Track provider invite status, expiration windows, and onboarding throughput.</p>
          </div>
          {invitationQueue.length ? (
            <div className="space-y-3">
              {invitationQueue.map((invitation) => (
                <div key={invitation.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-[var(--slate-50)] p-4">
                  <div>
                    <p className="font-semibold">{invitation.email}</p>
                    <p className="text-sm text-[var(--foreground-muted)]">Created {invitation.createdAt}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[var(--teal-700)]">{invitation.status}</p>
                    <p className="mt-1 text-sm text-[var(--foreground-muted)]">Expires {invitation.expiresAt}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="Provider invitations will appear here after clinic admins start sending onboarding links." />
          )}
        </Card>
      ) : null}

      {activeTab === "conversations" ? (
        <Card className="space-y-4 p-6">
          <div>
            <h2 className="text-2xl font-semibold">Conversation load</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">Monitor which provider queues are carrying the most open threads and unread patient messages.</p>
          </div>
          {conversationLoad.length ? (
            <div className="space-y-3">
              {conversationLoad.map((item) => (
                <div key={item.id} className="rounded-[24px] border border-[var(--border)] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{item.providerName}</p>
                      <p className="text-sm text-[var(--foreground-muted)]">Last activity {item.lastActivity}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-[var(--foreground-muted)]">{item.openThreads} open threads</p>
                      <p className="mt-1 text-[var(--rose-700)]">{item.unreadMessages} unread patient messages</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="Conversation load will appear here once patients begin messaging providers." />
          )}
        </Card>
      ) : null}

      {activeTab === "notifications" ? (
        <Card className="space-y-4 p-6">
          <div>
            <h2 className="text-2xl font-semibold">Recent notifications</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">Audit recent operational events across appointments, invites, and system activity.</p>
          </div>
          {notifications.length ? (
            <div className="space-y-3">
              {notifications.map((item) => (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-[var(--slate-50)] p-4">
                  <div>
                    <p className="font-semibold">{item.event}</p>
                    <p className="text-sm text-[var(--foreground-muted)]">{item.actor} Â· {item.timestamp}</p>
                  </div>
                  <p className={`text-sm font-medium ${item.severity === "High" ? "text-[var(--rose-700)]" : item.severity === "Medium" ? "text-[var(--teal-700)]" : "text-[var(--foreground-muted)]"}`}>{item.severity}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="Recent notification events will appear here once operational workflows start generating them." />
          )}
        </Card>
      ) : null}
    </div>
  );
}
