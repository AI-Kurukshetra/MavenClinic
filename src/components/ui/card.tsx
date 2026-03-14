import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-[var(--border)] bg-white/88 p-6 shadow-[0_22px_65px_rgba(25,22,17,0.06)] backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  );
}

