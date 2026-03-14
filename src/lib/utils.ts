import { clsx } from "clsx";
import { format, formatDistanceToNowStrict } from "date-fns";

export function cn(...inputs: Array<string | false | null | undefined>) {
  return clsx(inputs);
}

export function formatDate(date: string | Date, pattern = "MMM d, yyyy") {
  return format(new Date(date), pattern);
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), "EEE, MMM d · h:mm a");
}

export function formatRelativeTime(date: string | Date) {
  return formatDistanceToNowStrict(new Date(date), { addSuffix: true });
}

export function currencyFromCents(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function titleCase(value: string) {
  return value
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

