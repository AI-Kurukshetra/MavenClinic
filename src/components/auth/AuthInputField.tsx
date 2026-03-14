import { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  helperText?: string;
  leftIcon: ReactNode;
  rightSlot?: ReactNode;
};

export function AuthInputField({
  label,
  error,
  helperText,
  leftIcon,
  rightSlot,
  className,
  id,
  ...props
}: Props) {
  return (
    <label htmlFor={id} className="block space-y-2.5 text-left">
      <span className="text-sm font-medium text-[rgba(45,45,45,0.82)]">{label}</span>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{leftIcon}</span>
        <input
          id={id}
          className={cn(
            "h-12 w-full rounded-xl border bg-white pl-11 pr-12 text-sm text-[var(--foreground)] transition placeholder:text-slate-400 focus:ring-2",
            error
              ? "border-[var(--rose-500)] focus:border-[var(--rose-500)] focus:ring-[rgba(232,125,155,0.24)]"
              : "border-slate-200 focus:border-[var(--rose-400)] focus:ring-[rgba(245,163,183,0.38)]",
            className,
          )}
          {...props}
        />
        {rightSlot ? <span className="absolute inset-y-0 right-3 flex items-center">{rightSlot}</span> : null}
      </div>
      {error ? <p className="text-sm text-[var(--rose-600)]">{error}</p> : helperText ? <p className="text-sm text-[var(--foreground-muted)]">{helperText}</p> : null}
    </label>
  );
}