"use client";

import { useMemo, useState } from "react";
import type { Route } from "next";
import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Brain, HeartPulse, MoonStar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Toast } from "@/components/ui/Toast";
import type { WellnessPageData } from "@/lib/patient-pages";
import { formatDate } from "@/lib/utils";

type ToastState = {
  message: string;
  variant?: "success" | "error" | "info";
};

type Tip = {
  title: string;
  description: string;
};

type AssessmentQuestion = {
  label: string;
  key: string;
};

const assessmentsCatalog: Record<string, { label: string; questions: AssessmentQuestion[] }> = {
  phq2: {
    label: "PHQ-2 Depression Screen",
    questions: [
      { key: "interest", label: "Little interest or pleasure in doing things" },
      { key: "mood", label: "Feeling down, depressed, or hopeless" },
    ],
  },
  gad2: {
    label: "GAD-2 Anxiety Screen",
    questions: [
      { key: "nervous", label: "Feeling nervous, anxious, or on edge" },
      { key: "worry", label: "Not being able to stop or control worrying" },
    ],
  },
  sleep: {
    label: "Sleep Quality Assessment",
    questions: [
      { key: "fall_asleep", label: "How often did it take longer than 30 minutes to fall asleep?" },
      { key: "wake_ups", label: "How often did you wake up during the night?" },
      { key: "rested", label: "How rested did you feel on waking?" },
      { key: "duration", label: "How close were you to your target sleep duration?" },
      { key: "routine", label: "How consistent was your sleep routine?" },
    ],
  },
  energy: {
    label: "Energy & Fatigue Screen",
    questions: [
      { key: "morning", label: "How would you rate your morning energy?" },
      { key: "afternoon", label: "How would you rate your afternoon energy?" },
      { key: "fatigue", label: "How often did fatigue interfere with your day?" },
    ],
  },
};

function trendIcon(trend: "up" | "down" | "flat") {
  if (trend === "up") return <ArrowUpRight className="h-4 w-4 text-[var(--teal-700)]" />;
  if (trend === "down") return <ArrowDownRight className="h-4 w-4 text-[var(--rose-600)]" />;
  return <ArrowRight className="h-4 w-4 text-[var(--foreground-muted)]" />;
}

function scoreTone(label: WellnessPageData["label"]) {
  if (label === "Poor") return "text-[var(--rose-600)]";
  if (label === "Fair") return "text-[var(--amber-700)]";
  if (label === "Good") return "text-[var(--teal-500)]";
  return "text-[var(--teal-700)]";
}

function scoreRecommendation(score: number) {
  if (score < 50) {
    return {
      title: "Consider speaking with a mental health provider",
      body: "Low wellness scores can reflect a difficult week. A provider can help you sort through what deserves more support.",
      href: "/appointments?specialty=mental_health",
      label: "Book appointment",
    };
  }

  if (score <= 75) {
    return {
      title: "Keep up the good work",
      body: "Your recent logs show stable momentum. Small improvements in sleep and symptom recovery could lift your score further.",
      href: "/symptoms",
      label: "Log today",
    };
  }

  return {
    title: "Excellent wellness",
    body: "Your recent data points to strong balance across mood, energy, and sleep. Stay consistent with the habits that are working.",
    href: "/care-plans",
    label: "Review care plan",
  };
}

