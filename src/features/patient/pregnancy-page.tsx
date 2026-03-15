"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Baby, CalendarDays, CheckCircle2, HeartPulse, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Toast } from "@/components/ui/Toast";
import type { PregnancyPageData } from "@/lib/patient-pages";
import { formatDate } from "@/lib/utils";

type ToastState = {
  message: string;
  variant?: "success" | "error" | "info";
};

type Milestone = {
  week: number;
  label: string;
  description: string;
};

const weeklyLookup = [
  { range: [1, 4], size: "poppy seed to grape", facts: ["Implantation and early placental development are underway.", "Tiny structures for the brain, spinal cord, and heart begin forming."] },
  { range: [5, 8], size: "blueberry to raspberry", facts: ["Facial features and limb buds become more defined.", "The heart starts beating in a more organized rhythm."] },
  { range: [9, 12], size: "olive to plum", facts: ["Bones continue hardening and fingernails begin to form.", "Major organs are present and continue maturing."] },
  { range: [13, 16], size: "lemon to avocado", facts: ["Movements become more coordinated, even if you cannot feel them yet.", "Baby can begin practicing swallowing and sucking."] },
  { range: [17, 20], size: "turnip to banana", facts: ["Hearing develops quickly and movement becomes stronger.", "The anatomy scan window typically opens during this stretch."] },
  { range: [21, 24], size: "carrot to ear of corn", facts: ["Lungs are developing rapidly this week.", "Sleep and wake cycles become more consistent."] },
  { range: [25, 28], size: "rutabaga to eggplant", facts: ["The nervous system is refining breathing practice movements.", "Eyes can begin opening and responding to light."] },
  { range: [29, 32], size: "butternut squash to coconut", facts: ["Baby keeps gaining body fat to regulate temperature.", "Brain growth accelerates and bones continue strengthening."] },
  { range: [33, 36], size: "pineapple to honeydew melon", facts: ["The lungs approach full maturity.", "Baby often settles into a head-down position during this stage."] },
  { range: [37, 40], size: "watermelon", facts: ["Baby is considered full term and continues preparing for birth.", "The final weeks focus on growth, fat storage, and lung readiness."] },
] as const;

const milestoneDefinitions: Milestone[] = [
  { week: 12, label: "First trimester screen", description: "A combined screening appointment often happens between weeks 12 and 13." },
  { week: 19, label: "Anatomy scan", description: "Your detailed anatomy scan is typically scheduled between weeks 18 and 20." },
  { week: 26, label: "Glucose test", description: "Gestational diabetes screening is often completed between weeks 24 and 28." },
  { week: 27, label: "Third trimester begins", description: "The third trimester begins and care plans usually shift toward birth preparation." },
  { week: 36, label: "Group B strep test", description: "A Group B strep swab is commonly done between weeks 35 and 37." },
  { week: 37, label: "Full term", description: "Your pregnancy reaches full-term status at week 37." },
];

const checklistByTrimester = {
  First: ["Take prenatal vitamins daily", "Schedule your first OB visit", "Ask about genetic counseling", "Stop alcohol and smoking"],
  Second: ["Complete your anatomy scan", "Choose a childbirth class", "Start nursery planning", "Book a dental checkup"],
  Third: ["Pack your hospital bag", "Finalize your birth plan", "Install the car seat", "Choose a pediatrician"],
} as const;

function getTrimester(week: number) {
  if (week <= 13) return "First" as const;
  if (week <= 27) return "Second" as const;
  return "Third" as const;
}

function getDevelopment(week: number) {
  return weeklyLookup.find((item) => week >= item.range[0] && week <= item.range[1]) ?? weeklyLookup[0];
}

function getChecklistKey(pregnancyId: string) {
  return `maven-pregnancy-checklist:${pregnancyId}`;
}

