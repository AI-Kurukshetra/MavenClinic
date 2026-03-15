import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { PublicGrid, PublicInsetCard, PublicPageShell, PublicSection } from "@/components/public/public-page-shell";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Pricing and access options for Maven Clinic's virtual women's health platform.",
};

export const revalidate = 3600;

const toc = [
  { id: "plans", label: "Access options" },
  { id: "included", label: "What is included" },
  { id: "billing", label: "Billing and reimbursement" },
  { id: "faq", label: "Pricing FAQ" },
];

const planCards = [
  {
    title: "Employer-sponsored access",
    subtitle: "Best for teams and covered employees",
    accent: "bg-[var(--rose-500)] text-white",
    points: [
      "Benefit-funded access through your employer or benefits partner",
      "Aggregated reporting for employers, never individual employee health details",
      "Custom plan design and implementation support",
    ],
    cta: { href: "/register/employer", label: "Talk to sales" },
  },
  {
    title: "Self-pay care",
    subtitle: "Best for individuals booking directly",
    accent: "border border-[var(--border)] bg-white text-[var(--foreground)]",
    points: [
      "Transparent visit pricing displayed before booking",
      "Specialty, visit length, and service type may affect the final price",
      "HSA and FSA friendly payment options where supported",
    ],
    cta: { href: "/signup", label: "Create patient account" },
  },
  {
    title: "Enterprise programs",
    subtitle: "Best for multi-market or custom benefit structures",
    accent: "border border-[rgba(61,191,173,0.18)] bg-[var(--teal-50)] text-[var(--foreground)]",
    points: [
      "Custom pricing, implementation planning, and dedicated support",
      "Flexible employer, partner, and reporting configuration",
      "Commercial terms documented in a written services agreement",
    ],
    cta: { href: "/register/employer", label: "Request enterprise quote" },
  },
] as const;

export default function PricingPage() {
  return (
    <PublicPageShell
      eyebrow="Pricing and access"
      title="Flexible access for individuals, employers, and enterprise programs"
      subtitle="Maven Clinic pricing depends on how you access care. Some members receive sponsored access through their employer, while others pay per visit. Exact costs are shown before checkout when self-pay applies."
      lastUpdated="March 15, 2026"
      toc={toc}
      quickFacts={[
        { label: "Payment options", value: "Employer-funded, self-pay, HSA, and FSA friendly" },
        { label: "Pricing visibility", value: "Shown before booking when self-pay applies" },
        { label: "Employer programs", value: "Custom implementation and reporting" },
        { label: "Need a quote?", value: "sales@mavenclinic.com" },
      ]}
      ctas={[
        { href: "/register/employer", label: "Request demo" },
        { href: "/signup", label: "Start as a patient", variant: "secondary" },
      ]}
      aside={
        <div className="space-y-3">
          <p className="text-sm font-semibold text-[var(--foreground)]">Pricing note</p>
          <p className="text-sm leading-6 text-[var(--foreground-muted)]">
            The exact amount a patient pays can vary based on employer sponsorship, specialty, visit type, and any services ordered after the visit, such as labs or referrals.
          </p>
        </div>
      }
    >
      <PublicSection
        id="plans"
        title="Choose the access path that fits"
        lead="Maven Clinic supports employer-funded benefits and direct self-pay care. We keep pricing disclosure straightforward so users know what happens before they book."
      >
        <div className="grid gap-5 lg:grid-cols-3">
          {planCards.map((plan) => (
            <div key={plan.title} className={`rounded-[30px] p-6 shadow-[0_24px_60px_rgba(25,22,17,0.05)] ${plan.accent}`}>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] opacity-70">{plan.subtitle}</p>
              <h3 className="mt-4 text-2xl font-semibold tracking-[-0.03em]">{plan.title}</h3>
              <ul className="mt-6 space-y-3 text-sm leading-6">
                {plan.points.map((point) => (
                  <li key={point} className="flex gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={plan.cta.href}
                className="mt-8 inline-flex h-[3rem] items-center justify-center rounded-full bg-white/92 px-5 text-sm font-medium text-[var(--foreground)] transition hover:bg-white"
              >
                {plan.cta.label}
              </Link>
            </div>
          ))}
        </div>
      </PublicSection>

      <PublicSection
        id="included"
        title="What is typically included"
        lead="Plan scope depends on your employer agreement or self-pay selection, but most Maven Clinic experiences are built around the same core capabilities."
      >
        <PublicGrid>
          <PublicInsetCard title="Patient experience">
            <ul className="list-disc space-y-2 pl-5">
              <li>Specialist matching, booking, secure messaging, visit follow-up, and care plan access.</li>
              <li>Cycle, fertility, symptom, and wellness tracking where enabled on the platform.</li>
              <li>Educational resources, records view, and notifications.</li>
            </ul>
          </PublicInsetCard>
          <PublicInsetCard title="Employer programs">
            <ul className="list-disc space-y-2 pl-5">
              <li>Eligibility setup, employee invitations, utilization reporting, and renewal planning.</li>
              <li>Aggregated outcomes reporting and employer support workflows.</li>
            </ul>
          </PublicInsetCard>
        </PublicGrid>
      </PublicSection>

      <PublicSection
        id="billing"
        title="Billing and reimbursement"
        lead="Maven Clinic aims to make payment expectations clear before care begins."
      >
        <PublicGrid>
          <PublicInsetCard title="For self-pay patients">
            <p>Visit pricing is shown before booking. Charges may vary by specialty, visit type, and the services delivered. Some follow-up services may be billed separately.</p>
          </PublicInsetCard>
          <PublicInsetCard title="For employer-sponsored members">
            <p>Your employer program may cover all or part of your access. The scope of coverage is determined by the applicable benefit design, not by the public pricing page alone.</p>
          </PublicInsetCard>
          <PublicInsetCard title="Payment options">
            <p>Where supported, Maven Clinic accepts standard digital payments and HSA/FSA-compatible methods. We do not publish card information in the platform itself.</p>
          </PublicInsetCard>
          <PublicInsetCard title="Insurance">
            <p>Insurance handling varies by service and market. Coverage availability, claims handling, and eligibility are disclosed within the visit or billing workflow when applicable.</p>
          </PublicInsetCard>
        </PublicGrid>
      </PublicSection>

      <PublicSection
        id="faq"
        title="Pricing FAQ"
        lead="A few common questions we hear from patients and benefit teams."
      >
        <div className="space-y-4">
          <PublicInsetCard title="Do you publish one flat visit price?">
            <p>No. The final amount can vary based on specialty, visit type, benefit sponsorship, and any related services. Maven Clinic surfaces pricing in the booking or contract flow where it actually applies.</p>
          </PublicInsetCard>
          <PublicInsetCard title="Can employers get a custom plan?">
            <p>Yes. Employer and enterprise pricing is custom because employee count, benefit scope, reporting needs, and implementation support vary by organization.</p>
          </PublicInsetCard>
          <PublicInsetCard title="Are there additional charges for labs or prescriptions?">
            <p>Potentially. Orders, outside services, or pharmacy fulfillment may involve separate billing by the provider, laboratory, or partner organization.</p>
          </PublicInsetCard>
          <PublicInsetCard title="Need a written quote?">
            <p>Contact our team at <span className="font-medium text-[var(--foreground)]">sales@mavenclinic.com</span> or use the employer flow to request a demo and pricing review.</p>
          </PublicInsetCard>
        </div>
      </PublicSection>
    </PublicPageShell>
  );
}
