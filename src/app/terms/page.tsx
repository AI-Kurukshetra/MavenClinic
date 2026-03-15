import type { Metadata } from "next";
import Link from "next/link";
import { PublicGrid, PublicInsetCard, PublicPageShell, PublicSection } from "@/components/public/public-page-shell";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms that govern access to Maven Clinic's telehealth platform, employer services, and digital tools.",
};

export const revalidate = 3600;

const toc = [
  { id: "acceptance", label: "Acceptance and eligibility" },
  { id: "services", label: "Services and clinical limits" },
  { id: "accounts", label: "Accounts, payments, and acceptable use" },
  { id: "ip", label: "Intellectual property and platform content" },
  { id: "termination", label: "Termination, disclaimers, and disputes" },
  { id: "contact", label: "Contact and updates" },
];

export default function TermsPage() {
  return (
    <PublicPageShell
      eyebrow="Platform terms"
      title="Terms of Service"
      subtitle="These Terms of Service govern access to Maven Clinic's websites, patient and provider applications, employer portals, secure messaging tools, telehealth services, and related products made available by Maven Clinic in the United States."
      lastUpdated="March 15, 2026"
      toc={toc}
      quickFacts={[
        { label: "Applies to", value: "All users who access or use Maven Clinic" },
        { label: "Clinical emergency", value: "Do not use Maven Clinic for emergency care" },
        { label: "Billing", value: "Employer-sponsored and self-pay arrangements may both apply" },
        { label: "Support", value: "legal@mavenclinic.com" },
      ]}
      ctas={[
        { href: "/signup", label: "Create account" },
        { href: "/privacy", label: "Read privacy policy", variant: "secondary" },
      ]}
      aside={
        <div className="space-y-3">
          <p className="text-sm font-semibold text-[var(--foreground)]">Emergency limitation</p>
          <p className="text-sm leading-6 text-[var(--foreground-muted)]">
            Maven Clinic is not a substitute for emergency services. If you think you are experiencing a medical emergency, call 911 or go to the nearest emergency room immediately.
          </p>
        </div>
      }
    >
      <PublicSection
        id="acceptance"
        title="Acceptance and eligibility"
        lead="By using Maven Clinic, you agree to these Terms and to any additional policies, consents, or written agreements that apply to the services you use."
      >
        <p>
          You must be legally able to enter into a binding agreement and comply with all local laws that apply to your use of the platform. If you are using Maven Clinic on behalf of an employer, provider organization, or another legal entity, you represent that you have authority to bind that entity.
        </p>
        <p>
          Certain services may have additional eligibility requirements, including geographic availability, clinician licensure, age restrictions, or employer benefit status. Access to a particular service does not guarantee that a visit, prescription, referral, or benefit will be available in every case.
        </p>
      </PublicSection>

      <PublicSection
        id="services"
        title="Services and clinical limits"
        lead="Maven Clinic provides digital health tools, scheduling, secure communications, education, administrative coordination, employer benefit support, and access to licensed providers through telehealth."
      >
        <ul className="list-disc space-y-2 pl-5">
          <li>Clinical decisions are made by licensed providers, not by the platform itself.</li>
          <li>Educational content and AI-generated summaries are informational and do not replace professional medical judgment.</li>
          <li>Provider availability, response times, and treatment options vary by specialty, jurisdiction, and clinical appropriateness.</li>
          <li>Telehealth may not be appropriate for every condition and may be limited by location, technology, or legal requirements.</li>
        </ul>
        <p>
          You are responsible for providing accurate information, keeping your contact details current, and following instructions provided by your clinician. If you believe your condition is worsening or urgent, seek in-person or emergency care without waiting for a platform response.
        </p>
      </PublicSection>

      <PublicSection
        id="accounts"
        title="Accounts, payments, and acceptable use"
        lead="You are responsible for maintaining the confidentiality of your credentials, using the service lawfully, and paying any amounts that apply to your plan or care path."
      >
        <PublicGrid>
          <PublicInsetCard title="Account responsibilities">
            <ul className="list-disc space-y-2 pl-5">
              <li>Use accurate, current, and complete account information.</li>
              <li>Do not share credentials or allow unauthorized access.</li>
              <li>Notify us promptly if you suspect unauthorized use.</li>
            </ul>
          </PublicInsetCard>
          <PublicInsetCard title="Payments and coverage">
            <ul className="list-disc space-y-2 pl-5">
              <li>Some services are paid by an employer sponsor or health plan, while others may require self-pay amounts disclosed before booking.</li>
              <li>You remain responsible for charges not covered by an employer, health plan, HSA/FSA arrangement, or other sponsor.</li>
            </ul>
          </PublicInsetCard>
        </PublicGrid>
        <p>You may not use Maven Clinic to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Violate law, infringe rights, or interfere with the security or operation of the platform.</li>
          <li>Impersonate another person, access data without authorization, or attempt to reverse engineer protected systems.</li>
          <li>Upload malicious code, scrape restricted data, or use the services to develop a competing product.</li>
        </ul>
      </PublicSection>

      <PublicSection
        id="ip"
        title="Intellectual property and platform content"
        lead="Maven Clinic and its licensors own the software, visual design, text, workflows, and other content made available through the platform, except for content owned by users or third-party rights holders."
      >
        <p>
          Subject to these Terms, Maven Clinic grants you a limited, non-exclusive, non-transferable, revocable right to access and use the service for its intended purpose. You may not copy, distribute, modify, create derivative works from, or exploit platform materials except as allowed by law or by written permission.
        </p>
        <p>
          If you submit feedback or suggestions, you allow Maven Clinic to use that feedback without restriction or compensation. Nothing in these Terms transfers ownership of Maven Clinic intellectual property to you.
        </p>
      </PublicSection>

      <PublicSection
        id="termination"
        title="Termination, disclaimers, and disputes"
        lead="We may suspend or terminate access if required for safety, compliance, fraud prevention, nonpayment, or violation of these Terms or another governing agreement."
      >
        <p>
          Except where law prohibits it, the services are provided on an &quot;as is&quot; and &quot;as available&quot; basis. Maven Clinic does not guarantee uninterrupted access, error-free operation, or that every requested service, provider, or outcome will be available.
        </p>
        <p>
          Nothing in these Terms limits rights that cannot be waived under applicable law, including consumer protection, health privacy, and professional practice standards. Any dispute will be handled in a court of competent jurisdiction unless a separate written agreement governing your relationship with Maven Clinic provides otherwise.
        </p>
      </PublicSection>

      <PublicSection
        id="contact"
        title="Contact and updates"
        lead="Questions about these Terms may be sent to Maven Clinic's legal team."
      >
        <PublicGrid>
          <PublicInsetCard title="Legal contact">
            <p>Email: legal@mavenclinic.com</p>
            <p>Support: support@mavenclinic.com</p>
          </PublicInsetCard>
          <PublicInsetCard title="Related notices">
            <p>
              Read our <Link href="/privacy" className="font-medium text-[var(--rose-700)] underline underline-offset-4">Privacy Policy</Link> and <Link href="/hipaa" className="font-medium text-[var(--rose-700)] underline underline-offset-4">HIPAA page</Link>.
            </p>
          </PublicInsetCard>
        </PublicGrid>
        <p>
          We may update these Terms from time to time. If we make material changes, we will update the date above and provide additional notice when required.
        </p>
      </PublicSection>
    </PublicPageShell>
  );
}

