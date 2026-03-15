"use client";

import { FormEvent, useMemo, useState } from "react";
import { CalendarHeart, HeartHandshake, LoaderCircle, ShieldCheck, UserPlus2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Toast } from "@/components/ui/Toast";
import {
  getPartnerAccessLevelLabel,
  getPartnerAccessSummary,
  partnerAccessLevels,
  type PartnerAccessLevel,
} from "@/lib/partner-access";
import { formatDate } from "@/lib/utils";

type PartnerRecord = {
  accessId: string;
  partnerId: string;
  name: string;
  email: string;
  accessLevel: string;
  accessLabel: string;
  grantedAt: string | null;
  avatarUrl?: string;
};

type Props = {
  patientName: string;
  patientEmail: string;
  partner: PartnerRecord | null;
};

type ToastState = {
  message: string;
  variant: "success" | "error" | "info";
};

const inviteCards: Array<{
  value: PartnerAccessLevel;
  title: string;
  description: string;
}> = partnerAccessLevels.map((value) => ({
  value,
  title: getPartnerAccessLevelLabel(value),
  description: getPartnerAccessSummary(value),
}));

function AccessLevelPicker({
  value,
  onChange,
}: {
  value: PartnerAccessLevel;
  onChange: (value: PartnerAccessLevel) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {inviteCards.map((card) => {
        const selected = value === card.value;
        return (
          <button
            key={card.value}
            type="button"
            onClick={() => onChange(card.value)}
            className={selected
              ? "rounded-[24px] border border-transparent bg-[var(--rose-50)] p-4 text-left ring-2 ring-[rgba(232,125,155,0.24)]"
              : "rounded-[24px] border border-[var(--border)] bg-white p-4 text-left transition hover:bg-[var(--slate-50)]"
            }
          >
            <p className="font-semibold tracking-tight text-[var(--foreground)]">{card.title}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">{card.description}</p>
          </button>
        );
      })}
    </div>
  );
}

