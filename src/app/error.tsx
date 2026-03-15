"use client";

export default function GlobalError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void props.error;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
      <div className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-[var(--rose-700)]">Maven Clinic</p>
        <h1 className="font-[var(--font-playfair)] text-4xl text-[var(--slate-900)]">Something went wrong</h1>
        <p className="text-base text-[var(--foreground-muted)]">
          We could not complete that request safely. Please try again.
        </p>
      </div>
      <button
        type="button"
        onClick={props.reset}
        className="mt-8 rounded-full bg-[var(--rose-500)] px-6 py-3 text-sm font-medium text-white transition hover:bg-[var(--rose-600)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rose-500)]"
      >
        Try again
      </button>
    </main>
  );
}
