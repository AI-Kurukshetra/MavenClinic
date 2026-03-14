import { Star } from "lucide-react";
import { ScrollReveal } from "@/components/landing/scroll-reveal";
import { Card } from "@/components/ui/card";

const testimonials = [
  {
    quote:
      "I finally felt heard. My provider spent 45 minutes understanding my PCOS history before suggesting anything. That never happens at a regular clinic.",
    name: "Sarah M.",
    context: "PCOS management",
    provider: "Saw Dr. Chen",
  },
  {
    quote:
      "The cycle tracking + AI insights helped me understand my fertile window in a way no app ever explained. We conceived within 3 months.",
    name: "Priya K.",
    context: "Fertility journey",
    provider: "Saw Dr. Osei",
  },
  {
    quote:
      "As someone going through perimenopause, finding a specialist who takes it seriously changed everything. Same-day appointments are a game changer.",
    name: "Maria R.",
    context: "Menopause support",
    provider: "Saw Dr. Rodriguez",
  },
];

export function TestimonialsSection() {
  return (
    <section className="px-5 py-24 sm:px-6 lg:px-10 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-[var(--rose-700)]">Patient stories</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
            Care that feels personal from the first visit
          </h2>
        </ScrollReveal>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <ScrollReveal key={testimonial.name} delayMs={index * 90}>
              <Card className="h-full rounded-[30px] border-white/70 p-7 shadow-[0_20px_60px_rgba(25,22,17,0.05)]">
                <div className="flex items-center gap-1 text-[var(--rose-500)]">
                  {Array.from({ length: 5 }).map((_, starIndex) => (
                    <Star key={starIndex} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mt-5 text-base leading-8 text-[var(--foreground-muted)]">
                  <span className="italic">&ldquo;{testimonial.quote}&rdquo;</span>
                </p>
                <div className="mt-8 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(232,125,155,0.16)] font-semibold text-[var(--rose-700)]">
                    {testimonial.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")}
                  </div>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-[var(--foreground-muted)]">
                      {testimonial.context} - {testimonial.provider}
                    </p>
                  </div>
                </div>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
