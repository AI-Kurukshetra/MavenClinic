import type { HTMLAttributeAnchorTarget } from "react";

type PageErrorStateProps = {
  title?: string;
  message?: string;
  href?: string;
  ctaLabel?: string;
  target?: HTMLAttributeAnchorTarget;
};

export function PageErrorState({
  title = "Unable to load this page",
  message = "Please refresh the page to try again.",
  href = "/dashboard",
  ctaLabel = "Try again",
  target,
}: PageErrorStateProps) {
  return (
    <div className="flex min-h-96 flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--rose-50)]">
        <span className="text-xl text-[var(--rose-500)]">!</span>
      </div>
      <h2 className="mb-2 text-xl font-medium text-[var(--foreground)]">{title}</h2>
      <p className="mb-6 max-w-xl text-sm text-[var(--foreground-muted)]">{message}</p>
      <a href={href} target={target} className="rounded-xl bg-[var(--rose-500)] px-6 py-2 text-sm text-white transition hover:bg-[var(--rose-600)]">
        {ctaLabel}
      </a>
    </div>
  );
}
