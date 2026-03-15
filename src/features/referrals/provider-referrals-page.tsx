"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, CircleAlert, LoaderCircle, Search, Stethoscope } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Toast } from "@/components/ui/Toast";
import { formatReferralSpecialty, referralPayloadSchema, referralSpecialties, type ProviderReferralListItem, type ProviderReferralsPageData } from "@/lib/referral-shared";
import { cn, formatDate, titleCase } from "@/lib/utils";

type Props = ProviderReferralsPageData;
type StatusFilter = "all" | "pending" | "accepted" | "completed";
type ToastState = { message: string; variant: "success" | "error" | "info" };
type FormState = {
  patientId: string;
  referredToSpecialty: (typeof referralSpecialties)[number];
  referredToProviderId: string;
  reason: string;
  urgency: "routine" | "urgent" | "emergency";
  clinicalNotes: string;
};

const urgencyOptions: Array<{ value: FormState["urgency"]; label: string; tone: string }> = [
  { value: "routine", label: "Routine", tone: "border-slate-200 text-slate-600" },
  { value: "urgent", label: "Urgent", tone: "border-amber-200 text-amber-700" },
  { value: "emergency", label: "Emergency", tone: "border-rose-200 text-rose-700" },
];

function getEmptyForm(): FormState {
  return {
    patientId: "",
    referredToSpecialty: "general",
    referredToProviderId: "",
    reason: "",
    urgency: "routine",
    clinicalNotes: "",
  };
}

function getUrgencyVariant(urgency: ProviderReferralListItem["urgency"]) {
  if (urgency === "emergency") return "warning" as const;
  if (urgency === "urgent") return "info" as const;
  return "neutral" as const;
}

function getStatusVariant(status: ProviderReferralListItem["status"]) {
  if (status === "accepted") return "success" as const;
  if (status === "completed") return "neutral" as const;
  if (status === "cancelled") return "warning" as const;
  return "info" as const;
}

