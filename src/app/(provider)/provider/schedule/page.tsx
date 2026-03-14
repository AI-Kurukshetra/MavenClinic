import { DashboardShell } from "@/components/health/dashboard-shell";
import { Card } from "@/components/ui/card";

const schedule = [
  { time: "9:00 AM", patient: "Ariana Bennett", reason: "Cycle irregularity follow-up" },
  { time: "11:30 AM", patient: "Naomi Ellis", reason: "Menopause symptom review" },
  { time: "2:00 PM", patient: "Claire Dawson", reason: "Fertility intake" },
  { time: "4:00 PM", patient: "Jasmine Hall", reason: "Nutrition consult" },
];

export default function ProviderSchedulePage() {
  return (
    <DashboardShell title="Provider schedule" eyebrow="Today’s timeline" section="provider">
      <div className="grid gap-4">
        {schedule.map((item) => (
          <Card key={item.time} className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--rose-700)]">{item.time}</p>
              <h2 className="mt-2 text-2xl font-semibold">{item.patient}</h2>
              <p className="text-sm text-[var(--foreground-muted)]">{item.reason}</p>
            </div>
            <button className="rounded-full border border-[var(--border)] px-4 py-2 text-sm">Open chart</button>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}

