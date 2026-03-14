import { cn } from "@/lib/utils";

type BadgeProps = {
  variant?: "success" | "warning" | "info" | "neutral";
  children: React.ReactNode;
};

const badgeStyles = {
  success: "bg-[rgba(61,191,173,0.15)] text-[var(--teal-700)]",
  warning: "bg-[rgba(248,191,91,0.18)] text-[var(--amber-700)]",
  info: "bg-[rgba(245,163,183,0.16)] text-[var(--rose-700)]",
  neutral: "bg-[rgba(31,41,55,0.06)] text-[var(--foreground-muted)]",
};

export function Badge({ variant = "neutral", children }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", badgeStyles[variant])}>
      {children}
    </span>
  );
}

