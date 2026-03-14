import Link from "next/link";
import {
  Building2,
  Calendar,
  HeartHandshake,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  MessagesSquare,
  NotebookTabs,
  Settings2,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";
import { cn } from "@/lib/utils";

export function DashboardShell({
  title,
  eyebrow,
  children,
  section = "patient",
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
  section?: "patient" | "provider" | "employer" | "clinic" | "super" | "partner";
}) {
  const navBySection = {
    patient: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/appointments", label: "Appointments", icon: Calendar },
      { href: "/symptoms", label: "Symptoms", icon: HeartPulse },
      { href: "/cycle", label: "Cycle", icon: Sparkles },
      { href: "/records", label: "Records", icon: NotebookTabs },
      { href: "/messages", label: "Messages", icon: MessagesSquare },
    ],
    provider: [
      { href: "/provider/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/provider/patients", label: "Patients", icon: UserRound },
      { href: "/provider/schedule", label: "Schedule", icon: Calendar },
      { href: "/provider/messages", label: "Messages", icon: MessagesSquare },
    ],
    employer: [
      { href: "/employer/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/employer/analytics", label: "Analytics", icon: Sparkles },
    ],
    clinic: [
      { href: "/clinic/dashboard", label: "Dashboard", icon: ShieldCheck },
      { href: "/provider/dashboard", label: "Provider Ops", icon: UserRound },
      { href: "/register/provider", label: "Invite Flow", icon: Building2 },
    ],
    super: [
      { href: "/super/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/super/employers", label: "Employers", icon: Building2 },
      { href: "/super/system", label: "System", icon: Settings2 },
    ],
    partner: [
      { href: "/partner", label: "Shared Care", icon: HeartHandshake },
      { href: "/partner/appointments", label: "Appointments", icon: Calendar },
      { href: "/partner/pregnancy", label: "Pregnancy", icon: Sparkles },
    ],
  } as const;

  return (
    <div className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-[30px] border border-[var(--border)] bg-white/80 p-5 shadow-[0_16px_40px_rgba(25,22,17,0.05)] backdrop-blur">
          <div className="mb-8">
            <p className="font-display text-3xl">Maven Clinic</p>
            <p className="text-sm text-[var(--foreground-muted)]">Warm, connected care</p>
          </div>
          <nav className="space-y-2">
            {navBySection[section].map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-[var(--foreground-muted)] transition hover:bg-[var(--slate-50)] hover:text-[var(--foreground)]",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
          <form action={logoutAction} className="mt-8">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-[var(--foreground-muted)] transition hover:bg-[var(--slate-50)] hover:text-[var(--foreground)]"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </aside>
        <div className="rounded-[30px] border border-[var(--border)] bg-white/72 p-5 shadow-[0_16px_40px_rgba(25,22,17,0.05)] backdrop-blur sm:p-8">
          <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-[var(--rose-700)]">{eyebrow}</p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight">{title}</h1>
            </div>
          </header>
          {children}
        </div>
      </div>
    </div>
  );
}
