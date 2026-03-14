import type { Route } from "next";
import Link from "next/link";
import { Building2, Stethoscope } from "lucide-react";
import { Card } from "@/components/ui/card";

const registrationPaths = [
  {
    href: "/register/provider" as Route,
    title: "Provider registration",
    description:
      "Provider accounts are invite-only. Continue if you already have a Maven Clinic invite token or registration link.",
    cta: "I have a provider invite",
    icon: Stethoscope,
  },
  {
    href: "/register/employer" as Route,
    title: "Employer registration",
    description:
      "Create your company workspace, add the first employer admin, and launch the benefits dashboard.",
    cta: "Continue as employer",
    icon: Building2,
  },
];

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-5xl space-y-8">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.25em] text-[var(--teal-700)]">Choose a registration path</p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Set up the right Maven Clinic account</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[var(--foreground-muted)] sm:text-base">
            Providers and employers have different onboarding requirements. Pick the path that matches your account type.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {registrationPaths.map(({ href, title, description, cta, icon: Icon }) => (
            <Link key={href} href={href}>
              <Card className="h-full rounded-[30px] p-7 transition hover:-translate-y-0.5 hover:bg-white">
                <div className="flex h-full flex-col justify-between gap-8">
                  <div className="space-y-4">
                    <div className="inline-flex rounded-2xl bg-[var(--teal-50)] p-3 text-[var(--teal-700)]">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="space-y-3">
                      <h2 className="text-2xl font-semibold">{title}</h2>
                      <p className="text-sm leading-7 text-[var(--foreground-muted)]">{description}</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-[var(--rose-700)]">{cta}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}