import type { Route } from "next";
import Link from "next/link";
import { Calendar, HeartHandshake, Sparkles } from "lucide-react";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const partnerFlows = [
  {
    href: "/partner/appointments" as Route,
    title: "Appointment visibility",
    description: "Review shared appointment details and stay aligned on upcoming care moments.",
    cta: "Open appointments",
    icon: Calendar,
  },
  {
    href: "/partner/pregnancy" as Route,
    title: "Pregnancy support",
    description: "Access shared milestone visibility and patient-approved pregnancy updates in one place.",
    cta: "Open pregnancy view",
    icon: Sparkles,
  },
];

export default function PartnerAccessPage() {
  return (
    <DashboardShell title="Partner dashboard" eyebrow="Shared care" section="partner">
      <Card>
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-[rgba(61,191,173,0.12)] p-3 text-[var(--teal-700)]">
            <HeartHandshake className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold">Read-only shared care access</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--foreground-muted)]">
              Partner accounts remain limited to patient-approved visibility. Use the workflow cards below to move into shared appointments and pregnancy support views.
            </p>
          </div>
        </div>
      </Card>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {partnerFlows.map(({ href, title, description, cta, icon: Icon }) => (
          <Card key={href}>
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-[rgba(232,125,155,0.12)] p-3 text-[var(--rose-700)]">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold">{title}</h2>
                <p className="mt-2 text-sm leading-7 text-[var(--foreground-muted)]">{description}</p>
                <Link href={href} className="mt-4 inline-block">
                  <Button>{cta}</Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}