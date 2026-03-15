"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Toast } from "@/components/ui/Toast";
import type { InsurancePageData } from "@/lib/patient-pages";
import { currencyFromCents, formatDate } from "@/lib/utils";

type ToastState = {
  message: string;
  variant?: "success" | "error" | "info";
};

const carriers = ["Aetna", "Anthem", "Blue Cross Blue Shield", "Cigna", "UnitedHealthcare", "Kaiser Permanente", "Other"];

function statusVariant(status: InsurancePageData["claims"][number]["status"]) {
  switch (status) {
    case "approved":
      return "success" as const;
    case "paid":
      return "success" as const;
    case "denied":
      return "info" as const;
    case "pending":
      return "warning" as const;
    case "submitted":
      return "neutral" as const;
    default:
      return "neutral" as const;
  }
}

function maskMemberId(value: string | null) {
  if (!value) return "Not added yet";
  return `${"*".repeat(Math.max(0, value.length - 4))}${value.slice(-4)}`;
}

export function InsurancePage(initialData: InsurancePageData) {
  const [data, setData] = useState(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [carrier, setCarrier] = useState(initialData.insuranceCarrier ?? carriers[0]);
  const [memberId, setMemberId] = useState(initialData.insuranceMemberId ?? "");
  const [groupNumber, setGroupNumber] = useState(initialData.insuranceGroupNumber ?? "");
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function saveInsurance() {
    try {
      setIsSaving(true);
      const response = await fetch("/api/insurance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carrier, memberId, groupNumber }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Unable to update insurance details.");
      }

      setData((current) => ({
        ...current,
        insuranceCarrier: carrier,
        insuranceMemberId: memberId,
        insuranceGroupNumber: groupNumber,
      }));
      setIsModalOpen(false);
      setToast({ message: "Insurance information updated.", variant: "success" });
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "Unable to update insurance details.", variant: "error" });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {toast ? <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} /> : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="space-y-4 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-[var(--rose-700)]">Insurance information</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">Your coverage details</h2>
            </div>
            <Button variant="secondary" onClick={() => setIsModalOpen(true)}>Edit</Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[22px] bg-[var(--slate-50)] p-5"><p className="text-sm text-[var(--foreground-muted)]">Carrier</p><p className="mt-2 text-lg font-semibold tracking-tight">{data.insuranceCarrier ?? "Add carrier"}</p></div>
            <div className="rounded-[22px] bg-[var(--slate-50)] p-5"><p className="text-sm text-[var(--foreground-muted)]">Member ID</p><p className="mt-2 text-lg font-semibold tracking-tight">{maskMemberId(data.insuranceMemberId)}</p></div>
            <div className="rounded-[22px] bg-[var(--slate-50)] p-5"><p className="text-sm text-[var(--foreground-muted)]">Group number</p><p className="mt-2 text-lg font-semibold tracking-tight">{data.insuranceGroupNumber ?? "Optional"}</p></div>
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-[var(--rose-700)]">Coverage information</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight">Plan highlights</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[22px] border border-[var(--border)] p-4"><p className="font-medium">Your plan covers video consultations</p><p className="mt-1 text-sm text-[var(--foreground-muted)]">Most Maven appointments can be billed directly to your plan.</p></div>
            <div className="rounded-[22px] border border-[var(--border)] p-4"><p className="font-medium">HSA and FSA accepted</p><p className="mt-1 text-sm text-[var(--foreground-muted)]">Use pre-tax funds for eligible direct-pay visits.</p></div>
            <div className="rounded-[22px] border border-[var(--border)] p-4"><p className="font-medium">No referral required</p><p className="mt-1 text-sm text-[var(--foreground-muted)]">Your care team can coordinate specialists inside Maven Clinic.</p></div>
            <div className="rounded-[22px] border border-[var(--border)] p-4"><p className="font-medium">Coverage questions?</p><p className="mt-1 text-sm text-[var(--foreground-muted)]">If your employer sponsors coverage, your HR team can help confirm details.</p></div>
          </div>
        </Card>
      </div>

      <Card className="space-y-4 p-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-[var(--teal-700)]" />
          <div>
            <h3 className="text-2xl font-semibold tracking-tight">Claims history</h3>
            <p className="text-sm text-[var(--foreground-muted)]">Claims are automatically created after eligible visits are completed.</p>
          </div>
        </div>
        {data.claims.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--foreground-muted)]">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Provider</th>
                  <th className="pb-3 font-medium">Service</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.claims.map((claim) => (
                  <tr key={claim.id} className="border-b border-[rgba(15,23,42,0.06)] align-top">
                    <td className="py-4">{formatDate(claim.createdAt)}</td>
                    <td className="py-4">{claim.providerName}</td>
                    <td className="py-4">{claim.service}</td>
                    <td className="py-4">{currencyFromCents(claim.amountCents)}</td>
                    <td className="py-4"><Badge variant={statusVariant(claim.status)}>{claim.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-[var(--border)] px-6 py-12 text-center">
            <h3 className="text-2xl font-semibold tracking-tight">No insurance claims yet</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">Claims are automatically created when you complete an appointment with insurance.</p>
          </div>
        )}
      </Card>

      {isModalOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(15,23,42,0.28)] p-4">
          <Card className="w-full max-w-lg space-y-5 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-[var(--rose-700)]">Update insurance</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight">Coverage details</h3>
              </div>
              <button type="button" className="text-sm text-[var(--foreground-muted)]" onClick={() => setIsModalOpen(false)}>Close</button>
            </div>
            <label className="block text-sm font-medium text-[var(--foreground)]">
              Carrier
              <select value={carrier} onChange={(event) => setCarrier(event.target.value)} className="mt-2 h-12 w-full rounded-[18px] border border-[var(--border)] px-4 text-sm outline-none transition focus:border-[var(--rose-400)] focus:ring-2 focus:ring-[rgba(245,163,183,0.3)]">
                {carriers.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium text-[var(--foreground)]">
              Member ID
              <input value={memberId} onChange={(event) => setMemberId(event.target.value)} className="mt-2 h-12 w-full rounded-[18px] border border-[var(--border)] px-4 text-sm outline-none transition focus:border-[var(--rose-400)] focus:ring-2 focus:ring-[rgba(245,163,183,0.3)]" />
            </label>
            <label className="block text-sm font-medium text-[var(--foreground)]">
              Group number
              <input value={groupNumber} onChange={(event) => setGroupNumber(event.target.value)} className="mt-2 h-12 w-full rounded-[18px] border border-[var(--border)] px-4 text-sm outline-none transition focus:border-[var(--rose-400)] focus:ring-2 focus:ring-[rgba(245,163,183,0.3)]" />
            </label>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button onClick={saveInsurance} disabled={isSaving}>{isSaving ? "Saving..." : "Save insurance"}</Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}