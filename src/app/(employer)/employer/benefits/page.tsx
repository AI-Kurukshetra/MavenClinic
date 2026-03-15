import { Settings2, ShieldCheck, SlidersHorizontal, Wallet } from "lucide-react";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { Card } from "@/components/ui/card";

const benefitCards = [
  {
    title: "Coverage settings",
    description: "Define which care journeys, visit categories, and family support pathways are available to employees.",
    icon: ShieldCheck,
    accentClass: "bg-[rgba(61,191,173,0.12)] text-[var(--teal-700)]",
  },
  {
    title: "Specialty access",
    description: "Control which specialties are included in-plan, referral rules, and employer-sponsored navigation support.",
    icon: Settings2,
    accentClass: "bg-[rgba(212,88,123,0.12)] text-[var(--rose-700)]",
  },
  {
    title: "Visit limits",
    description: "Set annual visit allowances and category-based utilization guidance for covered employees.",
    icon: SlidersHorizontal,
    accentClass: "bg-[rgba(61,191,173,0.12)] text-[var(--teal-700)]",
  },
  {
    title: "Co-pay settings",
    description: "Configure employee cost-sharing, employer subsidies, and billing rules for virtual visits.",
    icon: Wallet,
    accentClass: "bg-[rgba(212,88,123,0.12)] text-[var(--rose-700)]",
  },
] as const;

export default function EmployerBenefitsPage() {
  return (
    <DashboardShell title="Benefits" eyebrow="Benefits administration" section="employer">
      <div className="space-y-6">
        <Card className="p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--rose-700)]">Benefits configuration</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Benefits configuration</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--foreground-muted)]">
            Configure which Maven Clinic services are available to your employees.
          </p>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {benefitCards.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`rounded-2xl p-3 ${item.accentClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.22em] text-[var(--foreground-muted)]">Coming soon</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[var(--foreground-muted)]">{item.description}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardShell>
  );
}
