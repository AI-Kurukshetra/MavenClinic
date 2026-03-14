import type { Route } from "next";
import Link from "next/link";
import { BarChart3, Building2, Settings2, ShieldCheck } from "lucide-react";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";

const workflows = [
  {
    href: "/super/employers" as Route,
    title: "Employer oversight",
    description: "Review contracts, account health, and renewal readiness across sponsoring employers.",
    cta: "Open employers",
    icon: Building2,
  },
  {
    href: "/super/system" as Route,
    title: "System controls",
    description: "Track feature flags, policy rollout status, and operational controls from one place.",
    cta: "Open system",
    icon: Settings2,
  },
];

export default function SuperAdminDashboardPage() {
  return (
    <DashboardShell title="Super admin dashboard" eyebrow="Platform control" section="super">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Clinic teams" value="12" delta="2 pending access reviews" icon={ShieldCheck} />
        <StatCard title="Employer groups" value="18" delta="3 renewals this quarter" icon={Building2} />
        <StatCard title="Platform pulse" value="99.94%" delta="Services healthy today" icon={BarChart3} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {workflows.map(({ href, title, description, cta, icon: Icon }) => (
          <Card key={href}>
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-[rgba(61,191,173,0.12)] p-3 text-[var(--teal-700)]">
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