"use client";

import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
};

const variantClasses = {
  primary: "bg-[var(--rose-500)] text-white shadow-[0_12px_30px_rgba(212,88,123,0.28)] hover:bg-[var(--rose-600)]",
  secondary: "border border-[var(--border-strong)] bg-white/85 text-[var(--foreground)] hover:bg-white",
  ghost: "bg-transparent text-[var(--foreground)] hover:bg-white/70",
};

const sizeClasses = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full font-medium transition duration-200 disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}

