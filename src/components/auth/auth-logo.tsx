import { cn } from "@/lib/utils";

type Props = {
  tone?: "light" | "brand";
  className?: string;
};

export function AuthLogo({ tone = "brand", className }: Props) {
  const textColor = tone === "light" ? "text-white" : "text-[var(--rose-600)]";
  const dotColor = tone === "light" ? "bg-white" : "bg-[var(--rose-500)]";

  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <span className={cn("h-3 w-3 rounded-full shadow-[0_0_0_6px_rgba(255,255,255,0.08)]", dotColor)} />
      <span className={cn("text-lg font-semibold tracking-[-0.02em]", textColor)}>Maven Clinic</span>
    </div>
  );
}