import type { ReactNode } from "react";
import type { Route } from "next";
import Link from "next/link";
import { ArrowRight, Clock3, ShieldCheck } from "lucide-react";
import { FooterSection } from "@/components/landing/footer-section";
import { LandingNav } from "@/components/landing/landing-nav";

type TocItem = {
  id: string;
  label: string;
};

type QuickFact = {
  label: string;
  value: string;
};

type Cta = {
  href: Route;
  label: string;
  variant?: "primary" | "secondary";
};

type PublicPageShellProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  lastUpdated?: string;
  toc: TocItem[];
  quickFacts?: QuickFact[];
  ctas?: Cta[];
  aside?: ReactNode;
  children: ReactNode;
};

export function PublicPageShell({
  eyebrow,
  title,
  subtitle,
  lastUpdated,
  toc,
  quickFacts = [],
  ctas = [],
  aside,
  children,
}: PublicPageShellProps) {
  return (
    <>
      <LandingNav />
      <main className="landing-mesh relative overflow-hidden bg-[#FAFAF8] pb-20 pt-28 text-[var(--foreground)] sm:pt-32">
        <section className="px-5 sm:px-6 lg:px-10">
          <div className="mx-auto grid max-w-7xl gap-10 rounded-[36px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(250,250,248,0.9))] px-6 py-10 shadow-[0_30px_90px_rgba(25,22,17,0.08)] backdrop-blur-xl sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:px-12 lg:py-14">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(232,125,155,0.18)] bg-[var(--rose-50)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--rose-700)]">
                <ShieldCheck className="h-4 w-4" />
                {eyebrow}
              </span>
              <h1 className="mt-6 max-w-3xl font-display text-4xl leading-tight tracking-[-0.04em] text-[var(--foreground)] sm:text-5xl lg:text-6xl">
                {title}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--foreground-muted)] sm:text-lg">{subtitle}</p>

              <div className="mt-8 flex flex-wrap gap-3">
                {ctas.map((cta) => (
                  <Link
                    key={cta.href + cta.label}
                    href={cta.href}
                    className={
                      cta.variant === "secondary"
                        ? "inline-flex h-[3.25rem] items-center justify-center rounded-full border border-[var(--border)] bg-white px-6 text-base font-medium text-[var(--foreground)] transition hover:border-[var(--border-strong)] hover:text-[var(--rose-700)]"
                        : "inline-flex h-[3.25rem] items-center justify-center rounded-full bg-[var(--rose-500)] px-6 text-base font-medium text-white shadow-[0_16px_36px_rgba(212,88,123,0.28)] transition hover:bg-[var(--rose-600)]"
                    }
                  >
                    {cta.label}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                ))}
              </div>
            </div>

            <div className="space-y-4 rounded-[30px] border border-[var(--border)] bg-white/88 p-6 shadow-[0_20px_50px_rgba(25,22,17,0.05)]">
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--foreground-muted)]">
                <Clock3 className="h-4 w-4 text-[var(--rose-600)]" />
                <span>{lastUpdated ? `Last updated ${lastUpdated}` : "Public information page"}</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {quickFacts.map((fact) => (
                  <div key={fact.label} className="rounded-2xl border border-[var(--border)] bg-[var(--slate-50)] px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--foreground-muted)]">{fact.label}</p>
                    <p className="mt-2 text-base font-semibold text-[var(--foreground)]">{fact.value}</p>
                  </div>
                ))}
              </div>
              {aside ? <div className="rounded-[24px] bg-[var(--teal-50)] p-5">{aside}</div> : null}
            </div>
          </div>
        </section>

        <section className="px-5 pt-10 sm:px-6 lg:px-10 lg:pt-14">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-10">
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-[28px] border border-[var(--border)] bg-white/90 p-5 shadow-[0_18px_44px_rgba(25,22,17,0.05)] backdrop-blur-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--foreground-muted)]">On this page</p>
                <nav className="mt-4 space-y-1.5">
                  {toc.map((item) => (
                    <Link
                      key={item.id}
                      href={`#${item.id}` as Route}
                      className="block rounded-2xl px-3 py-2 text-sm text-[var(--foreground-muted)] transition hover:bg-[var(--rose-50)] hover:text-[var(--rose-700)]"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </aside>

            <div className="space-y-6">{children}</div>
          </div>
        </section>

        <div className="mt-16">
          <FooterSection />
        </div>
      </main>
    </>
  );
}

type PublicSectionProps = {
  id: string;
  title: string;
  lead?: string;
  children: ReactNode;
};

export function PublicSection({ id, title, lead, children }: PublicSectionProps) {
  return (
    <section id={id} className="scroll-mt-28 rounded-[32px] border border-[var(--border)] bg-white/92 p-6 shadow-[0_24px_60px_rgba(25,22,17,0.05)] sm:p-8">
      <div className="max-w-4xl">
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--foreground)] sm:text-[2rem]">{title}</h2>
        {lead ? <p className="mt-3 text-base leading-8 text-[var(--foreground-muted)]">{lead}</p> : null}
        <div className="mt-6 space-y-6 text-[15px] leading-7 text-[var(--foreground-muted)]">{children}</div>
      </div>
    </section>
  );
}

export function PublicGrid({
  children,
  columns = "two",
}: {
  children: ReactNode;
  columns?: "two" | "three";
}) {
  return <div className={columns === "three" ? "grid gap-4 lg:grid-cols-3" : "grid gap-4 lg:grid-cols-2"}>{children}</div>;
}

export function PublicInsetCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-[var(--border)] bg-[var(--slate-50)] p-5">
      <h3 className="text-base font-semibold text-[var(--foreground)]">{title}</h3>
      <div className="mt-3 space-y-3 text-sm leading-6 text-[var(--foreground-muted)]">{children}</div>
    </div>
  );
}
