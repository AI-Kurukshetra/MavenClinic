import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ScrollReveal } from "@/components/landing/scroll-reveal";
import { EmployerMiniCharts } from "@/components/landing/employer-mini-charts";

const metrics = [
  { value: "3.2x", label: "ROI vs traditional health plans" },
  { value: "87%", label: "employee satisfaction rate" },
  { value: "40%", label: "reduction in ER visits for covered conditions" },
];

export function EmployersSection() {
  return (
    <section id="employers" className="bg-[rgba(255,241,244,0.72)] px-5 py-24 sm:px-6 lg:px-10 lg:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16">
        <ScrollReveal>
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(232,125,155,0.18)] bg-white/75 px-4 py-2 text-sm font-medium text-[var(--rose-700)]">
            <span>For HR &amp; Benefits Teams</span>
          </div>
          <h2 className="mt-6 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
            The benefit your
            <br />
            team actually uses
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--foreground-muted)]">
            Maven Clinic integrates with your existing benefits stack. Track utilization, measure outcomes, and
            demonstrate ROI - while your employees get the specialized care they deserve.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3 sm:gap-5">
            {metrics.map((metric) => (
              <div key={metric.label}>
                <p className="font-display text-3xl text-[var(--rose-500)]">{metric.value}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">{metric.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register/employer"
              className="inline-flex h-[3.25rem] items-center justify-center rounded-full bg-[var(--rose-500)] px-6 text-base font-medium text-white shadow-[0_16px_36px_rgba(212,88,123,0.28)] transition hover:bg-[var(--rose-600)]"
            >
              Request a demo
            </Link>
            <Link href="/pricing" className="inline-flex h-[3.25rem] items-center justify-center rounded-full px-2 text-base font-medium text-[var(--foreground)] underline underline-offset-4 transition hover:text-[var(--rose-700)]">
              View pricing <span className="ml-1">-&gt;</span>
            </Link>
          </div>
        </ScrollReveal>

        <ScrollReveal delayMs={100}>
          <Card className="rounded-[34px] border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(250,250,248,0.92))] p-5 sm:p-6">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Employer dashboard</p>
                <h3 className="mt-2 text-2xl font-semibold">Benefits performance</h3>
              </div>
              <div className="rounded-[24px] bg-[var(--rose-50)] px-4 py-3 text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Covered employees</p>
                <p className="mt-1 text-xl font-semibold">2,500</p>
              </div>
            </div>
            <EmployerMiniCharts />
          </Card>
        </ScrollReveal>
      </div>
    </section>
  );
}

