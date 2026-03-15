import type { Metadata } from "next";
import { AiIntelligenceSection } from "@/components/landing/ai-intelligence-section";
import { EmployersSection } from "@/components/landing/employers-section";
import { FinalCtaSection } from "@/components/landing/final-cta-section";
import { FooterSection } from "@/components/landing/footer-section";
import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { LandingNav } from "@/components/landing/landing-nav";
import { SocialProofBar } from "@/components/landing/social-proof-bar";
import { SpecialtiesSection } from "@/components/landing/specialties-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";

export const metadata: Metadata = {
  title: "Maven Clinic â€” Virtual Women's Health",
};

export const revalidate = 3600;

export default function HomePage() {
  return (
    <>
      <LandingNav />
      <main className="landing-mesh relative overflow-hidden bg-[#FAFAF8] text-[var(--foreground)]">
        <HeroSection />
        <SocialProofBar />
        <HowItWorksSection />
        <SpecialtiesSection />
        <AiIntelligenceSection />
        <EmployersSection />
        <TestimonialsSection />
        <FinalCtaSection />
        <FooterSection />
      </main>
    </>
  );
}
