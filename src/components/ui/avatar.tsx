/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils";

type AvatarProps = {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "h-10 w-10 text-sm",
  md: "h-12 w-12 text-base",
  lg: "h-16 w-16 text-lg",
};

export function Avatar({ src, name, size = "md" }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (src) {
    return <img src={src} alt={name} className={cn("rounded-full object-cover", sizeClasses[size])} />;
  }

  return (
    <div className={cn("flex items-center justify-center rounded-full bg-[rgba(245,163,183,0.2)] font-semibold text-[var(--rose-700)]", sizeClasses[size])}>
      {initials}
    </div>
  );
}


