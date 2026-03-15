"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  Calendar,
  Clock3,
  FileText,
  HeartHandshake,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  MailPlus,
  MessagesSquare,
  NotebookTabs,
  Settings2,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";
import { cn } from "@/lib/utils";

export type DashboardSection = "patient" | "provider" | "employer" | "clinic" | "super" | "partner";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navBySection: Record<DashboardSection, NavItem[]> = {
  patient: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/appointments", label: "Appointments", icon: Calendar },
    { href: "/symptoms", label: "Symptoms", icon: HeartPulse },
    { href: "/cycle", label: "Cycle", icon: Sparkles },
    { href: "/records", label: "Records", icon: NotebookTabs },
    { href: "/referrals", label: "Referrals", icon: HeartHandshake },
    { href: "/messages", label: "Messages", icon: MessagesSquare },
    { href: "/settings", label: "Settings", icon: Settings2 },
  ],
  provider: [
    { href: "/provider/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/provider/patients", label: "Patients", icon: UserRound },
    { href: "/provider/appointments", label: "Appointments", icon: Calendar },
    { href: "/provider/schedule", label: "Schedule", icon: Clock3 },
    { href: "/provider/availability", label: "Availability", icon: Clock3 },
    { href: "/provider/referrals", label: "Referrals", icon: HeartHandshake },
    { href: "/provider/messages", label: "Messages", icon: MessagesSquare },
    { href: "/provider/prescriptions", label: "Prescriptions", icon: NotebookTabs },
    { href: "/provider/labs", label: "Labs", icon: ShieldCheck },
    { href: "/provider/care-plans", label: "Care Plans", icon: NotebookTabs },
    { href: "/provider/earnings", label: "Earnings", icon: Sparkles },
  ],
  employer: [
    { href: "/employer/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/employer/employees", label: "Employees", icon: UserRound },
    { href: "/employer/benefits", label: "Benefits", icon: HeartPulse },
    { href: "/employer/reports", label: "Reports", icon: Sparkles },
    { href: "/employer/billing", label: "Billing", icon: NotebookTabs },
  ],
  clinic: [
    { href: "/clinic/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/clinic/providers", label: "Providers", icon: UserRound },
    { href: "/clinic/invitations", label: "Invitations", icon: MailPlus },
    { href: "/clinic/content", label: "Content", icon: FileText },
    { href: "/clinic/support-groups", label: "Support Groups", icon: Users },
    { href: "/clinic/compliance", label: "Compliance", icon: ShieldCheck },
    { href: "/clinic/care-templates", label: "Care Templates", icon: NotebookTabs },
    { href: "/clinic/analytics", label: "Analytics", icon: BarChart3 },
  ],
  super: [
    { href: "/super/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/super/employers", label: "Employers", icon: Building2 },
    { href: "/super/providers", label: "Providers", icon: UserRound },
    { href: "/super/users", label: "Users", icon: Users },
    { href: "/super/financials", label: "Financials", icon: Sparkles },
    { href: "/super/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/super/system", label: "System", icon: ShieldCheck },
    { href: "/super/settings", label: "Settings", icon: Settings2 },
  ],
  partner: [
    { href: "/partner/dashboard", label: "Shared Care", icon: HeartHandshake },
    { href: "/partner/appointments", label: "Appointments", icon: Calendar },
    { href: "/partner/pregnancy", label: "Pregnancy", icon: Sparkles },
    { href: "/partner/fertility", label: "Fertility", icon: HeartPulse },
    { href: "/partner/messages", label: "Messages", icon: MessagesSquare },
    { href: "/partner/settings", label: "Settings", icon: Settings2 },
  ],
};

function isItemActive(pathname: string, href: string, section: DashboardSection) {
  if (section === "employer") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardSidebar({ section }: { section: DashboardSection }) {
  const pathname = usePathname();

  return (
    <>
      <div className="mb-8">
        <p className="font-display text-3xl">Maven Clinic</p>
        <p className="text-sm text-[var(--foreground-muted)]">Warm, connected care</p>
      </div>
      <nav className="space-y-2">
        {navBySection[section].map(({ href, label, icon: Icon }) => {
          const isActive = isItemActive(pathname, href, section);

          return (
            <Link
              key={href}
              href={href as Route}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                isActive
                  ? "bg-rose-50 text-rose-600 font-medium"
                  : "text-slate-600 hover:bg-slate-50 hover:text-[var(--foreground)]",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <form action={logoutAction} className="mt-8">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-[var(--foreground)]"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </form>
    </>
  );
}
