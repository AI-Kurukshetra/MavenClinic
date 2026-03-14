import Link from "next/link";
import { ArrowRight, Baby, Brain, HeartPulse, Leaf, Sparkles, Sun } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ScrollReveal } from "@/components/landing/scroll-reveal";

const specialties = [
  { title: "OB/GYN", description: "Reproductive health, annual exams, and preventive care", icon: HeartPulse },
  { title: "Fertility", description: "IVF guidance, cycle optimization, and conception support", icon: Sparkles },
  { title: "Mental Health", description: "Therapy, anxiety support, and perinatal mental health", icon: Brain },
  { title: "Menopause", description: "Hormone therapy, symptom management, and midlife wellness", icon: Sun },
  { title: "Nutrition", description: "Hormonal nutrition, fertility diet, and prenatal planning", icon: Leaf },
  { title: "Lactation", description: "Breastfeeding support and postpartum guidance", icon: Baby },
];

export function SpecialtiesSection() {
  return (
    <section id="providers" className="px-5 py-24 sm:px-6 lg:px-10 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-[var(--rose-700)]">Specialists for every stage</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
            From your first period to menopause - and every milestone in between
          </h2>
        </ScrollReveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {specialties.map((specialty, index) => {
            const Icon = specialty.icon;
            return (
              <ScrollReveal key={specialty.title} delayMs={index * 70}>
                <Card className="group h-full rounded-[30px] border-white/70 p-7 transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(29,24,17,0.1)]">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(232,125,155,0.1)] text-[var(--rose-500)] transition group-hover:bg-[rgba(232,125,155,0.16)]">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold">{specialty.title}</h3>
                  <p className="mt-3 max-w-xs text-base leading-7 text-[var(--foreground-muted)]">{specialty.description}</p>
                  <Link href="/signup" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[var(--rose-700)]">
                    Book now <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </Link>
                </Card>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
