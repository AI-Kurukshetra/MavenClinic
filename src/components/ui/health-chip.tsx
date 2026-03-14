"use client";

import { cn } from "@/lib/utils";

type HealthChipProps = {
  label: string;
  selected: boolean;
  onToggle?: () => void;
};

export function HealthChip({ label, selected, onToggle }: HealthChipProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-medium transition",
        selected
          ? "border-transparent bg-[var(--rose-500)] text-white shadow-[0_10px_24px_rgba(212,88,123,0.24)]"
          : "border-[var(--border)] bg-white text-[var(--foreground)] hover:border-[var(--rose-300)] hover:bg-[var(--rose-50)]",
      )}
    >
      {label}
    </button>
  );
}

