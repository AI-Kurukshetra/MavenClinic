"use client";

import { useMemo, useState } from "react";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Toast } from "@/components/ui/Toast";
import type { SupportGroupItem, SupportGroupsPageData } from "@/lib/patient-pages";

type ToastState = {
  message: string;
  variant?: "success" | "error" | "info";
};

function categoryVariant(category: string) {
  switch (category) {
    case "fertility":
      return "success" as const;
    case "pregnancy":
      return "info" as const;
    case "menopause":
      return "warning" as const;
    case "mental_health":
      return "info" as const;
    default:
      return "neutral" as const;
  }
}

export function SupportGroupsPage({ groups }: SupportGroupsPageData) {
  const [items, setItems] = useState(groups);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [busyGroupId, setBusyGroupId] = useState<string | null>(null);

  const joinedGroups = useMemo(() => items.filter((group) => group.joined), [items]);

  async function updateMembership(group: SupportGroupItem, action: "join" | "leave") {
    try {
      setBusyGroupId(group.id);
      setItems((current) => current.map((item) => item.id === group.id ? {
        ...item,
        joined: action === "join",
        memberCount: Math.max(0, item.memberCount + (action === "join" ? 1 : -1)),
      } : item));

      const response = await fetch(`/api/support-groups/${group.id}`, {
        method: action === "join" ? "POST" : "DELETE",
      });

      if (!response.ok) {
        throw new Error(action === "join" ? "Unable to join this group." : "Unable to leave this group.");
      }

      setToast({ message: action === "join" ? `Joined ${group.name}.` : `Left ${group.name}.`, variant: "success" });
    } catch (error) {
      setItems(groups);
      setToast({ message: error instanceof Error ? error.message : "Unable to update group membership.", variant: "error" });
    } finally {
      setBusyGroupId(null);
    }
  }

  return (
    <div className="space-y-6">
      {toast ? <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} /> : null}

      {joinedGroups.length ? (
        <Card className="space-y-4 p-6">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-[var(--rose-700)]">My groups</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Your current communities</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {joinedGroups.map((group) => (
              <div key={group.id} className="rounded-[22px] border border-[var(--border)] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{group.name}</p>
                    <p className="mt-1 text-sm text-[var(--foreground-muted)]">Moderated by {group.moderatorName}</p>
                  </div>
                  <Badge variant={categoryVariant(group.category)}>{group.category.replace(/_/g, " ")}</Badge>
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--foreground-muted)]">{group.description}</p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <Card className="space-y-4 p-6">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-[var(--rose-700)]">Community support groups</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Connect with others on similar health journeys</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">Join moderated spaces where patients share encouragement, practical tips, and what helped them feel supported.</p>
        </div>

        {items.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {items.map((group) => (
              <div key={group.id} className="rounded-[24px] border border-[var(--border)] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xl font-semibold tracking-tight">{group.name}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant={categoryVariant(group.category)}>{group.category.replace(/_/g, " ")}</Badge>
                      <span className="text-sm text-[var(--foreground-muted)]">{group.memberCount} members</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={group.joined ? "secondary" : "primary"}
                    disabled={busyGroupId === group.id}
                    onClick={() => updateMembership(group, group.joined ? "leave" : "join")}
                  >
                    {busyGroupId === group.id ? "Saving..." : group.joined ? "Leave" : "Join"}
                  </Button>
                </div>
                <p className="mt-4 line-clamp-2 text-sm leading-6 text-[var(--foreground-muted)]">{group.description}</p>
                <div className="mt-4 flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
                  <Users className="h-4 w-4" />
                  <span>Moderated by {group.moderatorName}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-[var(--border)] px-6 py-12 text-center">
            <h3 className="text-2xl font-semibold tracking-tight">No support groups available yet</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">Our clinical team is setting up moderated community spaces. Check back soon for new support groups.</p>
          </div>
        )}
      </Card>
    </div>
  );
}