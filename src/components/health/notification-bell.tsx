"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Props = {
  userId: string | null;
  initialUnreadCount: number;
};

type NotificationRow = {
  id: string;
  recipient_id: string | null;
  read_at: string | null;
};

export function NotificationBell({ userId, initialUnreadCount }: Props) {
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel(`notifications-bell-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_id=eq.${userId}` },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const row = payload.new as NotificationRow;
          if (!row.read_at) {
            setUnreadCount((current) => current + 1);
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter: `recipient_id=eq.${userId}` },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const previous = payload.old as NotificationRow;
          const next = payload.new as NotificationRow;

          if (!previous.read_at && next.read_at) {
            setUnreadCount((current) => Math.max(0, current - 1));
          }

          if (previous.read_at && !next.read_at) {
            setUnreadCount((current) => current + 1);
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  return (
    <Link
      href="/notifications"
      className="relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--foreground-muted)] transition hover:border-[var(--rose-200)] hover:bg-[var(--rose-50)] hover:text-[var(--rose-600)]"
      aria-label="Open notifications"
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 ? (
        <span className="absolute -right-1 -top-1 inline-flex min-w-[1.35rem] items-center justify-center rounded-full bg-[var(--rose-500)] px-1.5 py-0.5 text-[11px] font-semibold text-white shadow-[0_10px_22px_rgba(212,88,123,0.25)]">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}