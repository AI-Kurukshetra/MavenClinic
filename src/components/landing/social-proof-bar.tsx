import { Star } from "lucide-react";
import { ScrollReveal } from "@/components/landing/scroll-reveal";

const stats = [
  { value: "500+", label: "Providers" },
  { value: "50,000+", label: "Patients" },
  { value: "200+", label: "Employer Partners" },
  { value: "4.9", label: "Average Rating", rating: true },
  { value: "Same-day", label: "Availability" },
];

export function SocialProofBar() {
  return (
    <section className="border-y border-[var(--border)] bg-[rgba(248,247,245,0.88)] px-5 py-8 sm:px-6 lg:px-10">
      <ScrollReveal className="mx-auto max-w-7xl">
        <div className="grid gap-5 text-center sm:grid-cols-2 lg:grid-cols-5 lg:gap-0">
          {stats.map((item, index) => (
            <div key={item.label} className="relative px-4 lg:px-8">
              {index > 0 ? <div className="absolute left-0 top-1/2 hidden h-10 w-px -translate-y-1/2 bg-[var(--slate-100)] lg:block" /> : null}
              <p className="font-display flex items-center justify-center gap-1 text-3xl text-[var(--rose-500)] sm:text-[1.75rem]">
                <span>{item.value}</span>
                {"rating" in item ? <Star className="h-4 w-4 fill-current" /> : null}
              </p>
              <p className="mt-1 text-sm text-[var(--foreground-muted)]">{item.label}</p>
            </div>
          ))}
        </div>
      </ScrollReveal>
    </section>
  );
}
