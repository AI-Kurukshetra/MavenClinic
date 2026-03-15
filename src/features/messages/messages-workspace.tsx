"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import Link from "next/link";
import { format, isSameDay, isToday } from "date-fns";
import {
  ArrowLeft,
  CalendarPlus,
  LoaderCircle,
  MessageSquarePlus,
  Paperclip,
  SendHorizontal,
  ShieldCheck,
  X,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Toast } from "@/components/ui/Toast";
import { MESSAGE_ATTACHMENT_BUCKET, type ConversationCandidate, type ConversationListItem, type ConversationMessage, type ConversationThread, type MessagingPageData, type MessagingRole } from "@/lib/messaging-shared";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type ToastState = {
  message: string;
  variant: "success" | "error" | "info";
};

type AttachmentState = {
  path: string;
  name: string;
};

type Props = MessagingPageData & { initialComposerValue?: string };

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  content: string;
  created_at: string | null;
  read_at: string | null;
  attachment_path: string | null;
  attachment_name: string | null;
};

function sortConversations(items: ConversationListItem[]) {
  return [...items].sort((left, right) => new Date(right.lastMessageAt).getTime() - new Date(left.lastMessageAt).getTime());
}

function formatConversationTimestamp(value: string) {
  const date = new Date(value);
  return isToday(date) ? format(date, "h:mm a") : format(date, "MMM d");
}

function formatMessageTimestamp(value: string) {
  return format(new Date(value), "h:mm a");
}

function formatMessageDay(value: string) {
  return format(new Date(value), "EEEE, MMM d");
}

function buildPreview(message: ConversationMessage) {
  if (message.attachmentName && !message.content.trim()) {
    return `Attachment: ${message.attachmentName}`;
  }

  if (message.attachmentName && message.content.trim()) {
    return `${message.content} (${message.attachmentName})`;
  }

  return message.content;
}

