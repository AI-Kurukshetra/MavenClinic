import type { Metadata } from "next";
import { PublicGrid, PublicInsetCard, PublicPageShell, PublicSection } from "@/components/public/public-page-shell";

export const metadata: Metadata = {
  title: "HIPAA and Health Information",
  description: "Maven Clinic's commitment to HIPAA safeguards, patient rights, and telehealth privacy protections.",
};

export const revalidate = 3600;

const toc = [
  { id: "commitment", label: "Our HIPAA commitment" },
  { id: "use-disclose", label: "How health information is used" },
  { id: "rights", label: "Your HIPAA rights" },
  { id: "telehealth", label: "Telehealth safeguards" },
  { id: "complaints", label: "Questions and complaints" },
];

export default function HipaaPage() {
  return (
    <PublicPageShell
      eyebrow="HIPAA and patient rights"
      title="HIPAA and Health Information"
      subtitle="Maven Clinic is built to support privacy-aware virtual care. This page summarizes how protected health information may be handled through the platform and the rights available to patients under HIPAA when HIPAA applies."
      lastUpdated="March 15, 2026"
      toc={toc}
      quickFacts={[
        { label: "Safeguards", value: "Role-based access, encrypted transport, audit logging" },
        { label: "Patient rights", value: "Access, amendment, restrictions, confidential communications" },
        { label: "Complaints", value: "privacy@mavenclinic.com or HHS OCR" },
        { label: "Emergency care", value: "Call 911 for emergencies" },
      ]}
      ctas={[
        { href: "/privacy", label: "Read privacy policy" },
        { href: "/login", label: "Access your account", variant: "secondary" },
      ]}
      aside={
        <div className="space-y-3">
          <p className="text-sm font-semibold text-[var(--foreground)]">Important note</p>
          <p className="text-sm leading-6 text-[var(--foreground-muted)]">
            This page is a summary for platform users. If a provider organization or health plan delivers a separate Notice of Privacy Practices, that notice may also apply to the care you receive through Maven Clinic.
          </p>
        </div>
      }
    >
      <PublicSection
        id="commitment"
        title="Our HIPAA commitment"
        lead="When Maven Clinic creates, receives, maintains, or transmits protected health information on behalf of a covered health care provider or health plan, we apply HIPAA-aligned safeguards and contractual controls designed for that role."
      >
        <PublicGrid>
          <PublicInsetCard title="Administrative safeguards">
            <ul className="list-disc space-y-2 pl-5">
              <li>Workforce training, confidentiality obligations, access review, and incident response processes.</li>
              <li>Vendor due diligence and written agreements with service providers handling health information.</li>
            </ul>
          </PublicInsetCard>
          <PublicInsetCard title="Technical and physical safeguards">
            <ul className="list-disc space-y-2 pl-5">
              <li>Access controls, session protection, audit logs, and encrypted transport.</li>
              <li>Segregated role permissions for patients, providers, employers, partners, and administrators.</li>
            </ul>
          </PublicInsetCard>
        </PublicGrid>
      </PublicSection>

      <PublicSection
        id="use-disclose"
        title="How health information may be used or disclosed"
        lead="Protected health information may be used or disclosed for treatment, payment, and health care operations, and in other circumstances allowed or required by law."
      >
        <ul className="list-disc space-y-2 pl-5">
          <li>Treatment, including scheduling, telehealth visits, care coordination, referrals, prescriptions, lab workflows, and secure messaging.</li>
          <li>Payment and benefits administration, including eligibility, billing support, and claims-related processing.</li>
          <li>Health care operations, including quality review, credentialing, compliance, auditing, and service support.</li>
          <li>Public policy or legal purposes when required by law, court order, or valid regulatory request.</li>
        </ul>
        <p>
          Maven Clinic employer tools are designed to display aggregated and anonymized utilization information only. We do not surface identifiable patient health information to employers through employer dashboards.
        </p>
      </PublicSection>

      <PublicSection
        id="rights"
        title="Your HIPAA rights"
        lead="When HIPAA applies, patients generally have rights to inspect and obtain a copy of health information, request an amendment, request restrictions, request confidential communications, receive an accounting of certain disclosures, and receive a copy of applicable notices."
      >
        <PublicGrid>
          <PublicInsetCard title="Common rights requests">
            <ul className="list-disc space-y-2 pl-5">
              <li>Request a copy of information maintained in your designated record set.</li>
              <li>Ask us to correct information you believe is inaccurate or incomplete.</li>
              <li>Request a different communication method or location for privacy reasons.</li>
            </ul>
          </PublicInsetCard>
          <PublicInsetCard title="How to make a request">
            <ul className="list-disc space-y-2 pl-5">
              <li>Email privacy@mavenclinic.com with enough detail for us to verify and process the request.</li>
              <li>We may need to coordinate with your provider organization or health plan depending on who maintains the record.</li>
            </ul>
          </PublicInsetCard>
        </PublicGrid>
      </PublicSection>

      <PublicSection
        id="telehealth"
        title="Telehealth safeguards"
        lead="Telehealth introduces additional privacy and security considerations. Maven Clinic is designed to reduce those risks through platform controls and clear patient expectations."
      >
        <ul className="list-disc space-y-2 pl-5">
          <li>Private consultation rooms and authenticated access to scheduled visits.</li>
          <li>Secure messaging with participant-based access controls and audit trails.</li>
          <li>Session management and account protection to help prevent unauthorized viewing.</li>
          <li>Patient responsibility to join visits from a private location when possible and protect personal devices and credentials.</li>
        </ul>
      </PublicSection>

      <PublicSection
        id="complaints"
        title="Questions and complaints"
        lead="If you believe your privacy rights were violated, you may contact Maven Clinic or file a complaint with the U.S. Department of Health and Human Services Office for Civil Rights."
      >
        <PublicGrid>
          <PublicInsetCard title="Maven Clinic privacy office">
            <p>Email: privacy@mavenclinic.com</p>
            <p>Support: support@mavenclinic.com</p>
          </PublicInsetCard>
          <PublicInsetCard title="Regulatory complaint option">
            <p>
              You may also file a complaint with the U.S. Department of Health and Human Services Office for Civil Rights. Filing a complaint will not affect your care or access to services.
            </p>
          </PublicInsetCard>
        </PublicGrid>
      </PublicSection>
    </PublicPageShell>
  );
}
