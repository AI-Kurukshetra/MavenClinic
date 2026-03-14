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

type ContentLibraryItem = {
  id: string;
  title: string;
  audience: string;
  status: string;
  updatedAt: string;
};

type SupportGroupItem = {
  id: string;
  name: string;
  moderator: string;
  members: number;
  status: string;
};

type ComplianceItem = {
  id: string;
  event: string;
  actor: string;
  timestamp: string;
  severity: string;
};

type Props = {
  providerManagement: ProviderManagementItem[];
  contentLibrary: ContentLibraryItem[];
  supportGroups: SupportGroupItem[];
  compliance: ComplianceItem[];
};

const tabs = [
  { id: "providers", label: "Provider Management" },
  { id: "content", label: "Content Library" },
  { id: "support", label: "Support Groups" },
  { id: "compliance", label: "Compliance" },
] as const;

export function ClinicDashboard({ providerManagement, contentLibrary, supportGroups, compliance }: Props) {
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
            <h2 className="text-2xl font-semibold">Provider Management</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">Review onboarding status, activate clinicians, and take suspension actions from one queue.</p>
          </div>
          <div className="space-y-3">
            {providerManagement.map((provider) => (
              <div key={provider.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-[var(--border)] p-4">
                <div>
                  <p className="font-semibold">{provider.name}</p>
                  <p className="text-sm text-[var(--foreground-muted)]">{provider.specialty} - Submitted {provider.submittedAt}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[var(--teal-700)]">{provider.status}</p>
                  <p className="mt-1 text-sm font-medium text-[var(--rose-700)]">{provider.action}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {activeTab === "content" ? (
        <Card className="space-y-4 p-6">
          <div>
            <h2 className="text-2xl font-semibold">Content Library</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">Publish educational content for patients, provider education, and moderated community spaces.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {contentLibrary.map((article) => (
              <div key={article.id} className="rounded-[24px] bg-[var(--slate-50)] p-5">
                <p className="text-sm uppercase tracking-[0.18em] text-[var(--teal-700)]">{article.status}</p>
                <h3 className="mt-3 text-xl font-semibold">{article.title}</h3>
                <p className="mt-3 text-sm text-[var(--foreground-muted)]">Audience: {article.audience}</p>
                <p className="mt-1 text-sm text-[var(--foreground-muted)]">Updated: {article.updatedAt}</p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {activeTab === "support" ? (
        <Card className="space-y-4 p-6">
          <div>
            <h2 className="text-2xl font-semibold">Support Groups</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">Monitor community health, assign moderators, and flag groups that need clinical supervision.</p>
          </div>
          <div className="space-y-3">
            {supportGroups.map((group) => (
              <div key={group.id} className="rounded-[24px] border border-[var(--border)] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{group.name}</p>
                    <p className="text-sm text-[var(--foreground-muted)]">Moderator: {group.moderator}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[var(--foreground-muted)]">{group.members} members</p>
                    <p className="mt-1 text-sm text-[var(--rose-700)]">{group.status}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {activeTab === "compliance" ? (
        <Card className="space-y-4 p-6">
          <div>
            <h2 className="text-2xl font-semibold">Compliance</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">Audit recent administrative actions across approvals, publishing, moderation, and escalations.</p>
          </div>
          <div className="space-y-3">
            {compliance.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-[var(--slate-50)] p-4">
                <div>
                  <p className="font-semibold">{item.event}</p>
                  <p className="text-sm text-[var(--foreground-muted)]">{item.actor} - {item.timestamp}</p>
                </div>
                <p className={`text-sm font-medium ${item.severity === "High" ? "text-[var(--rose-700)]" : item.severity === "Medium" ? "text-[var(--teal-700)]" : "text-[var(--foreground-muted)]"}`}>{item.severity}</p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}