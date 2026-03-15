import type { Route } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function PartnerAccessChip({ label, granted }: { label: string; granted: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        granted ? "bg-[rgba(61,191,173,0.14)] text-[var(--teal-700)]" : "bg-slate-100 text-slate-500",
      )}
    >
      {label}
    </span>
  );
}

export function PartnerAccessDeniedCard({ patientName, area }: { patientName: string; area: string }) {
  return (
    <Card className="border-[rgba(232,125,155,0.18)] bg-[rgba(255,247,248,0.92)]">
      <p className="text-sm uppercase tracking-[0.22em] text-[var(--rose-700)]">Access required</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight">You do not have access to view {area}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--foreground-muted)]">
        {patientName} can grant this access from their settings whenever they are ready.
      </p>
    </Card>
  );
}

export function PartnerEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card className="text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(61,191,173,0.12)] text-[var(--teal-700)]">
        <ShieldCheck className="h-5 w-5" />
      </div>
      <h2 className="mt-4 text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[var(--foreground-muted)]">{description}</p>
    </Card>
  );
}

export function PartnerResourceCard({ title, description, href, source }: { title: string; description: string; href: string; source: string }) {
  return (
    <Card className="flex h-full flex-col justify-between">
      <div>
        <p className="text-sm uppercase tracking-[0.22em] text-[var(--teal-700)]">{source}</p>
        <h3 className="mt-2 text-xl font-semibold tracking-tight">{title}</h3>
        <p className="mt-3 text-sm leading-7 text-[var(--foreground-muted)]">{description}</p>
      </div>
      <Link href={href as Route} target="_blank" className="mt-5 text-sm font-medium text-[var(--rose-700)] underline decoration-[rgba(232,125,155,0.35)] underline-offset-4">
        Open resource
      </Link>
    </Card>
  );
}