function ThreadSkeleton() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-[var(--border)] px-4 py-4 sm:px-6">
        <div className="flex animate-pulse items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-[var(--slate-100)]" />
          <div className="space-y-2">
            <div className="h-4 w-32 rounded-full bg-[var(--slate-100)]" />
            <div className="h-3 w-20 rounded-full bg-[var(--slate-100)]" />
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-4 px-4 py-6 sm:px-6">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className={cn("flex animate-pulse", index % 2 === 0 ? "justify-start" : "justify-end")}>
            <div className="max-w-[80%] space-y-2">
              <div className="h-12 rounded-[24px] bg-[var(--slate-100)]" />
              <div className="h-3 w-20 rounded-full bg-[var(--slate-100)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConversationListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex animate-pulse items-center gap-3 rounded-[24px] border border-[var(--border)] bg-white p-4">
          <div className="h-12 w-12 rounded-full bg-[var(--slate-100)]" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-32 rounded-full bg-[var(--slate-100)]" />
            <div className="h-3 w-20 rounded-full bg-[var(--slate-100)]" />
            <div className="h-3 w-full rounded-full bg-[var(--slate-100)]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyThreadState({ role }: { role: MessagingRole }) {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="max-w-sm space-y-3 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--slate-50)] text-[var(--teal-700)]">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-semibold">Start the conversation</h2>
        <p className="text-sm leading-6 text-[var(--foreground-muted)]">
          {role === "patient"
            ? "Choose a provider to ask a question, share an update, or follow up after a visit."
            : "Choose a patient to start a secure follow-up thread and keep clinical communication in one place."}
        </p>
      </div>
    </div>
  );
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export function MessagesWorkspace({ currentUserId, role, conversations: initialConversations, initialConversationId, initialThread, candidates, storageBucket, initialComposerValue }: Props) {
  const supabase = getSupabaseBrowserClient();
  const [conversations, setConversations] = useState(() => sortConversations(initialConversations));
  const [activeConversationId, setActiveConversationId] = useState<string | null>(initialConversationId);
  const [threadCache, setThreadCache] = useState<Record<string, ConversationThread>>(() =>
    initialThread ? { [initialThread.id]: initialThread } : {},
  );
  const [threadLoading, setThreadLoading] = useState(false);
  const [composerValue, setComposerValue] = useState(initialComposerValue ?? "");
  const [pendingAttachment, setPendingAttachment] = useState<AttachmentState | null>(null);
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isComposerBusy, startComposerTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreatingConversation, startConversationTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileThreadOpen, setMobileThreadOpen] = useState(Boolean(initialConversationId));
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeThread = activeConversationId ? threadCache[activeConversationId] ?? null : null;
  const conversationIds = useMemo(() => conversations.map((conversation) => conversation.id), [conversations]);
  const filteredCandidates = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();
    if (!needle) {
      return candidates;
    }

    return candidates.filter((candidate) => {
      const haystacks = [candidate.name, candidate.specialtyLabel ?? "", candidate.languages.join(" ")];
      return haystacks.some((value) => value.toLowerCase().includes(needle));
    });
  }, [candidates, searchQuery]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activeThread?.messages.length, activeConversationId]);

  useEffect(() => {
    const channel = supabase
      .channel(`conversation-list-${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const row = payload.new as MessageRow;
          const conversationId = String(row.conversation_id);
          if (!conversationIds.includes(conversationId)) {
            return;
          }

          const incomingMessage: ConversationMessage = {
            id: String(row.id),
            senderId: String(row.sender_id),
            senderRole: row.sender_id === currentUserId ? role : role === "patient" ? "provider" : "patient",
            senderName: row.sender_id === currentUserId ? "You" : "Participant",
            content: String(row.content),
            createdAt: String(row.created_at),
            readAt: row.read_at ? String(row.read_at) : null,
            attachmentPath: typeof row.attachment_path === "string" ? row.attachment_path : undefined,
            attachmentName: typeof row.attachment_name === "string" ? row.attachment_name : undefined,
          };

          setConversations((current) => sortConversations(current.map((conversation) => {
            if (conversation.id !== conversationId) {
              return conversation;
            }

            const incrementUnread = row.sender_id !== currentUserId && activeConversationId !== conversationId;

            return {
              ...conversation,
              lastMessagePreview: buildPreview(incomingMessage),
              lastMessageAt: incomingMessage.createdAt,
              unreadCount: incrementUnread ? conversation.unreadCount + 1 : 0,
            };
          })));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeConversationId, conversationIds, currentUserId, role, supabase]);

  useEffect(() => {
    if (!activeConversationId) {
      return;
    }

    const channel = supabase
      .channel(`conversation-thread-${activeConversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        async (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const row = payload.new as MessageRow;
          const incomingMessage: ConversationMessage = {
            id: String(row.id),
            senderId: String(row.sender_id),
            senderRole: row.sender_id === currentUserId ? role : role === "patient" ? "provider" : "patient",
            senderName: row.sender_id === currentUserId ? "You" : activeThread?.participantName ?? "Participant",
            senderAvatarUrl: row.sender_id === currentUserId ? undefined : activeThread?.participantAvatarUrl,
            content: String(row.content),
            createdAt: String(row.created_at),
            readAt: row.read_at ? String(row.read_at) : null,
            attachmentPath: typeof row.attachment_path === "string" ? row.attachment_path : undefined,
            attachmentName: typeof row.attachment_name === "string" ? row.attachment_name : undefined,
          };

          setThreadCache((current) => {
            const thread = current[activeConversationId];
            if (!thread) {
              return current;
            }

            if (thread.messages.some((message) => message.id === incomingMessage.id)) {
              return current;
            }

            return {
              ...current,
              [activeConversationId]: {
                ...thread,
                unreadCount: row.sender_id === currentUserId ? thread.unreadCount : 0,
                messages: [...thread.messages, incomingMessage],
              },
            };
          });

          if (row.sender_id !== currentUserId) {
            await fetch(`/api/conversations/${activeConversationId}`, { method: "PATCH" }).catch(() => undefined);
            setConversations((current) => current.map((conversation) =>
              conversation.id === activeConversationId
                ? { ...conversation, unreadCount: 0 }
                : conversation,
            ));
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeConversationId, activeThread?.participantAvatarUrl, activeThread?.participantName, currentUserId, role, supabase]);

  useEffect(() => {
    if (!activeConversationId) {
      return;
    }

    const conversationId = activeConversationId;

    async function markActiveConversationRead() {
      await fetch(`/api/conversations/${conversationId}`, { method: "PATCH" }).catch(() => undefined);

      setConversations((current) => current.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, unreadCount: 0 }
          : conversation,
      ));
      setThreadCache((current) => {
        const thread = current[conversationId];
        if (!thread) {
          return current;
        }

        return {
          ...current,
          [conversationId]: {
            ...thread,
            unreadCount: 0,
            messages: thread.messages.map((message: ConversationMessage) => message.senderId === currentUserId ? message : { ...message, readAt: message.readAt ?? new Date().toISOString() }),
          },
        };
      });
    }

    void markActiveConversationRead();
  }, [activeConversationId, currentUserId]);

  async function loadConversation(conversationId: string) {
    setActiveConversationId(conversationId);
    setMobileThreadOpen(true);

    if (threadCache[conversationId]) {
      return;
    }

    setThreadLoading(true);
    const response = await fetch(`/api/conversations/${conversationId}`, { cache: "no-store" });
    const data = await response.json();
    setThreadLoading(false);

    if (!response.ok) {
      setToast({ message: data.error ?? "Unable to load conversation.", variant: "error" });
      return;
    }

    setThreadCache((current) => ({
      ...current,
      [conversationId]: data.thread,
    }));
  }

  function resizeComposer(target: HTMLTextAreaElement) {
    target.style.height = "0px";
    target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
  }

  async function handleAttachmentSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !activeConversationId) {
      return;
    }

    setAttachmentUploading(true);
    const storagePath = `${currentUserId}/${activeConversationId}/${Date.now()}-${sanitizeFileName(file.name)}`;
    const { error } = await supabase.storage.from(storageBucket).upload(storagePath, file, { upsert: false });
    setAttachmentUploading(false);

    if (error) {
      setToast({ message: error.message, variant: "error" });
      event.target.value = "";
      return;
    }

    setPendingAttachment({ path: storagePath, name: file.name });
    event.target.value = "";
  }

  async function openAttachment(message: ConversationMessage) {
    if (!message.attachmentPath) {
      return;
    }

    const { data, error } = await supabase.storage.from(MESSAGE_ATTACHMENT_BUCKET).createSignedUrl(message.attachmentPath, 300);

    if (error || !data?.signedUrl) {
      setToast({ message: error?.message ?? "Unable to open attachment.", variant: "error" });
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  function upsertThreadMessage(conversationId: string, message: ConversationMessage) {
    setThreadCache((current) => {
      const thread = current[conversationId];
      if (!thread) {
        return current;
      }

      if (thread.messages.some((entry) => entry.id === message.id)) {
        return current;
      }

      return {
        ...current,
        [conversationId]: {
          ...thread,
          messages: [...thread.messages, message],
        },
      };
    });

    setConversations((current) => sortConversations(current.map((conversation) =>
      conversation.id === conversationId
        ? {
            ...conversation,
            lastMessagePreview: buildPreview(message),
            lastMessageAt: message.createdAt,
            unreadCount: 0,
          }
        : conversation,
    )));
  }

  function submitMessage() {
    if (!activeConversationId || (!composerValue.trim() && !pendingAttachment)) {
      return;
    }

    startComposerTransition(async () => {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConversationId,
          content: composerValue.trim(),
          attachmentPath: pendingAttachment?.path,
          attachmentName: pendingAttachment?.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setToast({ message: data.error ?? "Unable to send message.", variant: "error" });
        return;
      }

      const nextMessage: ConversationMessage = {
        id: String(data.message.id),
        senderId: currentUserId,
        senderRole: role,
        senderName: "You",
        content: String(data.message.content),
        createdAt: String(data.message.created_at),
        readAt: data.message.read_at ? String(data.message.read_at) : null,
        attachmentPath: typeof data.message.attachment_path === "string" ? data.message.attachment_path : undefined,
        attachmentName: typeof data.message.attachment_name === "string" ? data.message.attachment_name : undefined,
      };

      upsertThreadMessage(activeConversationId, nextMessage);
      setComposerValue("");
      setPendingAttachment(null);
      if (composerRef.current) {
        composerRef.current.style.height = "0px";
      }
    });
  }

  function handleComposerKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitMessage();
    }
  }

  function createConversation(candidate: ConversationCandidate) {
    startConversationTransition(async () => {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(role === "patient" ? { providerProfileId: candidate.id } : { patientId: candidate.id }),
      });

      const data = await response.json();
      if (!response.ok) {
        setToast({ message: data.error ?? "Unable to start conversation.", variant: "error" });
        return;
      }

      const conversationId = String(data.conversationId);
      const nextConversation: ConversationListItem = {
        id: conversationId,
        participantId: candidate.id,
        participantName: candidate.name,
        participantAvatarUrl: candidate.avatarUrl,
        specialtyLabel: candidate.specialtyLabel,
        languages: candidate.languages,
        lastMessagePreview: "Start the conversation",
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0,
      };

      setConversations((current) => {
        const existing = current.find((conversation) => conversation.id === conversationId);
        return sortConversations(existing ? current : [nextConversation, ...current]);
      });
      setThreadCache((current) => ({
        ...current,
        [conversationId]: current[conversationId] ?? {
          id: conversationId,
          participantId: candidate.id,
          participantName: candidate.name,
          participantAvatarUrl: candidate.avatarUrl,
          specialtyLabel: candidate.specialtyLabel,
          languages: candidate.languages,
          unreadCount: 0,
          messages: [],
        },
      }));
      setIsModalOpen(false);
      setSearchQuery("");
      setActiveConversationId(conversationId);
      setMobileThreadOpen(true);
    });
  }

  return (
    <>
      {toast ? <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} /> : null}

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card className={cn("p-0", mobileThreadOpen ? "hidden xl:block" : "block")}>
          <div className="border-b border-[var(--border)] px-4 py-4 sm:px-5">
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--teal-700)]">Secure messaging</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold">Conversations</h2>
              <Button
                type="button"
                size="sm"
                onClick={() => setIsModalOpen(true)}
                className="h-auto gap-2 rounded-lg px-3 py-1.5 text-sm"
              >
                <MessageSquarePlus className="h-4 w-4" />
                New conversation
              </Button>
            </div>
          </div>

          <div className="px-4 py-4 sm:px-5">
            {conversations.length ? (
              <div className="space-y-3">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => void loadConversation(conversation.id)}
                    className={cn(
                      "w-full rounded-[24px] border p-4 text-left transition",
                      activeConversationId === conversation.id ? "border-transparent bg-[var(--rose-50)] ring-2 ring-[rgba(232,125,155,0.2)]" : "border-[var(--border)] bg-white hover:bg-[var(--slate-50)]",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar src={conversation.participantAvatarUrl} name={conversation.participantName} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{conversation.participantName}</p>
                            {conversation.specialtyLabel ? (
                              <span className="mt-1 inline-flex rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--foreground-muted)]">
                                {conversation.specialtyLabel}
                              </span>
                            ) : null}
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-[var(--foreground-muted)]">{formatConversationTimestamp(conversation.lastMessageAt)}</p>
                            {conversation.unreadCount > 0 ? (
                              <span className="mt-2 inline-flex rounded-full bg-[var(--rose-500)] px-2.5 py-1 text-xs font-semibold text-white">
                                {conversation.unreadCount}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <p className="mt-3 truncate text-sm text-[var(--foreground-muted)]">{conversation.lastMessagePreview}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-4 rounded-[24px] border border-dashed border-[var(--border)] bg-[var(--slate-50)] p-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-[var(--teal-700)]">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">No conversations yet</h3>
                  <p className="text-sm leading-6 text-[var(--foreground-muted)]">
                    {role === "patient"
                      ? "Message a provider to ask questions, share updates, or follow up after a visit."
                      : "Start a secure follow-up thread with one of your patients."}
                  </p>
                </div>
                <div className="flex justify-center">
                  <Button type="button" onClick={() => setIsModalOpen(true)}>{role === "patient" ? "Message a Provider" : "Message a Patient"}</Button>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card className={cn("min-h-[720px] p-0", !mobileThreadOpen ? "hidden xl:flex" : "flex", "flex-col overflow-hidden")}>
          {!activeConversationId ? (
            <EmptyThreadState role={role} />
          ) : threadLoading || !activeThread ? (
            <ThreadSkeleton />
          ) : (
            <>
              <div className="border-b border-[var(--border)] px-4 py-4 sm:px-6">
                <div className="mb-4 flex items-center justify-between gap-3 xl:hidden">
                  <Button type="button" variant="ghost" size="sm" className="gap-2" onClick={() => setMobileThreadOpen(false)}>
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar src={activeThread.participantAvatarUrl} name={activeThread.participantName} size="lg" />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-2xl font-semibold">{activeThread.participantName}</h2>
                        {activeThread.specialtyLabel ? <Badge variant="neutral">{activeThread.specialtyLabel}</Badge> : null}
                      </div>
                      {activeThread.languages.length ? <p className="text-sm text-[var(--foreground-muted)]">{activeThread.languages.join(", ")}</p> : null}
                    </div>
                  </div>
                  {role === "patient" ? (
                    <Link href="/appointments">
                      <Button type="button" variant="secondary" className="gap-2">
                        <CalendarPlus className="h-4 w-4" />
                        Book Appointment
                      </Button>
                    </Link>
                  ) : null}
                </div>
                <div className="mt-4 flex items-center gap-2 rounded-[20px] bg-[rgba(61,191,173,0.12)] px-4 py-3 text-sm text-[var(--teal-700)]">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  This is a secure, HIPAA-compliant conversation
                </div>
              </div>

              <div className="flex-1 overflow-auto px-4 py-6 sm:px-6">
                {activeThread.messages.length ? (
                  <div className="space-y-6">
                    {activeThread.messages.map((message, index) => {
                      const previous = activeThread.messages[index - 1];
                      const next = activeThread.messages[index + 1];
                      const ownMessage = message.senderId === currentUserId;
                      const startsNewDate = !previous || !isSameDay(new Date(previous.createdAt), new Date(message.createdAt));
                      const startsGroup = !previous || previous.senderId !== message.senderId || !isSameDay(new Date(previous.createdAt), new Date(message.createdAt));
                      const endsGroup = !next || next.senderId !== message.senderId || !isSameDay(new Date(next.createdAt), new Date(message.createdAt));
                      const bubbleClasses = ownMessage
                        ? "bg-[var(--rose-500)] text-white"
                        : "border border-[var(--border)] bg-white text-[var(--foreground)]";

                      return (
                        <div key={message.id} className="space-y-3">
                          {startsNewDate ? (
                            <div className="flex items-center gap-3 py-2 text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">
                              <div className="h-px flex-1 bg-[var(--border)]" />
                              <span>{formatMessageDay(message.createdAt)}</span>
                              <div className="h-px flex-1 bg-[var(--border)]" />
                            </div>
                          ) : null}
                          <div className={cn("flex gap-3", ownMessage ? "justify-end" : "justify-start")}>
                            {!ownMessage ? (
                              endsGroup ? <Avatar src={message.senderAvatarUrl} name={message.senderName} size="sm" /> : <div className="w-10" />
                            ) : null}
                            <div className={cn("max-w-[85%] space-y-1", ownMessage ? "items-end" : "items-start")}>
                              {startsGroup && !ownMessage ? <p className="px-2 text-xs font-medium text-[var(--foreground-muted)]">{message.senderName}</p> : null}
                              <div className={cn("rounded-[24px] px-4 py-3 text-sm leading-7", bubbleClasses)}>
                                {message.content ? <p>{message.content}</p> : null}
                                {message.attachmentName ? (
                                  <button
                                    type="button"
                                    className={cn(
                                      "mt-3 inline-flex items-center rounded-full px-3 py-2 text-xs font-medium transition",
                                      ownMessage ? "bg-white/15 text-white hover:bg-white/20" : "bg-[var(--slate-50)] text-[var(--foreground)] hover:bg-[var(--slate-100)]",
                                    )}
                                    onClick={() => void openAttachment(message)}
                                  >
                                    <Paperclip className="mr-2 h-3.5 w-3.5" />
                                    {message.attachmentName}
                                  </button>
                                ) : null}
                              </div>
                              {endsGroup ? <p className="px-2 text-xs text-[var(--foreground-muted)]">{formatMessageTimestamp(message.createdAt)}</p> : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={endRef} />
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center py-12">
                    <div className="max-w-sm space-y-3 text-center">
                      <h3 className="text-2xl font-semibold">Start the conversation</h3>
                      <p className="text-sm leading-6 text-[var(--foreground-muted)]">Send the first secure message to open this thread.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-[var(--border)] px-4 py-4 sm:px-6">
                {pendingAttachment ? (
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--slate-50)] px-3 py-2 text-xs font-medium text-[var(--foreground)]">
                    <Paperclip className="h-3.5 w-3.5" />
                    {pendingAttachment.name}
                    <button type="button" onClick={() => setPendingAttachment(null)} className="rounded-full p-0.5 text-[var(--foreground-muted)] hover:text-[var(--foreground)]">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : null}
                <div className="rounded-[28px] border border-[var(--border)] bg-[var(--slate-50)] p-3">
                  <textarea
                    ref={composerRef}
                    value={composerValue}
                    onChange={(event) => {
                      setComposerValue(event.target.value);
                      resizeComposer(event.target);
                    }}
                    onKeyDown={handleComposerKeyDown}
                    rows={1}
                    className="min-h-[52px] max-h-32 w-full resize-none bg-transparent px-2 py-2 text-sm leading-6"
                    placeholder="Write a secure message"
                  />
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={(event) => void handleAttachmentSelected(event)}
                      />
                      <Button type="button" variant="secondary" size="sm" className="gap-2" onClick={() => fileInputRef.current?.click()} disabled={attachmentUploading || !activeConversationId}>
                        {attachmentUploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                        {attachmentUploading ? "Uploading..." : "Attach file"}
                      </Button>
                    </div>
                    <Button type="button" className="gap-2" onClick={submitMessage} disabled={isComposerBusy || (!composerValue.trim() && !pendingAttachment)}>
                      <SendHorizontal className="h-4 w-4" />
                      {isComposerBusy ? "Sending..." : "Send"}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.45)] p-4">
          <Card className="max-h-[90vh] w-full max-w-2xl overflow-auto space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-[var(--teal-700)]">New conversation</p>
                <h2 className="mt-2 text-2xl font-semibold">{role === "patient" ? "Message a Provider" : "Message a Patient"}</h2>
              </div>
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Close</Button>
            </div>
            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--slate-50)] px-4 py-3">
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full bg-transparent text-sm"
                placeholder={role === "patient" ? "Search by provider name or specialty" : "Search by patient name"}
              />
            </div>
            {isCreatingConversation ? <ConversationListSkeleton /> : filteredCandidates.length ? (
              <div className="space-y-3">
                {filteredCandidates.map((candidate) => (
                  <button
                    key={candidate.id}
                    type="button"
                    className="flex w-full items-center gap-3 rounded-[24px] border border-[var(--border)] bg-white p-4 text-left transition hover:bg-[var(--slate-50)]"
                    onClick={() => createConversation(candidate)}
                  >
                    <Avatar src={candidate.avatarUrl} name={candidate.name} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold">{candidate.name}</p>
                        {candidate.specialtyLabel ? <Badge variant="neutral">{candidate.specialtyLabel}</Badge> : null}
                      </div>
                      {candidate.languages.length ? <p className="mt-1 text-sm text-[var(--foreground-muted)]">{candidate.languages.join(", ")}</p> : null}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-[var(--border)] bg-[var(--slate-50)] p-6 text-center">
                <p className="font-semibold">No matches found</p>
                <p className="mt-2 text-sm text-[var(--foreground-muted)]">Try a different search or come back after more providers or patients are available.</p>
              </div>
            )}
          </Card>
        </div>
      ) : null}
    </>
  );
}

