"use client";

import { useState, useTransition } from "react";
import { LoaderCircle, RefreshCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Toast } from "@/components/ui/Toast";

type InsightPayloadItem = {
  loggedAt: string;
  symptoms: string[];
  mood: number;
  energy: number;
  painLevel: number;
  sleepHours?: number;
  notes?: string;
};

type Props = {
  initialInsight: string | null;
  latestLogId: string | null;
  payload: InsightPayloadItem[];
};

export function DashboardInsightCard({ initialInsight, latestLogId, payload }: Props) {
  const [insight, setInsight] = useState(initialInsight);
  const [toast, setToast] = useState<string | null>(null);
  const [isRefreshing, startRefresh] = useTransition();

  function refreshInsight() {
    if (!latestLogId || !payload.length) {
      return;
    }

    startRefresh(async () => {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "symptom_insight",
          logId: latestLogId,
          data: payload,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setToast(data.error ?? "Unable to refresh the AI insight.");
        return;
      }

      setInsight(typeof data.result === "string" ? data.result : null);
    });
  }

  return (
    <>
      {toast ? <Toast message={toast} variant="error" onDismiss={() => setToast(null)} /> : null}
      <Card className="space-y-4 bg-[var(--teal-50)]">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-[var(--teal-700)]">AI health insight</p>
            <h3 className="mt-1 text-2xl font-semibold">Pattern highlight</h3>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-full border border-[rgba(23,104,95,0.15)] p-2 text-[var(--teal-700)]"
            onClick={refreshInsight}
            disabled={!latestLogId || !payload.length || isRefreshing}
          >
            {isRefreshing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
          </Button>
        </div>
        {insight ? (
          <>
            <p className="text-sm leading-7 text-[var(--foreground)]">{insight}</p>
            <div className="inline-flex items-center gap-2 text-sm text-[var(--teal-700)]">
              <Sparkles className="h-4 w-4" />
              Generated from your recent symptom logs
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-sm leading-7 text-[var(--foreground-muted)]">
              Add symptom check-ins across the next two weeks to generate an AI trend summary here.
            </p>
          </div>
        )}
      </Card>
    </>
  );
}
