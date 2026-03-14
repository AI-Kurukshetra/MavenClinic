import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { ScrollReveal } from "@/components/landing/scroll-reveal";
import { InsightTyping } from "@/components/landing/insight-typing";

const bullets = [
  "Detects patterns across your cycle and symptoms",
  "Flags when you should speak to a provider",
  "Never diagnoses - always empowers",
];

export function AiIntelligenceSection() {
  return (
    <section className="bg-slate-900 px-5 py-24 text-white sm:px-6 lg:px-10 lg:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
        <ScrollReveal>
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(61,191,173,0.28)] bg-[rgba(61,191,173,0.12)] px-4 py-2 text-sm font-medium text-[var(--teal-400)]">
            <Sparkles className="h-4 w-4" />
            <span>Powered by Claude AI</span>
          </div>
          <h2 className="font-display mt-6 text-4xl leading-[1.02] tracking-[-0.04em] text-white sm:text-5xl">
            Health insights that
            <br />
            actually make sense
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
            Our AI analyzes your symptom patterns, cycle data, and health history to surface personalized insights -
            not generic advice. Always within clinical guardrails, always warm.
          </p>
          <div className="mt-8 space-y-4">
            {bullets.map((bullet) => (
              <div key={bullet} className="flex items-start gap-3 text-slate-200">
                <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(61,191,173,0.14)] text-[var(--teal-400)]">
                  <Check className="h-4 w-4" />
                </span>
                <span>{bullet}</span>
              </div>
            ))}
          </div>
          <div className="mt-9">
            <Link
              href="/signup"
              className="inline-flex h-[3.25rem] items-center justify-center rounded-full bg-[var(--teal-400)] px-6 text-base font-medium text-slate-950 shadow-[0_16px_36px_rgba(61,191,173,0.22)] transition hover:bg-[var(--teal-500)]"
            >
              See your insights <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </ScrollReveal>

        <ScrollReveal delayMs={120} className="relative">
          <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 animate-[landing-pulse_8s_ease-in-out_infinite] rounded-full bg-[radial-gradient(circle,rgba(61,191,173,0.22),transparent_58%)] blur-3xl" />
          <div className="mx-auto max-w-md rounded-[40px] border border-white/10 bg-[linear-gradient(180deg,rgba(21,28,41,0.96),rgba(9,14,24,0.96))] p-4 shadow-[0_45px_130px_rgba(0,0,0,0.45)]">
            <div className="rounded-[34px] border border-white/8 bg-[linear-gradient(180deg,rgba(10,18,28,0.96),rgba(17,24,39,0.96))] p-4 sm:p-5">
              <div className="animate-[landing-float_7s_ease-in-out_infinite] mx-auto w-full max-w-[18rem] rounded-[32px] border border-white/8 bg-[linear-gradient(180deg,rgba(15,23,42,1),rgba(15,23,42,0.94))] p-4 shadow-[0_25px_90px_rgba(8,145,178,0.16)]">
                <div className="flex items-center gap-3 text-[var(--teal-400)]">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(61,191,173,0.14)]">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-200">Your Health Insight</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Live analysis</p>
                  </div>
                </div>
                <div className="mt-6 rounded-[24px] border border-white/8 bg-[rgba(15,23,42,0.68)] p-4">
                  <InsightTyping />
                </div>
                <div className="mt-4 rounded-[22px] border border-white/8 bg-[rgba(255,255,255,0.03)] p-3 text-sm text-slate-300">
                  Next recommended step: share this pattern with your provider before your next visit.
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
