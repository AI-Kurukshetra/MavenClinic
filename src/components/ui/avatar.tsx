import Image from "next/image";
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

const sizePixels = {
  sm: 40,
  md: 48,
  lg: 64,
};

export function Avatar({ src, name, size = "md" }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={sizePixels[size]}
        height={sizePixels[size]}
        className={cn("rounded-full object-cover", sizeClasses[size])}
      />
    );
  }

  return (
    <div className={cn("flex items-center justify-center rounded-full bg-[rgba(245,163,183,0.2)] font-semibold text-[var(--rose-700)]", sizeClasses[size])}>
      {initials}
    </div>
  );
}