export function ProviderReferralsPage({ referrals: initialReferrals, patients, providers }: Props) {
  const [referrals, setReferrals] = useState(initialReferrals);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [patientQuery, setPatientQuery] = useState("");
  const [form, setForm] = useState<FormState>(getEmptyForm());
  const [toast, setToast] = useState<ToastState | null>(null);
  const [saving, setSaving] = useState(false);

  const filteredReferrals = useMemo(() => {
    if (statusFilter === "all") {
      return referrals;
    }
    return referrals.filter((referral) => referral.status === statusFilter);
  }, [referrals, statusFilter]);

  const filteredPatients = useMemo(() => {
    const query = patientQuery.trim().toLowerCase();
    if (!query) {
      return patients;
    }
    return patients.filter((patient) => patient.name.toLowerCase().includes(query));
  }, [patientQuery, patients]);

  const filteredProviders = useMemo(() => {
    return providers.filter((provider) => provider.specialtyKey === form.referredToSpecialty);
  }, [form.referredToSpecialty, providers]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = referralPayloadSchema.safeParse({
      patientId: form.patientId,
      referredToSpecialty: form.referredToSpecialty,
      referredToProviderId: form.referredToProviderId || null,
      reason: form.reason.trim(),
      urgency: form.urgency,
      clinicalNotes: form.clinicalNotes.trim() || null,
    });

    if (!payload.success) {
      setToast({ message: payload.error.issues[0]?.message ?? "Unable to create this referral.", variant: "error" });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/provider/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload.data),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to create this referral.");
      }

      setReferrals((current) => [data.referral as ProviderReferralListItem, ...current]);
      setForm(getEmptyForm());
      setPatientQuery("");
      setToast({ message: "Referral created and patient notified.", variant: "success" });
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "Unable to create this referral.", variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {toast ? <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} /> : null}
      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Card className="space-y-5 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-[var(--rose-700)]">Referral queue</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Specialist handoffs</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">Track every referral you have created and watch patients move toward the right next specialist.</p>
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              className="h-11 rounded-full border border-[var(--border)] bg-white px-4 text-sm outline-none transition focus:border-[var(--rose-300)]"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {filteredReferrals.length ? (
            <div className="space-y-3">
              {filteredReferrals.map((referral) => (
                <div key={referral.id} className="rounded-[24px] border border-[var(--border)] bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar src={referral.patientAvatarUrl ?? undefined} name={referral.patientName} size="md" />
                      <div>
                        <p className="font-semibold text-[var(--foreground)]">{referral.patientName}</p>
                        <p className="text-sm text-[var(--foreground-muted)]">
                          Referred to {referral.referredToSpecialty}
                          {referral.referredToProviderName ? ` - ${referral.referredToProviderName}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={getUrgencyVariant(referral.urgency)}>{titleCase(referral.urgency)}</Badge>
                      <Badge variant={getStatusVariant(referral.status)}>{titleCase(referral.status)}</Badge>
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--foreground-muted)]">{referral.reason}</p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--foreground-muted)]">
                    <span>{formatDate(referral.createdAt)}</span>
                    <Link href={`/provider/patients/${referral.patientId}`} className="inline-flex items-center gap-2 font-medium text-[var(--rose-600)] transition hover:text-[var(--rose-700)]">
                      View patient
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-[var(--border)] px-5 py-10 text-center">
              <Stethoscope className="mx-auto h-8 w-8 text-[var(--teal-700)]" />
              <h3 className="mt-4 text-xl font-semibold tracking-tight">No referrals yet</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">Create your first referral for a patient.</p>
            </div>
          )}
        </Card>

        <Card className="space-y-6 p-5 sm:p-6">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-[var(--rose-700)]">Create referral</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Connect a patient to the right specialist</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">Choose a patient from your roster, set the specialty handoff, and share the clinical context for the next provider.</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4 rounded-[24px] border border-[var(--border)] p-5">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-[var(--rose-700)]">Patient</p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight">Select from your roster</h3>
              </div>
              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={patientQuery}
                  onChange={(event) => setPatientQuery(event.target.value)}
                  placeholder="Search by patient name"
                  className="h-12 w-full rounded-2xl border border-[var(--border)] bg-white pl-11 pr-4 outline-none transition focus:border-[var(--rose-300)] focus:ring-2 focus:ring-[rgba(212,88,123,0.14)]"
                />
              </label>
              <div className="grid max-h-72 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
                {filteredPatients.map((patient) => {
                  const isSelected = form.patientId === patient.id;
                  return (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, patientId: patient.id }))}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-[22px] border p-4 text-left transition",
                        isSelected ? "border-[var(--rose-300)] bg-[var(--rose-50)]/55" : "border-[var(--border)] hover:bg-[var(--slate-50)]",
                      )}
                    >
                      <Avatar src={patient.avatarUrl ?? undefined} name={patient.name} size="md" />
                      <div>
                        <p className="font-medium text-[var(--foreground)]">{patient.name}</p>
                        <p className="text-sm text-[var(--foreground-muted)]">Last visit {formatDate(patient.lastVisit)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 rounded-[24px] border border-[var(--border)] p-5 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-[var(--foreground)]">
                <span>Referred to specialty</span>
                <select
                  value={form.referredToSpecialty}
                  onChange={(event) => setForm((current) => ({ ...current, referredToSpecialty: event.target.value as FormState["referredToSpecialty"], referredToProviderId: "" }))}
                  className="h-12 w-full rounded-2xl border border-[var(--border)] bg-white px-4 outline-none transition focus:border-[var(--rose-300)]"
                >
                  {referralSpecialties.map((specialty) => (
                    <option key={specialty} value={specialty}>{formatReferralSpecialty(specialty)}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium text-[var(--foreground)]">
                <span>Specific provider (optional)</span>
                <select
                  value={form.referredToProviderId}
                  onChange={(event) => setForm((current) => ({ ...current, referredToProviderId: event.target.value }))}
                  className="h-12 w-full rounded-2xl border border-[var(--border)] bg-white px-4 outline-none transition focus:border-[var(--rose-300)]"
                >
                  <option value="">Match with any available provider</option>
                  {filteredProviders.map((provider) => (
                    <option key={provider.id} value={provider.id}>{provider.name}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium text-[var(--foreground)] md:col-span-2">
                <span>Reason</span>
                <textarea
                  value={form.reason}
                  onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
                  rows={4}
                  placeholder="Clinical reason for referral..."
                  className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--rose-300)]"
                />
              </label>
              <div className="space-y-3 md:col-span-2">
                <span className="text-sm font-medium text-[var(--foreground)]">Urgency</span>
                <div className="flex flex-wrap gap-3">
                  {urgencyOptions.map((option) => {
                    const isActive = form.urgency === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setForm((current) => ({ ...current, urgency: option.value }))}
                        className={cn(
                          "rounded-full border px-4 py-2 text-sm font-medium transition",
                          isActive ? "border-transparent bg-[var(--rose-500)] text-white" : option.tone,
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                {form.urgency === "emergency" ? (
                  <div className="flex items-start gap-3 rounded-[22px] border border-[rgba(212,88,123,0.18)] bg-[rgba(212,88,123,0.08)] px-4 py-3 text-sm text-[var(--rose-700)]">
                    <CircleAlert className="mt-0.5 h-4 w-4" />
                    <p>For life-threatening emergencies, call 911.</p>
                  </div>
                ) : null}
              </div>
              <label className="space-y-2 text-sm font-medium text-[var(--foreground)] md:col-span-2">
                <span>Clinical notes (optional)</span>
                <textarea
                  value={form.clinicalNotes}
                  onChange={(event) => setForm((current) => ({ ...current, clinicalNotes: event.target.value }))}
                  rows={3}
                  placeholder="Additional context for the receiving provider"
                  className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--rose-300)]"
                />
              </label>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="text-sm text-[var(--foreground-muted)]">
                {form.urgency === "emergency" ? (
                  <span className="inline-flex items-center gap-2 text-[var(--rose-700)]"><AlertTriangle className="h-4 w-4" />Emergency referrals should still follow emergency care protocols.</span>
                ) : (
                  <span>Patients will be notified as soon as you submit the referral.</span>
                )}
              </div>
              <Button type="submit" className="rounded-xl px-6" disabled={saving}>
                {saving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create referral
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
