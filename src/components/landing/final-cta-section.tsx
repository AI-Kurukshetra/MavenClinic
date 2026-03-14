import Link from "next/link";
import { ScrollReveal } from "@/components/landing/scroll-reveal";

export function FinalCtaSection() {
  return (
    <section className="px-5 py-24 sm:px-6 lg:px-10 lg:py-32">
      <ScrollReveal className="mx-auto max-w-7xl overflow-hidden rounded-[40px] bg-[linear-gradient(135deg,var(--rose-400,#f29ab0)_0%,var(--rose-500)_48%,var(--rose-600)_100%)] px-6 py-14 text-center text-white shadow-[0_40px_120px_rgba(212,88,123,0.24)] sm:px-10 lg:px-16 lg:py-18">
        <h2 className="font-display text-4xl tracking-[-0.04em] text-white sm:text-5xl">
          Your health journey
          <br />
          starts today
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/90">
          Join 50,000+ women who have found their care team on Maven Clinic.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex h-[3.25rem] items-center justify-center rounded-full bg-white px-6 text-base font-medium text-[var(--rose-700)] transition hover:bg-white/92"
          >
            Get started - it is free
          </Link>
          <Link
            href="/register/employer"
            className="inline-flex h-[3.25rem] items-center justify-center rounded-full border border-white/55 px-6 text-base font-medium text-white transition hover:bg-white/10"
          >
            Talk to our team
          </Link>
        </div>
        <p className="mt-5 text-sm text-white/86">No insurance required - HSA/FSA accepted - Cancel anytime</p>
      </ScrollReveal>
    </section>
  );
}
