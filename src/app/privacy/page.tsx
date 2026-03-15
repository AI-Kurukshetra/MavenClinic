import type { Metadata } from "next";
import Link from "next/link";
import { PublicGrid, PublicInsetCard, PublicPageShell, PublicSection } from "@/components/public/public-page-shell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Maven Clinic collects, uses, discloses, and protects personal information and protected health information.",
};

export const revalidate = 3600;

const toc = [
  { id: "scope", label: "Scope and applicability" },
  { id: "collect", label: "Information we collect" },
  { id: "use", label: "How we use and disclose information" },
  { id: "rights", label: "Your rights and choices" },
  { id: "security", label: "Security, retention, and transfers" },
  { id: "contact", label: "Contact us" },
];

export default function PrivacyPage() {
  return (
    <PublicPageShell
      eyebrow="Privacy and data use"
      title="Privacy Policy"
      subtitle="This Privacy Policy explains how Maven Clinic collects, uses, shares, and protects information when you use our website, applications, telehealth services, secure messaging, and employer-sponsored platform experiences in the United States."
      lastUpdated="March 15, 2026"
      toc={toc}
      quickFacts={[
        { label: "Applies to", value: "Patients, providers, employers, partners, and site visitors" },
        { label: "Protected data", value: "Personal information, account data, and protected health information" },
        { label: "Linked documents", value: "Terms of Service and HIPAA Notice" },
        { label: "Questions", value: "privacy@mavenclinic.com" },
      ]}
      ctas={[
        { href: "/hipaa", label: "Read HIPAA notice" },
        { href: "/terms", label: "Review terms", variant: "secondary" },
      ]}
      aside={
        <div className="space-y-3">
          <p className="text-sm font-semibold text-[var(--foreground)]">Privacy baseline</p>
          <p className="text-sm leading-6 text-[var(--foreground-muted)]">
            When Maven Clinic creates, receives, maintains, or transmits protected health information on behalf of a covered health care provider or health plan, we handle that information in accordance with HIPAA and applicable state privacy law.
          </p>
        </div>
      }
    >
      <PublicSection
        id="scope"
        title="Scope and applicability"
        lead="This Privacy Policy applies to Maven Clinic's consumer website, patient and provider applications, employer portals, partner portal, telehealth features, and support interactions, unless a separate notice or written agreement says otherwise."
      >
        <p>
          Some information processed through Maven Clinic may also be subject to a separate Notice of Privacy Practices, an employer services agreement, or another agreement with a provider organization. If there is a conflict, the more specific notice or agreement will control for that service.
        </p>
        <p>
          Our services are intended for use in the United States. If you use the platform through an employer, health plan, or provider organization, your access may also be governed by that organization&apos;s policies and benefit rules.
        </p>
      </PublicSection>

      <PublicSection
        id="collect"
        title="Information we collect"
        lead="We collect the information needed to create accounts, coordinate care, operate the platform, secure access, improve services, and meet legal obligations."
      >
        <PublicGrid>
          <PublicInsetCard title="Information you provide">
            <ul className="list-disc space-y-2 pl-5">
              <li>Account details such as name, email address, phone number, date of birth, and login credentials.</li>
              <li>Health profile details, symptoms, cycle logs, fertility data, pregnancy data, insurance details, and care preferences.</li>
              <li>Messages, consultation notes you choose to save, support requests, survey responses, and uploaded files.</li>
            </ul>
          </PublicInsetCard>
          <PublicInsetCard title="Information created during care">
            <ul className="list-disc space-y-2 pl-5">
              <li>Appointments, prescriptions, lab results, care plans, referrals, and provider communications.</li>
              <li>Notifications, consent records, audit logs, and care coordination events.</li>
              <li>Employer-level utilization data that is aggregated and de-identified before employer reporting.</li>
            </ul>
          </PublicInsetCard>
        </PublicGrid>
        <PublicGrid>
          <PublicInsetCard title="Technical and usage information">
            <ul className="list-disc space-y-2 pl-5">
              <li>Device, browser, IP address, log data, authentication events, and general usage analytics.</li>
              <li>Session cookies and similar technologies used for security, preferences, sign-in persistence, and performance measurement.</li>
            </ul>
          </PublicInsetCard>
          <PublicInsetCard title="Information from third parties">
            <ul className="list-disc space-y-2 pl-5">
              <li>Employer eligibility data, provider credentialing data, insurance or payment details, and referral information.</li>
              <li>Information imported from integrated services you authorize, such as scheduling, video, or secure communications tools.</li>
            </ul>
          </PublicInsetCard>
        </PublicGrid>
      </PublicSection>

      <PublicSection
        id="use"
        title="How we use and disclose information"
        lead="We use information to deliver care, support operations, maintain security, comply with law, and improve the experience. We do not sell protected health information."
      >
        <p>Depending on the service, we may use or disclose information to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Create and administer accounts, verify identity, and manage access by role.</li>
          <li>Schedule appointments, support telehealth visits, facilitate messaging, and coordinate treatment.</li>
          <li>Generate reminders, notifications, summaries, and operational records related to care and support.</li>
          <li>Process payments, verify eligibility, administer employer benefits, and provide customer support.</li>
          <li>Protect against fraud, abuse, misuse, security incidents, and unauthorized access.</li>
          <li>Comply with legal obligations, respond to valid requests, and enforce our agreements.</li>
        </ul>
        <p>
          We may share information with providers, service providers, business associates, employer sponsors in aggregated or de-identified form, insurers, and others when required or permitted by law. Individual employee health information is never shared with employers through employer dashboards.
        </p>
        <p>
          We may also use de-identified or aggregated information for analytics, service planning, reporting, and product improvement, provided it is no longer reasonably linkable to an identified person.
        </p>
      </PublicSection>

      <PublicSection
        id="rights"
        title="Your rights and choices"
        lead="Depending on the type of information and the service you are using, you may have rights under HIPAA, state privacy laws, and other applicable law."
      >
        <ul className="list-disc space-y-2 pl-5">
          <li>Access and obtain a copy of your information, subject to legal exceptions.</li>
          <li>Request correction of inaccurate or incomplete information.</li>
          <li>Request confidential communications or updates to your contact preferences.</li>
          <li>Request restrictions on certain uses or disclosures when allowed by law.</li>
          <li>Manage cookies and optional communications through your browser settings and account preferences.</li>
          <li>Close your account, subject to legal, safety, billing, and record retention requirements.</li>
        </ul>
        <p>
          To exercise privacy rights, contact us using the details below. We may need to verify your identity before acting on a request. Some requests may be denied when an exception applies, but we will explain the basis when required.
        </p>
        <p>
          If you are using Maven Clinic through an employer or provider organization, some requests may need to be handled together with that organization. See our <Link href="/hipaa" className="font-medium text-[var(--rose-700)] underline underline-offset-4">HIPAA page</Link> for additional health-information rights.
        </p>
      </PublicSection>

      <PublicSection
        id="security"
        title="Security, retention, and transfers"
        lead="We use administrative, technical, and physical safeguards designed to protect personal information and protected health information."
      >
        <PublicGrid>
          <PublicInsetCard title="Security measures">
            <ul className="list-disc space-y-2 pl-5">
              <li>Role-based access controls, encryption in transit, and security monitoring.</li>
              <li>Audit logging, session controls, vendor management, and least-privilege operational practices.</li>
              <li>Secure development, incident response procedures, and workforce confidentiality obligations.</li>
            </ul>
          </PublicInsetCard>
          <PublicInsetCard title="Retention and transfers">
            <ul className="list-disc space-y-2 pl-5">
              <li>We retain records for as long as needed to provide services, meet contractual commitments, and satisfy legal or clinical record obligations.</li>
              <li>We may process information through service providers in the United States that are contractually bound to protect the data they handle for us.</li>
            </ul>
          </PublicInsetCard>
        </PublicGrid>
        <p>
          No system is completely risk free. If we learn of a security incident that requires notice under applicable law, we will provide notice as required.
        </p>
      </PublicSection>

      <PublicSection
        id="contact"
        title="Contact us"
        lead="If you have questions about this Privacy Policy, or if you want to make a privacy request, contact Maven Clinic's privacy team."
      >
        <PublicGrid>
          <PublicInsetCard title="Privacy team">
            <p>Email: privacy@mavenclinic.com</p>
            <p>Support: support@mavenclinic.com</p>
          </PublicInsetCard>
          <PublicInsetCard title="Mailing address">
            <p>Maven Clinic Privacy Office</p>
            <p>85 Broad Street</p>
            <p>New York, NY 10004</p>
          </PublicInsetCard>
        </PublicGrid>
        <p>
          We may update this Privacy Policy from time to time. If we make a material change, we will update the effective date above and provide additional notice when required.
        </p>
      </PublicSection>
    </PublicPageShell>
  );
}

