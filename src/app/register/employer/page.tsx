import { redirect } from "next/navigation";
import { registerEmployerAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAuthenticatedRedirectPath, getCurrentProfileWithSync, getCurrentUser } from "@/lib/auth";

const planTypes = [
  { value: "standard", label: "Standard" },
  { value: "premium", label: "Premium" },
  { value: "enterprise", label: "Enterprise" },
] as const;


export default async function EmployerRegistrationPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const currentUser = await getCurrentUser();

  if (currentUser) {
    const profile = await getCurrentProfileWithSync(currentUser);
    redirect(getAuthenticatedRedirectPath(profile));
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-3xl space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-[var(--teal-700)]">Employer registration</p>
          <h1 className="mt-2 text-4xl font-semibold">Create your employer admin account</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--foreground-muted)]">
            Register your company workspace, create the first admin account, and move directly into the employer dashboard.
          </p>
        </div>

        {params.message ? <div className="rounded-2xl bg-[var(--teal-50)] px-4 py-3 text-sm text-[var(--teal-700)]">{params.message}</div> : null}
        {params.error ? <div className="rounded-2xl bg-[var(--rose-50)] px-4 py-3 text-sm text-[var(--rose-700)]">{params.error}</div> : null}

        <form action={registerEmployerAction} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm text-[var(--foreground-muted)]">Company name</span>
              <input name="companyName" placeholder="Acme Corp" className="w-full rounded-2xl border border-[var(--border)] px-4 py-3" required />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-[var(--foreground-muted)]">Company domain</span>
              <input name="domain" placeholder="acme.com" className="w-full rounded-2xl border border-[var(--border)] px-4 py-3" required />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-[var(--foreground-muted)]">Employee count</span>
              <input name="employeeCount" type="number" min="1" step="1" placeholder="2500" className="w-full rounded-2xl border border-[var(--border)] px-4 py-3" required />
            </label>
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm text-[var(--foreground-muted)]">Plan type</span>
              <select name="planType" defaultValue="enterprise" className="w-full rounded-2xl border border-[var(--border)] px-4 py-3" required>
                {planTypes.map((plan) => (
                  <option key={plan.value} value={plan.value}>{plan.label}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm text-[var(--foreground-muted)]">Admin full name</span>
              <input name="fullName" placeholder="Alex Morgan" className="w-full rounded-2xl border border-[var(--border)] px-4 py-3" required />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-[var(--foreground-muted)]">Work email</span>
              <input name="email" type="email" placeholder="alex@acme.com" className="w-full rounded-2xl border border-[var(--border)] px-4 py-3" required />
            </label>
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm text-[var(--foreground-muted)]">Password</span>
              <input name="password" type="password" placeholder="Create a secure password" minLength={8} className="w-full rounded-2xl border border-[var(--border)] px-4 py-3" required />
            </label>
          </div>
          <div className="flex justify-end border-t border-[var(--border)] pt-5">
            <Button>Create employer account</Button>
          </div>
        </form>
      </Card>
    </main>
  );
}