"use client";

import { ReactNode, useEffect, useState } from "react";
import { CalendarDays, Heart, ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthLogo } from "@/components/auth/auth-logo";

type Slide = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  preview: ReactNode;
  icon: ReactNode;
};

const slides: Slide[] = [
  {
    id: "appointments",
    eyebrow: "Care on your schedule",
    title: "Same-day appointments with specialists who get it",
    description:
      "OB/GYNs, fertility experts, and mental health providers available today - no referral needed.",
    icon: (
      <div className="relative flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/20 bg-white/10 backdrop-blur-sm">
        <CalendarDays className="h-8 w-8 text-white" />
        <Heart className="absolute -bottom-1 -right-1 h-5 w-5 fill-white text-white" />
      </div>
    ),
    preview: (
      <div className="rounded-[28px] border border-white/14 bg-white/10 p-5 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-white">Dr. Sarah Chen</p>
            <p className="mt-1 text-sm text-white/76">OB/GYN consult</p>
          </div>
          <div className="rounded-full bg-white/14 px-3 py-1 text-xs text-white/84">Tomorrow</div>
        </div>
        <div className="mt-5 flex items-center justify-between rounded-[22px] bg-black/10 px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/55">Visit time</p>
            <p className="mt-1 text-lg font-semibold text-white">10:30 AM</p>
          </div>
          <div className="rounded-full bg-white px-4 py-2 text-sm font-medium text-[var(--rose-600)]">Join soon</div>
        </div>
      </div>
    ),
  },
  {
    id: "insights",
    eyebrow: "Smart pattern recognition",
    title: "AI insights tailored to your cycle",
    description:
      "Pattern recognition across your symptoms, mood, and cycle - surfaced as clear, actionable guidance.",
    icon: (
      <div className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/20 bg-white/10 backdrop-blur-sm">
        <Sparkles className="h-8 w-8 text-white" />
      </div>
    ),
    preview: (
      <div className="rounded-[28px] border border-white/14 bg-white/10 p-5 backdrop-blur-xl">
        <p className="inline-flex rounded-full bg-white/14 px-3 py-1 text-xs uppercase tracking-[0.22em] text-white/76">AI insight</p>
        <p className="mt-4 text-base leading-7 text-white/88">
          Your last three check-ins suggest energy dips around ovulation. A provider may want to review iron levels and sleep quality.
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-white/70">
          <span className="h-2 w-2 rounded-full bg-[var(--teal-400)]" />
          Personalized from your recent logs
        </div>
      </div>
    ),
  },
  {
    id: "trust",
    eyebrow: "Built for medical-grade privacy",
    title: "Your data, protected always",
    description:
      "HIPAA-compliant platform with end-to-end encryption. Your health data is yours - always.",
    icon: (
      <div className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/20 bg-white/10 backdrop-blur-sm">
        <ShieldCheck className="h-8 w-8 text-white" />
      </div>
    ),
    preview: (
      <div className="rounded-[28px] border border-white/14 bg-white/10 p-5 backdrop-blur-xl">
        <p className="text-sm font-medium text-white">Security standards</p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm text-white/84">
          <span className="rounded-full border border-white/18 bg-white/8 px-3 py-2">HIPAA</span>
          <span className="rounded-full border border-white/18 bg-white/8 px-3 py-2">SOC 2</span>
          <span className="rounded-full border border-white/18 bg-white/8 px-3 py-2">256-bit encryption</span>
        </div>
      </div>
    ),
  },
];

const avatars = ["SK", "PM", "AR", "LM", "JO"];

export function AuthBrandPanel() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 4000);

    return () => window.clearInterval(timer);
  }, []);

  const activeSlide = slides[activeIndex];

  return (
    <aside className="relative hidden min-h-screen overflow-hidden md:flex md:flex-col md:justify-between md:px-10 md:py-9 lg:px-14 lg:py-12">
      <div className="absolute inset-0 bg-[linear-gradient(160deg,var(--rose-400),var(--rose-600))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.18),transparent_32%),radial-gradient(circle_at_80%_28%,rgba(255,255,255,0.12),transparent_30%),radial-gradient(circle_at_65%_78%,rgba(255,255,255,0.08),transparent_28%)] opacity-80" />
      <div className="absolute -left-14 top-14 h-52 w-52 rounded-full bg-white/6" />
      <div className="absolute right-16 top-24 h-28 w-28 rounded-full bg-white/7" />
      <div className="absolute left-1/3 top-1/2 h-44 w-44 rounded-full bg-white/5" />
      <div className="absolute bottom-24 right-10 h-64 w-64 rounded-full bg-white/6" />

      <div className="relative z-10">
        <AuthLogo tone="light" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col justify-center py-10 text-white auth-page-enter">
        <div key={activeSlide.id} className="space-y-8 auth-brand-slide">
          <div className="space-y-6">
            {activeSlide.icon}
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.28em] text-white/70">{activeSlide.eyebrow}</p>
              <h2 className="max-w-md font-display text-4xl leading-tight tracking-[-0.03em] text-white lg:text-[2rem]">{activeSlide.title}</h2>
              <p className="max-w-md text-base leading-7 text-white/78">{activeSlide.description}</p>
            </div>
          </div>

          {activeSlide.preview}

          <div className="flex items-center gap-2">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`Show slide ${index + 1}`}
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "h-2.5 rounded-full transition-all duration-300",
                  index === activeIndex ? "w-8 bg-white" : "w-2.5 bg-white/36 hover:bg-white/56",
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 flex items-end justify-between gap-6 text-white">
        <div>
          <p className="text-sm font-medium tracking-[0.02em]">★★★★★ Trusted by 50,000+ women</p>
          <p className="mt-2 text-sm text-white/76">4.9 rating across 12,000 reviews</p>
        </div>
        <div className="flex items-center pl-6">
          {avatars.map((avatar, index) => (
            <div
              key={avatar}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/12 text-xs font-semibold text-white backdrop-blur-sm"
              style={{ marginLeft: index === 0 ? 0 : -10 }}
            >
              {avatar}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}