export function WellnessPage({ profileName, score, label, lastUpdatedAt, breakdown, recentData, assessments }: WellnessPageData) {
  const [tips, setTips] = useState<Tip[]>([]);
  const [isGeneratingTips, setIsGeneratingTips] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [activeAssessment, setActiveAssessment] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const recommendation = useMemo(() => scoreRecommendation(score), [score]);

  async function generateTips() {
    try {
      setIsGeneratingTips(true);
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "wellness_score",
          data: {
            score,
            label,
            recentData,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to generate personalized wellness tips.");
      }

      const payload = (await response.json()) as { data?: { result?: Tip[] } };
      setTips(Array.isArray(payload.data?.result) ? payload.data.result : []);
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "Unable to generate wellness tips.", variant: "error" });
    } finally {
      setIsGeneratingTips(false);
    }
  }

  async function submitAssessment() {
    if (!activeAssessment) return;

    const questionCount = assessmentsCatalog[activeAssessment]?.questions.length ?? 0;
    if (Object.keys(answers).length < questionCount) {
      setToast({ message: "Answer each question before saving the assessment.", variant: "error" });
      return;
    }

    try {
      const response = await fetch("/api/wellness-assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentType: activeAssessment,
          answers: Object.entries(answers).map(([key, value]) => ({ key, value })),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Unable to save assessment.");
      }

      setToast({ message: "Assessment saved.", variant: "success" });
      setActiveAssessment(null);
      setAnswers({});
      window.location.reload();
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "Unable to save assessment.", variant: "error" });
    }
  }

  return (
    <div className="space-y-6">
      {toast ? <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} /> : null}

      <Card className="grid gap-6 p-6 sm:grid-cols-[auto_1fr] sm:items-center sm:p-8">
        <div className="flex justify-center"><ProgressRing value={score} size={150} color="teal" /></div>
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-[var(--rose-700)]">Wellness score</p>
          <h2 className="mt-2 text-4xl font-semibold tracking-tight">{profileName.split(" ")[0]}&apos;s weekly wellness</h2>
          <p className={`mt-3 text-xl font-semibold ${scoreTone(label)}`}>{label}</p>
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">Last updated {lastUpdatedAt ? formatDate(lastUpdatedAt, "MMMM d, yyyy") : "when you log new symptoms"}</p>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="space-y-2 p-5"><div className="flex items-center justify-between"><p className="text-sm text-[var(--foreground-muted)]">Mood</p>{trendIcon(breakdown.moodTrend)}</div><p className="text-2xl font-semibold tracking-tight">{breakdown.moodAverage}/10</p><p className="text-sm text-[var(--foreground-muted)]">7-day average</p></Card>
        <Card className="space-y-2 p-5"><div className="flex items-center justify-between"><p className="text-sm text-[var(--foreground-muted)]">Energy</p>{trendIcon(breakdown.energyTrend)}</div><p className="text-2xl font-semibold tracking-tight">{breakdown.energyAverage}/10</p><p className="text-sm text-[var(--foreground-muted)]">7-day average</p></Card>
        <Card className="space-y-2 p-5"><div className="flex items-center justify-between"><p className="text-sm text-[var(--foreground-muted)]">Sleep</p>{trendIcon(breakdown.sleepTrend)}</div><p className="text-2xl font-semibold tracking-tight">{breakdown.sleepAverage} hrs</p><p className="text-sm text-[var(--foreground-muted)]">7-day average</p></Card>
        <Card className="space-y-2 p-5"><div className="flex items-center justify-between"><p className="text-sm text-[var(--foreground-muted)]">Symptoms</p>{trendIcon(breakdown.symptomTrend)}</div><p className="text-2xl font-semibold tracking-tight">{breakdown.symptomCount}</p><p className="text-sm text-[var(--foreground-muted)]">logged this week</p></Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="space-y-4 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-[var(--rose-700)]">Improvement tips</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight">AI-powered coaching</h3>
            </div>
            <Button variant="secondary" onClick={generateTips} disabled={isGeneratingTips}>{isGeneratingTips ? "Loading..." : "Refresh tips"}</Button>
          </div>
          <div className="grid gap-3">
            {(tips.length ? tips : [
              { title: "Protect recovery time", description: "Aim for a consistent wind-down routine this week so your sleep and energy patterns become more predictable." },
              { title: "Notice symptom clusters", description: "Log symptoms with meals, sleep, and stress to make patterns easier for your care team to interpret." },
              { title: "Reach out early", description: "If mood or energy is trending down, send your provider a short update before symptoms build." },
            ]).map((tip) => (
              <div key={tip.title} className="rounded-[22px] border border-[var(--border)] p-4">
                <div className="flex items-center gap-3"><Sparkles className="h-4 w-4 text-[var(--teal-700)]" /><p className="font-medium">{tip.title}</p></div>
                <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">{tip.description}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-[var(--rose-700)]">Recommendations</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight">What to do next</h3>
          </div>
          <div className="rounded-[24px] bg-[var(--slate-50)] p-5">
            <p className="text-lg font-semibold tracking-tight">{recommendation.title}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">{recommendation.body}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href={recommendation.href as Route} className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--rose-500)] px-5 text-sm font-medium text-white transition hover:bg-[var(--rose-600)]">{recommendation.label}</Link>
              <Link href="/messages?topic=wellness support" className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--border)] px-5 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--slate-50)]">Message a provider</Link>
            </div>
          </div>
        </Card>
      </div>

      <Card className="space-y-4 p-6">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-[var(--rose-700)]">Health assessments</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight">Quick screens and check-ins</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {assessments.map((assessment) => (
            <div key={assessment.type} className="rounded-[24px] border border-[var(--border)] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{assessment.label}</p>
                  <p className="mt-1 text-sm text-[var(--foreground-muted)]">Estimated time: {assessment.estimatedTime}</p>
                  <p className="mt-1 text-sm text-[var(--foreground-muted)]">Last completed: {assessment.lastCompletedAt ? formatDate(assessment.lastCompletedAt, "MMM d, yyyy") : "Not completed"}</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => { setActiveAssessment(assessment.type); setAnswers({}); }}>Take assessment</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {activeAssessment ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(15,23,42,0.28)] p-4">
          <Card className="w-full max-w-2xl space-y-5 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-[var(--rose-700)]">Assessment</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight">{assessmentsCatalog[activeAssessment]?.label}</h3>
              </div>
              <button type="button" className="text-sm text-[var(--foreground-muted)]" onClick={() => setActiveAssessment(null)}>Close</button>
            </div>
            <div className="space-y-4">
              {assessmentsCatalog[activeAssessment]?.questions.map((question) => (
                <div key={question.key} className="rounded-[22px] border border-[var(--border)] p-4">
                  <p className="text-sm font-medium text-[var(--foreground)]">{question.label}</p>
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {[0, 1, 2, 3].map((value) => (
                      <button
                        key={value}
                        type="button"
                        className={answers[question.key] === value ? "rounded-[16px] bg-[var(--rose-500)] px-3 py-2 text-sm font-medium text-white" : "rounded-[16px] border border-[var(--border)] px-3 py-2 text-sm text-[var(--foreground)] transition hover:bg-[var(--slate-50)]"}
                        onClick={() => setAnswers((current) => ({ ...current, [question.key]: value }))}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setActiveAssessment(null)}>Cancel</Button>
              <Button onClick={submitAssessment}>Save assessment</Button>
            </div>
          </Card>
        </div>
      ) : null}

      <Card className="grid gap-4 p-6 md:grid-cols-3">
        <div className="rounded-[22px] bg-[var(--slate-50)] p-5"><div className="flex items-center gap-3"><Brain className="h-5 w-5 text-[var(--teal-700)]" /><p className="font-medium">Mood support</p></div><p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">A short provider message can help interpret persistent mood shifts before they build into a harder week.</p></div>
        <div className="rounded-[22px] bg-[var(--slate-50)] p-5"><div className="flex items-center gap-3"><MoonStar className="h-5 w-5 text-[var(--teal-700)]" /><p className="font-medium">Sleep reset</p></div><p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">Try the same bedtime and wake window for three nights to improve recovery signal in your tracker.</p></div>
        <div className="rounded-[22px] bg-[var(--slate-50)] p-5"><div className="flex items-center gap-3"><HeartPulse className="h-5 w-5 text-[var(--rose-600)]" /><p className="font-medium">Symptom pacing</p></div><p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">Fewer, more detailed logs often help your care team spot patterns faster than many short entries.</p></div>
      </Card>
    </div>
  );
}