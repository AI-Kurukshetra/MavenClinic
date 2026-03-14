import Link from "next/link";
import { Instagram, Linkedin, Twitter } from "lucide-react";

const footerColumns = [
  {
    title: "Product",
    links: [
      { href: "#patients", label: "Patients" },
      { href: "#providers", label: "Providers" },
      { href: "#employers", label: "Employers" },
      { href: "/register/employer", label: "Pricing" },
    ],
  },
  {
    title: "Specialties",
    links: [
      { href: "#providers", label: "OB/GYN" },
      { href: "#providers", label: "Fertility" },
      { href: "#providers", label: "Mental Health" },
      { href: "#providers", label: "Menopause" },
      { href: "#providers", label: "Nutrition" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "#how-it-works", label: "About" },
      { href: "/register/provider", label: "Careers" },
      { href: "#patients", label: "Press" },
      { href: "/login", label: "Privacy" },
      { href: "/login", label: "Terms" },
      { href: "/login", label: "HIPAA" },
    ],
  },
];

export function FooterSection() {
  return (
    <footer id="footer" className="border-t border-[var(--border)] px-5 pb-10 pt-16 sm:px-6 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.2fr_repeat(3,minmax(0,1fr))] lg:gap-10">
        <div>
          <Link href="/" className="flex items-center gap-3 text-lg font-semibold">
            <span className="inline-flex h-3.5 w-3.5 rounded-full bg-[var(--rose-500)] shadow-[0_0_0_8px_rgba(232,125,155,0.14)]" />
            <span>Maven Clinic</span>
          </Link>
          <p className="mt-5 max-w-sm text-base leading-7 text-[var(--foreground-muted)]">
            Specialist-led women&apos;s health care that feels warm, clear, and genuinely supportive.
          </p>
          <div className="mt-6 flex items-center gap-3 text-[var(--foreground-muted)]">
            {[Instagram, Linkedin, Twitter].map((Icon) => (
              <a
                key={Icon.displayName}
                href="#"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-white transition hover:border-[var(--border-strong)] hover:text-[var(--foreground)]"
                aria-label="Social link"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {footerColumns.map((column) => (
          <div key={column.title}>
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--foreground-muted)]">{column.title}</h3>
            <div className="mt-5 space-y-3">
              {column.links.map((link) => (
                <Link key={link.label} href={link.href} className="block text-sm transition hover:text-[var(--rose-700)]">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-10 max-w-7xl border-t border-[var(--border)] pt-6 text-sm text-[var(--foreground-muted)]">
        &copy; 2026 Maven Clinic - HIPAA Compliant - SOC 2 Type II Certified
      </div>
    </footer>
  );
}
