"use client";

export default function DashboardRouteError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void props.error;

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
      <div className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-[var(--rose-700)]">Patient dashboard</p>
        <h1 className="font-display text-4xl text-[var(--foreground)]">Dashboard loading error</h1>
        <p className="text-base text-[var(--foreground-muted)]">
          Please refresh the page. If the issue continues, open appointments or messages while we reconnect your dashboard.
        </p>
      </div>
      <button
        type="button"
        onClick={props.reset}
        className="mt-8 rounded-full bg-[var(--rose-500)] px-6 py-3 text-sm font-medium text-white transition hover:bg-[var(--rose-600)]"
      >
        Try again
      </button>
    </main>
  );
}
