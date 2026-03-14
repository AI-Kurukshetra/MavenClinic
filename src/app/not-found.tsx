import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-16 text-center">
      <div className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-[var(--rose-700)]">404</p>
        <h1 className="font-[var(--font-playfair)] text-4xl text-[var(--slate-900)]">This page is not available</h1>
        <p className="text-base text-[var(--foreground-muted)]">
          The page may have moved, expired, or require a different account role.
        </p>
      </div>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-full border border-[var(--border)] px-5 py-3 text-sm font-medium text-[var(--slate-900)] transition hover:bg-white"
        >
          Go home
        </Link>
        <Link
          href="/dashboard"
          className="rounded-full bg-[var(--rose-500)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[var(--rose-600)]"
        >
          Go to dashboard
        </Link>
      </div>
    </main>
  );
}