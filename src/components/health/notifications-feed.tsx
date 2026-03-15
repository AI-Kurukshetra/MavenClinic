"use client";

import { useEffect, useMemo, useState } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { BellRing, ChevronRight, ShieldCheck } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn, formatDateTime } from "@/lib/utils";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  type: string;
  actor: string;
  readAt: string | null;
  createdAt: string;
  severity: string;
};

type Props = {
  userId: string;
  initialNotifications: NotificationItem[];
  initialUnreadCount: number;
};

type NotificationRow = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  type: string | null;
  read_at: string | null;
  created_at: string | null;
};

function getSeverityClasses(severity: string, isRead: boolean) {
  if (severity === "High") {
    return isRead ? "border-[rgba(190,68,100,0.12)] bg-white" : "border-[rgba(190,68,100,0.2)] bg-[rgba(190,68,100,0.06)]";
  }

  if (severity === "Medium") {
    return isRead ? "border-[var(--border)] bg-white" : "border-[rgba(232,125,155,0.18)] bg-[rgba(232,125,155,0.06)]";
  }

  return isRead ? "border-[var(--border)] bg-white" : "border-[rgba(46,168,152,0.18)] bg-[rgba(46,168,152,0.06)]";
}

function getNotificationSeverity(type?: string | null) {
  const normalized = type?.toLowerCase() ?? "";

  if (["suspend", "cancel", "escalat", "urgent"].some((keyword) => normalized.includes(keyword))) {
    return "High";
  }

  if (["invite", "appointment", "message", "review"].some((keyword) => normalized.includes(keyword))) {
    return "Medium";
  }

  return "Low";
}

function getSafeNotificationPath(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? (value as Route) : null;
}

export function NotificationsFeed({ userId, initialNotifications, initialUnreadCount }: Props) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel(`notifications-feed-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_id=eq.${userId}` },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const row = payload.new as NotificationRow;
          const nextItem: NotificationItem = {
            id: String(row.id),
            title: String(row.title),
            body: row.body ?? "",
            link: row.link ?? null,
            type: row.type ?? "general",
            actor: "System",
            readAt: row.read_at ?? null,
            createdAt: row.created_at ?? new Date().toISOString(),
            severity: getNotificationSeverity(row.type),
          };

          setNotifications((current) => [nextItem, ...current.filter((item) => item.id !== nextItem.id)]);
          if (!nextItem.readAt) {
            setUnreadCount((current) => current + 1);
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter: `recipient_id=eq.${userId}` },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const row = payload.new as NotificationRow;
          const previous = payload.old as NotificationRow;

          setNotifications((current) => current.map((item) => item.id === row.id ? { ...item, readAt: row.read_at ?? null } : item));

          if (!previous.read_at && row.read_at) {
            setUnreadCount((current) => Math.max(0, current - 1));
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  const unreadLabel = useMemo(() => `${unreadCount} unread`, [unreadCount]);

  async function handleNotificationClick(item: NotificationItem) {
    if (pendingId) {
      return;
    }

    if (item.readAt) {
      const nextPath = getSafeNotificationPath(item.link);
      if (nextPath) {
        router.push(nextPath);
      }
      return;
    }

    setPendingId(item.id);
    const response = await fetch(`/api/notifications/${item.id}`, { method: "PATCH" });
    const data = await response.json().catch(() => null);
    setPendingId(null);

    if (response.ok) {
      setNotifications((current) => current.map((entry) => entry.id === item.id ? { ...entry, readAt: data?.notification?.read_at ?? new Date().toISOString() } : entry));
    }

    const nextPath = getSafeNotificationPath(item.link);
    if (nextPath) {
      router.push(nextPath);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-[rgba(46,168,152,0.18)] bg-[rgba(46,168,152,0.08)] p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-white/80 p-3 text-[var(--teal-700)]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--foreground)]">Realtime notifications stay private to your workspace.</p>
            <p className="mt-1 text-sm leading-6 text-[var(--foreground-muted)]">Updates appear here as appointments, care updates, and messages happen.</p>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--rose-700)]">Activity center</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Notifications</h2>
        </div>
        <div className="rounded-full bg-[var(--slate-50)] px-4 py-2 text-sm font-medium text-[var(--foreground-muted)]">{unreadLabel}</div>
      </div>

      {notifications.length ? (
        <div className="space-y-4">
          {notifications.map((item) => {
            const isRead = Boolean(item.readAt);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => void handleNotificationClick(item)}
                className={cn(
                  "w-full rounded-[28px] border p-5 text-left transition hover:translate-y-[-1px] hover:shadow-[0_16px_32px_rgba(25,22,17,0.06)]",
                  getSeverityClasses(item.severity, isRead),
                  pendingId === item.id ? "opacity-70" : "",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-lg font-semibold tracking-tight text-[var(--foreground)]">{item.title}</p>
                      {!isRead ? <span className="rounded-full bg-[var(--rose-500)] px-2.5 py-1 text-xs font-semibold text-white">Unread</span> : null}
                    </div>
                    <p className="mt-2 text-sm leading-7 text-[var(--foreground-muted)]">{item.body || "A new update is available in your workspace."}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[var(--foreground-muted)]">
                      <span>{item.actor}</span>
                      <span>•</span>
                      <span>{formatDateTime(item.createdAt)}</span>
                      <span>•</span>
                      <span>{item.severity} priority</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[var(--teal-700)]">
                    <BellRing className="h-5 w-5" />
                    <ChevronRight className="h-4 w-4 text-[var(--foreground-muted)]" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--slate-50)] text-[var(--teal-700)]">
            <BellRing className="h-8 w-8" />
          </div>
          <h3 className="mt-5 text-2xl font-semibold tracking-tight">No notifications yet</h3>
          <p className="mt-2 text-sm leading-7 text-[var(--foreground-muted)]">When appointments are booked, messages arrive, or care updates are created, they will appear here in realtime.</p>
        </Card>
      )}
    </div>
  );
}