"use client";

import { useEffect, useState, useTransition } from "react";
import { CalendarPlus, Loader2 } from "lucide-react";
import { revokePartnerAccessAction } from "@/app/(partner)/partner/actions";
import { Button } from "@/components/ui/button";

type PartnerCalendarButtonProps = {
  title: string;
  start: string;
  description: string;
  location: string;
};

function formatIcsDate(value: string) {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function PartnerCalendarButton({ title, start, description, location }: PartnerCalendarButtonProps) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className="rounded-xl px-4"
      onClick={() => {
        const startDate = new Date(start);
        const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);
        const body = [
          "BEGIN:VCALENDAR",
          "VERSION:2.0",
          "BEGIN:VEVENT",
          `DTSTAMP:${formatIcsDate(new Date().toISOString())}`,
          `DTSTART:${formatIcsDate(startDate.toISOString())}`,
          `DTEND:${formatIcsDate(endDate.toISOString())}`,
          `SUMMARY:${title}`,
          `DESCRIPTION:${description.replace(/\n/g, " ")}`,
          `LOCATION:${location}`,
          "END:VEVENT",
          "END:VCALENDAR",
        ].join("\r\n");
        const blob = new Blob([body], { type: "text/calendar;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "maven-clinic-appointment.ics";
        link.click();
        URL.revokeObjectURL(url);
      }}
    >
      <CalendarPlus className="mr-2 h-4 w-4" />
      Add to calendar
    </Button>
  );
}

type PartnerPregnancyChecklistProps = {
  storageKey: string;
  items: string[];
};

export function PartnerPregnancyChecklist({ storageKey, items }: PartnerPregnancyChecklistProps) {
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") {
      return {};
    }

    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return {};
    }

    try {
      return JSON.parse(raw) as Record<string, boolean>;
    } catch {
      return {};
    }
  });

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(checked));
  }, [checked, storageKey]);

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <label key={item} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--border)] px-4 py-3 text-sm text-[var(--foreground-muted)] transition hover:border-[rgba(61,191,173,0.35)] hover:bg-[rgba(61,191,173,0.06)]">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-slate-300 text-[var(--teal-600)] focus:ring-[var(--teal-400)]"
            checked={Boolean(checked[item])}
            onChange={() => setChecked((current) => ({ ...current, [item]: !current[item] }))}
          />
          <span>{item}</span>
        </label>
      ))}
    </div>
  );
}

type PartnerRemoveAccessButtonProps = {
  patientName: string;
};

export function PartnerRemoveAccessButton({ patientName }: PartnerRemoveAccessButtonProps) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="secondary"
      className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50"
      onClick={() => {
        const confirmed = window.confirm(`This will remove your access to ${patientName}'s health data. Continue?`);
        if (!confirmed) {
          return;
        }

        startTransition(async () => {
          await revokePartnerAccessAction();
        });
      }}
      disabled={pending}
    >
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Remove my partner access
    </Button>
  );
}
