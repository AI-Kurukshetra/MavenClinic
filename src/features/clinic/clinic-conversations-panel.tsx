"use client";

import { useMemo, useState } from "react";
import type { ClinicConversationListItem } from "@/lib/clinic-admin-data";
import { Card } from "@/components/ui/card";
import { ClinicEmptyState, SearchInput } from "@/features/clinic/clinic-ui";

export function ClinicConversationsPanel({ conversations }: { conversations: ClinicConversationListItem[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return conversations.filter((item) => !normalized || item.patientName.toLowerCase().includes(normalized) || item.providerName.toLowerCase().includes(normalized));
  }, [conversations, query]);

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-[var(--rose-700)]">Conversations</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Conversation audit</h2>
          <p className="mt-2 text-sm leading-7 text-[var(--foreground-muted)]">Clinic admins can review active conversations in read-only mode.</p>
        </div>
        <SearchInput value={query} onChange={setQuery} placeholder="Search by patient or provider" />
      </div>

      {filtered.length ? (
        <div className="mt-6 space-y-3">
          {filtered.map((conversation) => (
            <div key={conversation.id} className="rounded-[24px] border border-[var(--border)] px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-[var(--foreground)]">{conversation.patientName}</p>
                  <p className="mt-1 text-sm text-[var(--foreground-muted)]">Provider: {conversation.providerName}</p>
                  <p className="mt-2 text-sm leading-7 text-[var(--foreground-muted)]">{conversation.lastMessagePreview}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="text-[var(--foreground-muted)]">{conversation.lastMessageTime}</p>
                  <p className="mt-1 font-medium text-[var(--rose-700)]">{conversation.messageCount} messages</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <ClinicEmptyState title="No conversations found" body="There are no conversations matching the current search." />
        </div>
      )}
    </Card>
  );
}
