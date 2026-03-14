import type { Route } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Props = {
  badge: string;
  title: string;
  description: string;
  dashboardHref: Route;
  dashboardLabel: string;
  nextHref?: Route;
  nextLabel?: string;
};

export function ComingSoonState({
  badge,
  title,
  description,
  dashboardHref,
  dashboardLabel,
  nextHref,
  nextLabel,
}: Props) {
  return (
    <Card className="border-dashed bg-[var(--slate-50)]/70">
      <p className="text-sm uppercase tracking-[0.24em] text-[var(--rose-700)]">{badge}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--foreground-muted)]">{description}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={dashboardHref}>
          <Button variant="secondary" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {dashboardLabel}
          </Button>
        </Link>
        {nextHref && nextLabel ? (
          <Link href={nextHref}>
            <Button className="gap-2">
              {nextLabel}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        ) : null}
      </div>
    </Card>
  );
}