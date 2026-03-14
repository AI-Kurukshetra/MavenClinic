import Link from "next/link";
import { loginAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-[var(--rose-700)]">Welcome back</p>
          <h1 className="mt-2 text-4xl font-semibold">Sign in to Maven Clinic</h1>
        </div>
        {params.message ? <div className="rounded-2xl bg-[var(--teal-50)] px-4 py-3 text-sm text-[var(--teal-700)]">{params.message}</div> : null}
        {params.error ? <div className="rounded-2xl bg-[var(--rose-50)] px-4 py-3 text-sm text-[var(--rose-700)]">{params.error}</div> : null}
        <form action={loginAction} className="space-y-4">
          <input name="email" type="email" defaultValue="" placeholder="Email address" className="w-full rounded-2xl border border-[var(--border)] px-4 py-3" required />
          <input name="password" type="password" defaultValue="" placeholder="Password" className="w-full rounded-2xl border border-[var(--border)] px-4 py-3" required />
          <Button className="w-full">Continue to dashboard</Button>
        </form>
        <p className="text-sm text-[var(--foreground-muted)]">New here? <Link href="/signup" className="text-[var(--rose-700)]">Create your account</Link></p>
      </Card>
    </main>
  );
}
