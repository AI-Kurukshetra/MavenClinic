import { ArrowRight, ChartLine, Sparkles, Stethoscope } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ScrollReveal } from "@/components/landing/scroll-reveal";

const steps = [
  {
    number: "01",
    title: "Tell us about you",
    description:
      "Complete a 5-minute health profile. We match you with specialists who understand your unique health journey, goals, and preferences.",
    icon: Sparkles,
  },
  {
    number: "02",
    title: "Meet your care team",
    description:
      "Browse verified OB/GYNs, fertility specialists, mental health providers, and nutritionists. Book same-day video visits or message anytime.",
    icon: Stethoscope,
  },
  {
    number: "03",
    title: "Stay ahead of your health",
    description:
      "Track your cycle, symptoms, and wellbeing. Get AI-powered insights and personalized care plans that evolve with you.",
    icon: ChartLine,
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="px-5 py-24 sm:px-6 lg:px-10 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal className="max-w-2xl text-center lg:text-left">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-[var(--rose-700)]">Your care, your way</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Everything you need in one place</h2>
        </ScrollReveal>

        <div className="relative mt-14 grid gap-6 lg:grid-cols-3 lg:gap-7">
          <div className="pointer-events-none absolute left-[16.5%] right-[16.5%] top-[6.2rem] hidden border-t border-dashed border-[rgba(232,125,155,0.32)] lg:block" />
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <ScrollReveal key={step.title} delayMs={index * 90}>
                <Card className="relative h-full rounded-[32px] border-white/70 p-7 sm:p-8">
                  {index < steps.length - 1 ? <ArrowRight className="absolute -right-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 text-[var(--rose-300)] lg:block" /> : null}
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(232,125,155,0.12)] text-[var(--rose-700)]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="mt-7 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--rose-100)] text-base font-semibold text-[var(--rose-700)]">
                    {step.number}
                  </div>
                  <h3 className="mt-6 text-[1.3rem] font-semibold">{step.title}</h3>
                  <p className="mt-4 text-base leading-7 text-[var(--foreground-muted)]">{step.description}</p>
                </Card>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