export function PatientPartnerSettings({ patientName, patientEmail, partner: initialPartner }: Props) {
  const [partner, setPartner] = useState(initialPartner);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteAccessLevel, setInviteAccessLevel] = useState<PartnerAccessLevel>("view_appointments");
  const [inviteMessage, setInviteMessage] = useState("");
  const [editAccessLevel, setEditAccessLevel] = useState<PartnerAccessLevel>(
    (initialPartner?.accessLevel as PartnerAccessLevel | undefined) ?? "view_appointments",
  );

  const grantedDateLabel = useMemo(() => (partner?.grantedAt ? formatDate(partner.grantedAt) : null), [partner?.grantedAt]);

  async function handleInviteSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/partner-access/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          fullName: inviteName,
          accessLevel: inviteAccessLevel,
          message: inviteMessage,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to send invitation.");
      }

      setToast({ message: `Invitation sent to ${data.email}.`, variant: "success" });
      setInviteOpen(false);
      setInviteEmail("");
      setInviteName("");
      setInviteAccessLevel("view_appointments");
      setInviteMessage("");
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "Unable to send invitation.", variant: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEditAccess() {
    if (!partner) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/partner-access", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessLevel: editAccessLevel }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to update partner access.");
      }

      setPartner((current) =>
        current
          ? {
              ...current,
              accessLevel: data.partner.accessLevel,
              accessLabel: data.partner.accessLabel,
            }
          : current,
      );
      setToast({ message: "Partner access updated.", variant: "success" });
      setEditOpen(false);
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "Unable to update partner access.", variant: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRevokeAccess() {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/partner-access", { method: "DELETE" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to revoke access.");
      }

      setPartner(null);
      setRevokeOpen(false);
      setToast({ message: "Access revoked.", variant: "success" });
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "Unable to revoke access.", variant: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {toast ? <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} /> : null}
      <div className="space-y-6">
        <Card className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-[var(--rose-700)]">Partner access</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">Share care updates with someone you trust</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--foreground-muted)]">
                Invite a partner to follow key parts of your care journey. You stay in control and can update or revoke access at any time.
              </p>
            </div>
            {!partner ? (
              <button
                type="button"
                onClick={() => setInviteOpen(true)}
                className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--rose-500)] px-5 text-sm font-medium text-white shadow-[0_12px_30px_rgba(212,88,123,0.28)] transition hover:bg-[var(--rose-600)]"
              >
                Invite your partner
              </button>
            ) : null}
          </div>

          {partner ? (
            <div className="rounded-[28px] border border-[var(--border)] bg-[var(--slate-50)] p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Avatar src={partner.avatarUrl} name={partner.name} size="lg" />
                  <div>
                    <h3 className="text-2xl font-semibold tracking-tight">{partner.name}</h3>
                    <p className="mt-1 text-sm text-[var(--foreground-muted)]">{partner.email}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <Badge variant="info">{partner.accessLabel}</Badge>
                      {grantedDateLabel ? <p className="text-xs uppercase tracking-[0.16em] text-[var(--foreground-muted)]">Granted {grantedDateLabel}</p> : null}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditAccessLevel((partner.accessLevel as PartnerAccessLevel) ?? "view_appointments");
                      setEditOpen(true);
                    }}
                    className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--border)] bg-white px-5 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--slate-50)]"
                  >
                    Edit access
                  </button>
                  <button
                    type="button"
                    onClick={() => setRevokeOpen(true)}
                    className="inline-flex h-11 items-center justify-center rounded-full border border-[rgba(212,88,123,0.18)] bg-[var(--rose-50)] px-5 text-sm font-medium text-[var(--rose-700)] transition hover:bg-[rgba(212,88,123,0.14)]"
                  >
                    Revoke access
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[28px] border border-dashed border-[var(--border)] bg-[var(--slate-50)] p-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-[var(--rose-600)]">
                <HeartHandshake className="h-8 w-8" />
              </div>
              <h3 className="mt-5 text-2xl font-semibold tracking-tight">No partner connected</h3>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[var(--foreground-muted)]">
                Invite someone who supports you to stay informed about the parts of your health journey you choose to share.
              </p>
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => setInviteOpen(true)}
                  className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--rose-500)] px-6 text-sm font-medium text-white shadow-[0_12px_30px_rgba(212,88,123,0.28)] transition hover:bg-[var(--rose-600)]"
                >
                  Invite your partner
                </button>
              </div>
            </div>
          )}
        </Card>

        <Card className="flex items-start gap-4 border-[rgba(61,191,173,0.22)] bg-[rgba(61,191,173,0.08)]">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[var(--teal-700)]">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-semibold tracking-tight">You stay in control</h3>
            <p className="mt-2 text-sm leading-7 text-[var(--foreground-muted)]">
              Partner access is read-only and limited to the level you choose. You can change permissions or revoke access anytime from this page.
            </p>
            <p className="mt-3 text-xs uppercase tracking-[0.16em] text-[var(--foreground-muted)]">Primary account: {patientName} | {patientEmail}</p>
          </div>
        </Card>
      </div>

      {inviteOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.45)] p-4">
          <Card className="max-h-[90vh] w-full max-w-3xl overflow-auto space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-[var(--rose-700)]">Invite partner</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight">Share part of your care journey</h3>
              </div>
              <button type="button" onClick={() => setInviteOpen(false)} className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--slate-50)]">
                Close
              </button>
            </div>
            <form className="space-y-5" onSubmit={handleInviteSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-medium text-[var(--foreground)]">Partner email address</span>
                  <input value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} type="email" required className="w-full rounded-[20px] border border-[var(--border)] px-4 py-3" placeholder="partner@example.com" />
                </label>
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-medium text-[var(--foreground)]">Partner full name</span>
                  <input value={inviteName} onChange={(event) => setInviteName(event.target.value)} required className="w-full rounded-[20px] border border-[var(--border)] px-4 py-3" placeholder="Alex Johnson" />
                </label>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)]">Choose access level</p>
                  <p className="mt-1 text-sm text-[var(--foreground-muted)]">Select exactly what your partner can view.</p>
                </div>
                <AccessLevelPicker value={inviteAccessLevel} onChange={setInviteAccessLevel} />
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--foreground)]">Personal message</span>
                <textarea value={inviteMessage} onChange={(event) => setInviteMessage(event.target.value)} className="min-h-28 w-full rounded-[24px] border border-[var(--border)] px-4 py-3" placeholder="Add a personal note to your partner" />
              </label>

              <div className="flex justify-end gap-3 border-t border-[var(--border)] pt-5">
                <button type="button" onClick={() => setInviteOpen(false)} className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--border)] px-5 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--slate-50)]">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--rose-500)] px-5 text-sm font-medium text-white transition hover:bg-[var(--rose-600)] disabled:cursor-not-allowed disabled:opacity-70">
                  {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UserPlus2 className="h-4 w-4" />}
                  {isSubmitting ? "Sending..." : "Send invitation"}
                </button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}

      {editOpen && partner ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.45)] p-4">
          <Card className="w-full max-w-3xl space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-[var(--rose-700)]">Edit access</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight">Update what {partner.name} can see</h3>
              </div>
              <button type="button" onClick={() => setEditOpen(false)} className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--slate-50)]">
                Close
              </button>
            </div>
            <AccessLevelPicker value={editAccessLevel} onChange={setEditAccessLevel} />
            <div className="flex justify-end gap-3 border-t border-[var(--border)] pt-5">
              <button type="button" onClick={() => setEditOpen(false)} className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--border)] px-5 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--slate-50)]">
                Cancel
              </button>
              <button type="button" disabled={isSubmitting} onClick={() => void handleEditAccess()} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--rose-500)] px-5 text-sm font-medium text-white transition hover:bg-[var(--rose-600)] disabled:cursor-not-allowed disabled:opacity-70">
                {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                Save access
              </button>
            </div>
          </Card>
        </div>
      ) : null}

      {revokeOpen && partner ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.45)] p-4">
          <Card className="w-full max-w-xl space-y-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--rose-50)] text-[var(--rose-600)]">
              <CalendarHeart className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold tracking-tight">Remove {partner.name}&apos;s access to your health data?</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--foreground-muted)]">
                They will be signed out immediately and will not be able to view your shared appointments, pregnancy updates, or fertility data anymore.
              </p>
            </div>
            <div className="flex justify-end gap-3 border-t border-[var(--border)] pt-5">
              <button type="button" onClick={() => setRevokeOpen(false)} className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--border)] px-5 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--slate-50)]">
                Cancel
              </button>
              <button type="button" disabled={isSubmitting} onClick={() => void handleRevokeAccess()} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--rose-500)] px-5 text-sm font-medium text-white transition hover:bg-[var(--rose-600)] disabled:cursor-not-allowed disabled:opacity-70">
                {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                Revoke access
              </button>
            </div>
          </Card>
        </div>
      ) : null}
    </>
  );
}