export function PregnancyPage({ profileName, activePregnancy }: PregnancyPageData) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lmpDate, setLmpDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);

  const development = useMemo(() => (activePregnancy ? getDevelopment(activePregnancy.currentWeek) : null), [activePregnancy]);
  const trimester = activePregnancy ? getTrimester(activePregnancy.currentWeek) : null;
  const checklistItems = trimester ? checklistByTrimester[trimester] : [];
  const progress = activePregnancy ? Math.min(100, Math.round((activePregnancy.currentWeek / 40) * 100)) : 0;

  useEffect(() => {
    if (!activePregnancy) {
      setCheckedItems([]);
      return;
    }

    const stored = window.localStorage.getItem(getChecklistKey(activePregnancy.id));
    setCheckedItems(stored ? (JSON.parse(stored) as string[]) : []);
  }, [activePregnancy]);

  function toggleChecklist(item: string) {
    if (!activePregnancy) return;

    setCheckedItems((current) => {
      const next = current.includes(item) ? current.filter((value) => value !== item) : [...current, item];
      window.localStorage.setItem(getChecklistKey(activePregnancy.id), JSON.stringify(next));
      return next;
    });
  }

  async function submitPregnancy() {
    if (!lmpDate) {
      setToast({ message: "Select your last menstrual period to begin tracking.", variant: "error" });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/pregnancy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lmpDate }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Unable to start pregnancy tracking.");
      }

      setToast({ message: "Pregnancy tracking started.", variant: "success" });
      window.location.reload();
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "Unable to start pregnancy tracking.", variant: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  const upcomingMilestones = activePregnancy
    ? milestoneDefinitions
        .filter((item) => item.week >= activePregnancy.currentWeek)
        .slice(0, 5)
        .map((item) => ({
          ...item,
          estimatedDate: new Date(new Date(activePregnancy.dueDate).getTime() - (40 - item.week) * 7 * 24 * 60 * 60 * 1000),
        }))
    : [];

  return (
    <div className="space-y-6">
      {toast ? <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} /> : null}

      {!activePregnancy ? (
        <Card className="space-y-5 p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(245,163,183,0.14)] text-[var(--rose-600)]">
            <Baby className="h-8 w-8" />
          </div>
          <div>
            <h2 className="font-[var(--font-display)] text-4xl tracking-tight">No active pregnancy tracked</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--foreground-muted)]">
              Start tracking your pregnancy to see weekly development, milestone timing, and a checklist tailored to each trimester.
            </p>
          </div>
          <div className="flex justify-center">
            <Button size="lg" onClick={() => setIsModalOpen(true)}>Start tracking your pregnancy</Button>
          </div>

          {isModalOpen ? (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(15,23,42,0.28)] p-4">
              <Card className="w-full max-w-lg space-y-5 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-[var(--rose-700)]">Pregnancy setup</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight">Track your pregnancy</h3>
                  </div>
                  <button type="button" className="text-sm text-[var(--foreground-muted)]" onClick={() => setIsModalOpen(false)}>
                    Close
                  </button>
                </div>
                <label className="block text-sm font-medium text-[var(--foreground)]">
                  Last menstrual period
                  <input
                    type="date"
                    value={lmpDate}
                    onChange={(event) => setLmpDate(event.target.value)}
                    className="mt-2 h-12 w-full rounded-[18px] border border-[var(--border)] px-4 text-sm outline-none transition focus:border-[var(--rose-400)] focus:ring-2 focus:ring-[rgba(245,163,183,0.3)]"
                  />
                </label>
                <p className="text-sm leading-6 text-[var(--foreground-muted)]">
                  Maven Clinic will estimate your due date and current week based on a standard 280-day pregnancy timeline.
                </p>
                <div className="flex justify-end gap-3">
                  <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button onClick={submitPregnancy} disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Start tracking"}</Button>
                </div>
              </Card>
            </div>
          ) : null}
        </Card>
      ) : (
        <>
          <Card className="space-y-6 p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-[var(--rose-700)]">Pregnancy journey</p>
                <h2 className="mt-2 font-[var(--font-display)] text-5xl tracking-tight">Week {activePregnancy.currentWeek}</h2>
                <p className="mt-3 text-sm leading-6 text-[var(--foreground-muted)]">
                  Due {formatDate(activePregnancy.dueDate, "MMMM d, yyyy")} and {activePregnancy.daysUntilDue} days away for {profileName.split(" ")[0]}&apos;s care plan.
                </p>
              </div>
              <Badge variant="info">{trimester} trimester</Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-[var(--foreground-muted)]">
                <span>Pregnancy progress</span>
                <span>{progress}%</span>
              </div>
              <div className="h-3 rounded-full bg-[rgba(15,23,42,0.08)]">
                <div className="h-3 rounded-full bg-[var(--rose-500)]" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="rounded-[24px] bg-[var(--slate-50)] p-5 shadow-none"><p className="text-sm text-[var(--foreground-muted)]">Due date</p><p className="mt-2 text-xl font-semibold tracking-tight">{formatDate(activePregnancy.dueDate)}</p></Card>
              <Card className="rounded-[24px] bg-[var(--slate-50)] p-5 shadow-none"><p className="text-sm text-[var(--foreground-muted)]">Days until due date</p><p className="mt-2 text-xl font-semibold tracking-tight">{activePregnancy.daysUntilDue}</p></Card>
              <Card className="rounded-[24px] bg-[var(--slate-50)] p-5 shadow-none"><p className="text-sm text-[var(--foreground-muted)]">Trimester</p><p className="mt-2 text-xl font-semibold tracking-tight">{trimester}</p></Card>
            </div>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Card className="space-y-4 p-6">
              <div className="flex items-center gap-3">
                <Baby className="h-5 w-5 text-[var(--rose-600)]" />
                <div>
                  <h3 className="text-2xl font-semibold tracking-tight">Baby development</h3>
                  <p className="text-sm text-[var(--foreground-muted)]">This week your baby is about the size of a {development?.size}.</p>
                </div>
              </div>
              <div className="rounded-[24px] bg-[var(--slate-50)] p-5">
                <p className="text-sm uppercase tracking-[0.16em] text-[var(--rose-700)]">Week {activePregnancy.currentWeek}</p>
                <p className="mt-2 text-xl font-semibold tracking-tight">Size: {development?.size}</p>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--foreground-muted)]">
                  {development?.facts.map((fact) => (
                    <li key={fact} className="flex gap-3">
                      <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[var(--teal-700)]" />
                      <span>{fact}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>

            <Card className="space-y-4 p-6">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-[var(--teal-700)]" />
                <div>
                  <h3 className="text-2xl font-semibold tracking-tight">Upcoming milestones</h3>
                  <p className="text-sm text-[var(--foreground-muted)]">Your next major checkpoints based on your due date.</p>
                </div>
              </div>
              <div className="space-y-4">
                {upcomingMilestones.map((milestone) => (
                  <div key={milestone.label} className="flex gap-4 rounded-[22px] border border-[var(--border)] p-4">
                    <div className="mt-1 h-3 w-3 rounded-full bg-[var(--rose-500)]" />
                    <div>
                      <p className="font-medium">{milestone.label}</p>
                      <p className="text-sm text-[var(--foreground-muted)]">{formatDate(milestone.estimatedDate)} · {milestone.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <Card className="space-y-4 p-6">
              <div className="flex items-center gap-3">
                <HeartPulse className="h-5 w-5 text-[var(--rose-600)]" />
                <div>
                  <h3 className="text-2xl font-semibold tracking-tight">Weekly checklist</h3>
                  <p className="text-sm text-[var(--foreground-muted)]">Keep track of the next steps that fit your current trimester.</p>
                </div>
              </div>
              <div className="space-y-3">
                {checklistItems.map((item) => {
                  const checked = checkedItems.includes(item);
                  return (
                    <label key={item} className="flex items-start gap-3 rounded-[22px] border border-[var(--border)] p-4">
                      <input type="checkbox" checked={checked} onChange={() => toggleChecklist(item)} className="mt-1 h-4 w-4 accent-[var(--rose-500)]" />
                      <span className={checked ? "text-sm text-[var(--foreground-muted)] line-through" : "text-sm text-[var(--foreground)]"}>{item}</span>
                    </label>
                  );
                })}
              </div>
            </Card>

            <Card className="space-y-4 p-6">
              <div>
                <h3 className="text-2xl font-semibold tracking-tight">Quick actions</h3>
                <p className="text-sm text-[var(--foreground-muted)]">Reach care and planning tools without leaving this page.</p>
              </div>
              <div className="grid gap-3">
                <Link href="/appointments?specialty=ob_gyn" className="flex items-center justify-between rounded-[22px] border border-[var(--border)] p-4 transition hover:bg-[var(--slate-50)]">
                  <span className="font-medium">Book OB appointment</span>
                  <span className="text-sm text-[var(--foreground-muted)]">Open scheduling</span>
                </Link>
                <Link href="/messages" className="flex items-center justify-between rounded-[22px] border border-[var(--border)] p-4 transition hover:bg-[var(--slate-50)]">
                  <span className="font-medium">Message my provider</span>
                  <MessageCircle className="h-4 w-4 text-[var(--teal-700)]" />
                </Link>
                <Link href="/care-plans" className="flex items-center justify-between rounded-[22px] border border-[var(--border)] p-4 transition hover:bg-[var(--slate-50)]">
                  <span className="font-medium">View care plan</span>
                  <span className="text-sm text-[var(--foreground-muted)]">See milestones</span>
                </Link>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
