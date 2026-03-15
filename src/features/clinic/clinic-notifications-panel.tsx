"use client";

import { useMemo, useState } from "react";
import { BellRing, Filter } from "lucide-react";
import { markAllClinicNotificationsReadAction } from "@/app/(clinic)/clinic/actions";
import type { ClinicNotificationListItem } from "@/lib/clinic-admin-data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ClinicEmptyState, NotificationTypeBadge } from "@/features/clinic/clinic-ui";

export function ClinicNotificationsPanel({ notifications, redirectTo }: { notifications: ClinicNotificationListItem[]; redirectTo: string }) {
  const [filter, setFilter] = useState("all");
  const filtered = useMemo(() => {
    if (filter === "all") {
      return notifications;
    }

    return notifications.filter((item) => item.type.toLowerCase().includes(filter));
  }, [filter, notifications]);

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-[var(--rose-700)]">Notifications</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">System notifications</h2>
        </div>
        <div className="flex gap-3">
          <label className="flex h-11 items-center gap-3 rounded-xl border border-[var(--border)] bg-white px-4 text-sm text-[var(--foreground-muted)]">
            <Filter className="h-4 w-4" />
            <select value={filter} onChange={(event) => setFilter(event.target.value)} className="bg-transparent text-[var(--foreground)] outline-none">
              <option value="all">All</option>
              <option value="appointment">Appointment</option>
              <option value="message">Message</option>
              <option value="system">System</option>
            </select>
          </label>
          <form action={markAllClinicNotificationsReadAction}>
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <Button type="submit" className="h-11 rounded-xl px-5">
              <BellRing className="mr-2 h-4 w-4" />
              Mark all as read
            </Button>
          </form>
        </div>
      </div>

      {filtered.length ? (
        <div className="mt-6 space-y-3">
          {filtered.map((notification) => (
            <div key={notification.id} className="rounded-[24px] border border-[var(--border)] px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-[var(--foreground)]">{notification.userName}</p>
                    <NotificationTypeBadge type={notification.type} />
                  </div>
                  <p className="mt-2 font-medium text-[var(--foreground)]">{notification.title}</p>
                  <p className="mt-1 text-sm leading-7 text-[var(--foreground-muted)]">{notification.body}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="text-[var(--foreground-muted)]">{notification.time}</p>
                  <p className={`mt-1 font-medium ${notification.read ? "text-slate-500" : "text-[var(--rose-700)]"}`}>{notification.read ? "Read" : "Unread"}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <ClinicEmptyState title="No notifications found" body="Adjust the filter to see more system activity." />
        </div>
      )}
    </Card>
  );
}
