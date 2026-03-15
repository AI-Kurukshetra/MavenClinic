"use client";

import { useEffect } from "react";

export default function SegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Segment page error:", error);
  }, [error]);

  return (
    <div className="flex min-h-96 flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--rose-50)]">
        <span className="text-xl text-[var(--rose-500)]">!</span>
      </div>
      <h2 className="mb-2 text-xl font-medium text-[var(--foreground)]">Unable to load this page</h2>
      <p className="mb-6 max-w-xl text-sm text-[var(--foreground-muted)]">Please refresh the page to try again.</p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-xl bg-[var(--rose-500)] px-6 py-2 text-sm text-white transition hover:bg-[var(--rose-600)]"
      >
        Try again
      </button>
    </div>
  );
}
