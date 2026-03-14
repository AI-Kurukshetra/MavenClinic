import { Calendar, Languages, Star } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { currencyFromCents, formatDateTime } from "@/lib/utils";
import type { Provider } from "@/types/domain";

type ProviderCardProps = {
  provider: Provider;
  selected?: boolean;
  ctaLabel?: string;
  onAction?: () => void;
};

export function ProviderCard({ provider, selected = false, ctaLabel = "Book consult", onAction }: ProviderCardProps) {
  const nextAvailable = provider.nextAvailable[0];

  return (
    <Card className={`p-5 transition ${selected ? "ring-2 ring-[rgba(232,125,155,0.35)]" : ""}`}>
      <div className="flex gap-4">
        <Avatar src={provider.avatarUrl} name={provider.fullName} size="lg" />
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold">{provider.fullName}</h3>
                <Badge variant="neutral">{provider.specialtyLabel}</Badge>
              </div>
              <div className="inline-flex items-center gap-1 text-sm font-medium text-[var(--amber-700)]">
                <Star className="h-4 w-4 fill-current" />
                {provider.rating.toFixed(1)}
                <span className="text-[var(--foreground-muted)]">({provider.totalReviews})</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold">{currencyFromCents(provider.consultationFeeCents)}</p>
              <p className="text-sm text-[var(--foreground-muted)]">Per visit</p>
            </div>
          </div>
          <p className="line-clamp-2 text-sm leading-6 text-[var(--foreground-muted)]">{provider.bio}</p>
          <div className="flex flex-wrap gap-2">
            {provider.languages.map((language) => (
              <span key={language} className="inline-flex items-center rounded-full bg-[var(--slate-50)] px-3 py-1 text-xs font-medium text-[var(--foreground-muted)]">
                {language}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-[var(--foreground-muted)]">
            <span className="inline-flex items-center gap-2"><Languages className="h-4 w-4" />{provider.languages.join(", ")}</span>
            <span className="inline-flex items-center gap-2"><Calendar className="h-4 w-4" />{nextAvailable ? `Next ${formatDateTime(nextAvailable)}` : "No open slots in the next 14 days"}</span>
          </div>
          {onAction ? <Button size="sm" type="button" onClick={onAction} disabled={!nextAvailable}>{ctaLabel}</Button> : null}
        </div>
      </div>
    </Card>
  );
}