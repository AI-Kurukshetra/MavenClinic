import Link from "next/link";
import { ArrowRight, Check, MessageSquare, Sparkles, Video } from "lucide-react";
import { ScrollReveal } from "@/components/landing/scroll-reveal";
import { Card } from "@/components/ui/card";

const trustPoints = ["HIPAA compliant", "Covered by 200+ employers", "Available same day"];

export function HeroSection() {
  return (
    <section id="patients" className="landing-mesh relative overflow-hidden px-5 pb-20 pt-28 sm:px-6 sm:pb-24 sm:pt-32 lg:px-10 lg:pb-32 lg:pt-36">
      <div className="mx-auto grid min-h-[calc(100vh-5.5rem)] max-w-7xl items-center gap-14 lg:grid-cols-[minmax(0,1.08fr)_minmax(390px,0.92fr)] lg:gap-16">
        <ScrollReveal className="space-y-8 lg:pr-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(232,125,155,0.16)] bg-white/92 px-4 py-2 text-sm font-medium text-[var(--rose-700)] shadow-[0_14px_32px_rgba(29,24,17,0.05)]">
            <Sparkles className="h-4 w-4" />
            <span>Trusted by 500+ women&apos;s health specialists</span>
          </div>

          <div className="space-y-6">
            <h1 className="font-display max-w-2xl text-[3.4rem] leading-[0.92] tracking-[-0.05em] text-[var(--foreground)] sm:text-[4.2rem] lg:text-[4rem] xl:text-[4.95rem]">
              Your health,
              <br />
              understood.
            </h1>
            <p className="max-w-[30rem] text-lg leading-8 text-[var(--foreground-muted)] sm:text-xl">
              Maven Clinic connects you with OB/GYNs, fertility specialists, and mental health providers who specialize
              in women - from your first cycle to menopause and everything between.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href="/signup"
              className="inline-flex h-14 items-center justify-center rounded-full bg-[var(--rose-500)] px-7 text-base font-medium text-white shadow-[0_16px_36px_rgba(212,88,123,0.28)] transition hover:bg-[var(--rose-600)]"
            >
              Book your first visit
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex h-14 items-center justify-center rounded-full px-2 text-base font-medium text-[var(--foreground)] underline decoration-[var(--rose-300)] underline-offset-4 transition hover:text-[var(--rose-700)]"
            >
              See how it works <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="flex flex-col gap-3 text-sm text-[var(--foreground-muted)] sm:flex-row sm:flex-wrap sm:gap-x-6">
            {trustPoints.map((item) => (
              <div key={item} className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[var(--teal-600)] shadow-sm">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal className="relative" delayMs={120}>
          <div className="absolute inset-x-10 top-12 h-72 rounded-full bg-[radial-gradient(circle,rgba(232,125,155,0.24),transparent_58%)] blur-3xl" />
          <div className="absolute bottom-6 left-8 h-40 w-40 animate-[landing-pulse_8s_ease-in-out_infinite] rounded-full bg-[radial-gradient(circle,rgba(61,191,173,0.24),transparent_62%)] blur-3xl" />

          <div className="relative mx-auto flex w-full max-w-[35rem] justify-center lg:justify-end">
            <div className="landing-card-tilt landing-surface animate-[landing-float-soft_7.2s_ease-in-out_infinite] relative w-full max-w-[31rem] rounded-[36px] p-5 sm:p-6">
              <div className="space-y-4 rounded-[30px] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(250,250,248,0.92))] p-4 sm:p-5">
                <Card className="rounded-[26px] border-white/70 p-4 shadow-[0_24px_45px_rgba(29,24,17,0.08)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-[var(--foreground-muted)]">Upcoming visit</p>
                      <h3 className="mt-1 text-xl font-semibold">Dr. Sarah Chen</h3>
                      <p className="mt-1 text-sm text-[var(--foreground-muted)]">OB/GYN - Tomorrow, 10:30 AM</p>
                    </div>
                    <span className="inline-flex h-11 items-center rounded-full bg-[var(--rose-500)] px-4 text-sm font-medium text-white shadow-[0_14px_24px_rgba(212,88,123,0.26)]">
                      <Video className="mr-2 h-4 w-4" />
                      Join Video
                    </span>
                  </div>
                </Card>

                <div className="grid gap-4 sm:grid-cols-[1fr_1.08fr]">
                  <Card className="rounded-[26px] border-white/70 bg-[linear-gradient(180deg,rgba(240,250,250,0.95),rgba(255,255,255,0.95))] p-4 shadow-[0_20px_45px_rgba(20,72,67,0.08)]">
                    <p className="text-sm text-[var(--foreground-muted)]">Cycle</p>
                    <div className="mt-3 flex items-center gap-3">
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-[var(--teal-400)] bg-white text-sm font-semibold text-[var(--foreground)] shadow-[0_0_0_6px_rgba(61,191,173,0.08)]">
                        14
                      </span>
                      <div>
                        <p className="text-base font-semibold">Day 14</p>
                        <p className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
                          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                          Ovulation Day
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="rounded-[26px] border-white/70 bg-[linear-gradient(180deg,rgba(61,191,173,0.2),rgba(255,255,255,0.96))] p-4 shadow-[0_20px_45px_rgba(20,72,67,0.08)]">
                    <div className="flex items-center gap-2 text-[var(--teal-700)]">
                      <Sparkles className="h-4 w-4" />
                      <p className="text-sm font-medium">Your Health Insight</p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[var(--foreground)]">
                      Your energy dips appear two days before your period. Protect sleep this week and shift intense
                      workouts earlier in the cycle.
                    </p>
                  </Card>
                </div>

                <Card className="rounded-[26px] border-white/70 p-4 shadow-[0_24px_50px_rgba(29,24,17,0.08)]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(232,125,155,0.16)] text-[var(--rose-700)]">
                      AO
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">Dr. Amara Osei sent a message</p>
                      <p className="truncate text-sm text-[var(--foreground-muted)]">
                        I reviewed your symptom log. Let&apos;s adjust your care plan before Friday&apos;s visit.
                      </p>
                    </div>
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--rose-50)] text-[var(--rose-700)]">
                      <MessageSquare className="h-4 w-4" />
                    </span>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
