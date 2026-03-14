"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastProps = {
  message: string;
  variant?: "success" | "error" | "info";
  onDismiss?: () => void;
};

const variantClasses = {
  success: "border-[rgba(46,168,152,0.22)] bg-[rgba(61,191,173,0.16)] text-[var(--teal-700)]",
  error: "border-[rgba(212,88,123,0.22)] bg-[rgba(212,88,123,0.12)] text-[var(--rose-700)]",
  info: "border-[rgba(148,163,184,0.22)] bg-[rgba(241,245,249,0.92)] text-[var(--foreground)]",
} as const;

const variantIcons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
} as const;

export function Toast({ message, variant = "success", onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(true);
  const Icon = variantIcons[variant];

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, 4000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [onDismiss]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed right-4 top-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] items-start gap-3 rounded-[24px] border px-4 py-3 shadow-[0_18px_45px_rgba(25,22,17,0.12)] backdrop-blur-sm",
        variantClasses[variant],
      )}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <p className="flex-1 text-sm leading-6">{message}</p>
      <button
        type="button"
        aria-label="Dismiss message"
        className="rounded-full p-1 opacity-70 transition hover:opacity-100"
        onClick={() => {
          setVisible(false);
          onDismiss?.();
        }}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}