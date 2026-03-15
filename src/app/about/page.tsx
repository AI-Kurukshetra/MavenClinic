import type { Metadata } from "next";
import Link from "next/link";
import { HeartPulse, ShieldCheck, Sparkles, Stethoscope } from "lucide-react";
import { PublicGrid, PublicInsetCard, PublicPageShell, PublicSection } from "@/components/public/public-page-shell";

export const metadata: Metadata = {
  title: "About Maven Clinic",
  description: "Learn how Maven Clinic delivers specialist-led virtual women's health, fertility, and care coordination.",
};

export const revalidate = 3600;

const toc = [
  { id: "mission", label: "Mission" },
  { id: "care-model", label: "Care model" },
  { id: "why-it-works", label: "Why it works" },
  { id: "specialties", label: "Specialties" },
  { id: "trust", label: "Trust and safety" },
];

export default function AboutPage() {
  return (
    <PublicPageShell
      eyebrow="About Maven Clinic"
      title="Virtual care designed around the full women's health journey"
      subtitle="Maven Clinic brings together OB/GYN care, fertility, mental health, menopause support, nutrition, secure messaging, and care coordination in one warm, clinically grounded experience."
      lastUpdated="March 15, 2026"
      toc={toc}
      quickFacts={[
        { label: "Specialist network", value: "500+ women's health specialists" },
        { label: "Patients supported", value: "50,000+ patients served" },
        { label: "Employer partners", value: "200+ employer benefit relationships" },
        { label: "Care access", value: "Same-day availability in core specialties" },
      ]}
      ctas={[
        { href: "/signup", label: "Start with Maven" },
        { href: "/pricing", label: "View pricing", variant: "secondary" },
      ]}
      aside={
        <div className="space-y-3">
          <p className="text-sm font-semibold text-[var(--foreground)]">Built for continuity</p>
          <p className="text-sm leading-6 text-[var(--foreground-muted)]">
            We are designed to support patients from first cycles and conception planning through pregnancy, postpartum, midlife, and menopause - with a single coordinated care experience.
          </p>
        </div>
      }
    >
      <PublicSection
        id="mission"
        title="Our mission"
        lead="Maven Clinic exists to make women's health care easier to access, easier to understand, and more consistent over time."
      >
        <p>
          Too many patients move through fragmented systems, repeat the same story to multiple clinicians, or delay care because the right specialist is hard to reach. Maven Clinic is built to reduce that friction with modern access, thoughtful design, and specialist-led care that meets people where they are.
        </p>
      </PublicSection>

      <PublicSection
        id="care-model"
        title="How the care model works"
        lead="Maven Clinic combines a digital front door, specialist matching, secure messaging, and ongoing follow-up so care does not stop after a single visit."
      >
        <PublicGrid columns="three">
          <PublicInsetCard title="1. Match to the right specialist">
            <p>Patients share goals, symptoms, and preferences. Maven Clinic surfaces specialists across OB/GYN, fertility, mental health, menopause, nutrition, and related disciplines.</p>
          </PublicInsetCard>
          <PublicInsetCard title="2. Get care quickly">
            <p>Patients can book visits, message their care team, and receive guidance without navigating multiple disconnected tools.</p>
          </PublicInsetCard>
          <PublicInsetCard title="3. Stay supported over time">
            <p>Care plans, reminders, symptom tracking, cycle insights, and education help patients stay informed between visits.</p>
          </PublicInsetCard>
        </PublicGrid>
      </PublicSection>

      <PublicSection
        id="why-it-works"
        title="Why patients, providers, and employers use Maven Clinic"
        lead="The platform is built to be clinically useful, operationally reliable, and warm enough that people actually want to keep using it."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[28px] border border-[var(--border)] bg-[var(--rose-50)] p-6">
            <HeartPulse className="h-8 w-8 text-[var(--rose-600)]" />
            <h3 className="mt-4 text-xl font-semibold text-[var(--foreground)]">For patients</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--foreground-muted)]">
              Easier access to specialists, clearer care pathways, and a single place to manage appointments, messages, records, and care plans.
            </p>
          </div>
          <div className="rounded-[28px] border border-[var(--border)] bg-[var(--teal-50)] p-6">
            <Stethoscope className="h-8 w-8 text-[var(--teal-600)]" />
            <h3 className="mt-4 text-xl font-semibold text-[var(--foreground)]">For providers</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--foreground-muted)]">
              Better continuity, richer patient context, and tools for follow-up, referrals, prescriptions, labs, and longitudinal plans.
            </p>
          </div>
          <div className="rounded-[28px] border border-[var(--border)] bg-white p-6">
            <Sparkles className="h-8 w-8 text-[var(--rose-600)]" />
            <h3 className="mt-4 text-xl font-semibold text-[var(--foreground)]">For employers</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--foreground-muted)]">
              Aggregated insights, utilization reporting, and a specialized benefit that employees understand and actually use.
            </p>
          </div>
          <div className="rounded-[28px] border border-[var(--border)] bg-white p-6">
            <ShieldCheck className="h-8 w-8 text-[var(--teal-600)]" />
            <h3 className="mt-4 text-xl font-semibold text-[var(--foreground)]">For trust</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--foreground-muted)]">
              Privacy-aware architecture, role-based access, secure communications, and platform controls designed for health data handling.
            </p>
          </div>
        </div>
      </PublicSection>

      <PublicSection
        id="specialties"
        title="Specialties we support"
        lead="Maven Clinic is built around the specialties most often needed across fertility, pregnancy, postpartum, and lifelong women's health."
      >
        <PublicGrid columns="three">
          <PublicInsetCard title="OB/GYN">
            <p>Annual exams, reproductive health, symptom evaluation, and preventive care.</p>
          </PublicInsetCard>
          <PublicInsetCard title="Fertility">
            <p>Cycle optimization, conception planning, IVF support, and specialist navigation.</p>
          </PublicInsetCard>
          <PublicInsetCard title="Mental health">
            <p>Anxiety, perinatal support, therapy, and emotional wellbeing across life stages.</p>
          </PublicInsetCard>
          <PublicInsetCard title="Menopause">
            <p>Midlife symptom management, hormone therapy conversations, and ongoing support.</p>
          </PublicInsetCard>
          <PublicInsetCard title="Nutrition">
            <p>Hormone-aware nutrition, prenatal planning, and nutrition guidance tied to clinical goals.</p>
          </PublicInsetCard>
          <PublicInsetCard title="Care coordination">
            <p>Referrals, labs, prescriptions, care plans, and team-based follow-up across specialties.</p>
          </PublicInsetCard>
        </PublicGrid>
      </PublicSection>

      <PublicSection
        id="trust"
        title="Trust, privacy, and safety"
        lead="Health care requires both empathy and rigor. Maven Clinic is designed for both."
      >
        <p>
          We pair warm patient experience design with clear operational controls, documented access patterns, secure messaging, consent-aware sharing, and role-based separation across patients, providers, employers, partners, and administrators.
        </p>
        <p>
          Learn more about our privacy and HIPAA approach on our <Link href="/privacy" className="font-medium text-[var(--rose-700)] underline underline-offset-4">Privacy Policy</Link> and <Link href="/hipaa" className="font-medium text-[var(--rose-700)] underline underline-offset-4">HIPAA</Link> pages.
        </p>
      </PublicSection>
    </PublicPageShell>
  );
}
