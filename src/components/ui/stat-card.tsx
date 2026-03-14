import { LucideIcon, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";

type StatCardProps = {
  title: string;
  value: string;
  delta?: string;
  icon?: LucideIcon;
};

export function StatCard({ title, value, delta, icon: Icon = TrendingUp }: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--foreground-muted)]">{title}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
          {delta ? <p className="mt-1 text-sm text-[var(--teal-700)]">{delta}</p> : null}
        </div>
        <div className="rounded-2xl bg-[rgba(61,191,173,0.12)] p-3 text-[var(--teal-700)]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

