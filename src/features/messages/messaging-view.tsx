"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatRelativeTime } from "@/lib/utils";
import type { MessageThread } from "@/types/domain";

type Props = {
  threads: MessageThread[];
  currentUserId: string;
};

type MessageInsertRow = {
  id: string;
  sender_id: string | null;
  content: string;
  created_at: string | null;
};

export function MessagingView({ threads: initialThreads, currentUserId }: Props) {
  const router = useRouter();
  const [threads, setThreads] = useState(initialThreads);
  const [activeId, setActiveId] = useState(initialThreads[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const activeThread = useMemo(() => threads.find((thread) => thread.id === activeId) ?? threads[0], [threads, activeId]);

  useEffect(() => {
    if (!activeThread?.id) {
      return;
    }

    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel(`messages-${activeThread.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeThread.id}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const row = payload.new as MessageInsertRow;
          const nextMessage: MessageThread["messages"][number] = {
            id: String(row.id),
            sender: row.sender_id === currentUserId ? "patient" : "provider",
            content: String(row.content),
            createdAt: String(row.created_at),
          };

          setThreads((current) =>
            current.map((thread) =>
              thread.id === activeThread.id
                ? {
                    ...thread,
                    lastMessagePreview: nextMessage.content,
                    updatedAt: nextMessage.createdAt,
                    messages: thread.messages.some((item) => item.id === nextMessage.id)
                      ? thread.messages
                      : [...thread.messages, nextMessage],
                  }
                : thread,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeThread?.id, currentUserId]);

  function sendMessage() {
    if (!activeThread?.id || !message.trim()) {
      return;
    }

    setError("");
    startTransition(async () => {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: activeThread.id, content: message.trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Unable to send message.");
        return;
      }

      setMessage("");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
      <Card className="space-y-4 p-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--teal-700)]">Secure messaging</p>
          <h2 className="mt-2 text-2xl font-semibold">Conversations</h2>
        </div>
        <div className="space-y-3">
          {threads.map((thread) => (
            <button key={thread.id} type="button" onClick={() => setActiveId(thread.id)} className={`w-full rounded-[24px] border p-4 text-left transition ${activeId === thread.id ? "border-transparent bg-[var(--rose-50)]" : "border-[var(--border)] bg-white"}`}>
              <div className="flex items-start gap-3">
                <Avatar src={thread.avatarUrl} name={thread.providerName} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate font-semibold">{thread.providerName}</p>
                    {thread.unreadCount > 0 ? <Badge variant="info">{thread.unreadCount}</Badge> : null}
                  </div>
                  <p className="text-sm text-[var(--foreground-muted)]">{thread.providerSpecialty}</p>
                  <p className="mt-2 truncate text-sm text-[var(--foreground-muted)]">{thread.lastMessagePreview}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </Card>

      <Card className="flex min-h-[640px] flex-col p-0">
        <div className="border-b border-[var(--border)] px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar src={activeThread?.avatarUrl} name={activeThread?.providerName ?? "Care team"} size="lg" />
              <div>
                <h2 className="text-2xl font-semibold">{activeThread?.providerName ?? "Care team"}</h2>
                <p className="text-sm text-[var(--foreground-muted)]">{activeThread?.providerSpecialty ?? "Secure messaging"}</p>
              </div>
            </div>
            <Badge variant="neutral">HIPAA-aware secure thread</Badge>
          </div>
        </div>
        <div className="flex-1 space-y-4 px-6 py-6">
          {activeThread?.messages.map((entry) => (
            <div key={entry.id} className={`flex ${entry.sender === "patient" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-[24px] px-4 py-3 ${entry.sender === "patient" ? "bg-[var(--rose-500)] text-white" : "bg-[var(--slate-50)] text-[var(--foreground)]"}`}>
                <p className="text-sm leading-7">{entry.content}</p>
                <p className={`mt-2 text-xs ${entry.sender === "patient" ? "text-white/75" : "text-[var(--foreground-muted)]"}`}>{formatRelativeTime(entry.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-[var(--border)] px-6 py-5">
          <div className="rounded-[28px] border border-[var(--border)] bg-[var(--slate-50)] p-3">
            <textarea value={message} onChange={(event) => setMessage(event.target.value)} className="min-h-20 w-full resize-none bg-transparent px-2 py-1" placeholder="Write a secure message or upload a lab result note." />
            {error ? <div className="px-2 text-sm text-[var(--rose-700)]">{error}</div> : null}
            <div className="mt-3 flex justify-end gap-3">
              <Button variant="secondary">Attach file</Button>
              <Button onClick={sendMessage} disabled={isPending || !message.trim()}>{isPending ? "Sending..." : "Send"}</Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
