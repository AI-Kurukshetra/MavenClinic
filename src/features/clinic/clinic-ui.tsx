"use client";

import { Search } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function ClinicSubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="h-10 rounded-xl px-4" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

export function ClinicEmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[24px] border border-dashed border-[var(--border)] bg-[var(--slate-50)] px-6 py-10 text-center">
      <p className="text-lg font-semibold tracking-tight">{title}</p>
      <p className="mt-2 text-sm leading-7 text-[var(--foreground-muted)]">{body}</p>
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="flex h-11 items-center gap-3 rounded-xl border border-[var(--border)] bg-white px-4 text-sm text-[var(--foreground-muted)]">
      <Search className="h-4 w-4" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-[var(--foreground)] outline-none placeholder:text-slate-400"
      />
    </label>
  );
}

export function ProviderStatusBadge({ status }: { status: "Active and accepting" | "Inactive" | "Pending approval" | "Suspended" }) {
  const className = status === "Active and accepting"
    ? "bg-[rgba(61,191,173,0.12)] text-[var(--teal-700)]"
    : status === "Pending approval"
      ? "bg-[rgba(245,158,11,0.12)] text-amber-600"
      : status === "Suspended"
        ? "bg-[rgba(212,88,123,0.12)] text-[var(--rose-700)]"
        : "bg-[rgba(148,163,184,0.14)] text-slate-600";

  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${className}`}>{status}</span>;
}

export function InvitationStatusBadge({ status }: { status: "accepted" | "pending" | "expired" }) {
  const className = status === "accepted"
    ? "bg-[rgba(61,191,173,0.12)] text-[var(--teal-700)]"
    : status === "expired"
      ? "bg-[rgba(212,88,123,0.12)] text-[var(--rose-700)]"
      : "bg-[rgba(245,158,11,0.12)] text-amber-600";

  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize ${className}`}>{status}</span>;
}

export function NotificationTypeBadge({ type }: { type: string }) {
  const normalized = type.toLowerCase();
  const className = normalized.includes("appointment")
    ? "bg-[rgba(61,191,173,0.12)] text-[var(--teal-700)]"
    : normalized.includes("message")
      ? "bg-[rgba(245,158,11,0.12)] text-amber-600"
      : "bg-[rgba(212,88,123,0.12)] text-[var(--rose-700)]";

  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${className}`}>{type}</span>;
}

