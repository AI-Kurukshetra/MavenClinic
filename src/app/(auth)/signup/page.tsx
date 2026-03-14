import Link from "next/link";
import { signupAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-[var(--teal-700)]">Create account</p>
          <h1 className="mt-2 text-4xl font-semibold">Start your Maven Clinic journey</h1>
        </div>
        {params.error ? <div className="rounded-2xl bg-[var(--rose-50)] px-4 py-3 text-sm text-[var(--rose-700)]">{params.error}</div> : null}
        <form action={signupAction} className="space-y-4">
          <input name="fullName" placeholder="Full name" className="w-full rounded-2xl border border-[var(--border)] px-4 py-3" required />
          <input name="email" type="email" placeholder="Email address" className="w-full rounded-2xl border border-[var(--border)] px-4 py-3" required />
          <input name="password" type="password" placeholder="Create password" className="w-full rounded-2xl border border-[var(--border)] px-4 py-3" required />
          <Button className="w-full">Continue to onboarding</Button>
        </form>
        <p className="text-sm text-[var(--foreground-muted)]">Already have an account? <Link href="/login" className="text-[var(--rose-700)]">Log in</Link></p>
      </Card>
    </main>
  );
}
