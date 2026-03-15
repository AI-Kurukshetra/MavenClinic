"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarHeart,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  LoaderCircle,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Toast } from "@/components/ui/Toast";
import { cn, formatDate, formatRelativeTime, titleCase } from "@/lib/utils";

type CarePlanProvider = {
  id: string;
  name: string;
  avatarUrl?: string;
  specialty: string;
};

type CarePlanMilestone = {
  index: number;
  title: string;
  description: string;
  targetDate: string;
  completed: boolean;
  category: string;
};

type CarePlanView = {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  startDate: string;
  endDate?: string;
  progress: number;
  completedMilestones: number;
  totalMilestones: number;
  provider: CarePlanProvider;
  milestones: CarePlanMilestone[];
};

type Props = {
  activePlan: CarePlanView | null;
  previousPlans: CarePlanView[];
};

type ToastState = {
  message: string;
  variant: "success" | "error" | "info";
};

const categoryClasses: Record<string, string> = {
  lifestyle: "bg-[rgba(244,114,182,0.14)] text-[var(--rose-700)]",
  medication: "bg-[rgba(96,165,250,0.14)] text-sky-700",
  appointment: "bg-[rgba(251,191,36,0.16)] text-[var(--amber-700)]",
  nutrition: "bg-[rgba(74,222,128,0.14)] text-emerald-700",
  exercise: "bg-[rgba(45,212,191,0.14)] text-[var(--teal-700)]",
  mental_health: "bg-[rgba(168,85,247,0.14)] text-violet-700",
  tracking: "bg-[rgba(45,212,191,0.14)] text-[var(--teal-700)]",
  planning: "bg-[rgba(251,191,36,0.16)] text-[var(--amber-700)]",
  care: "bg-[rgba(96,165,250,0.14)] text-sky-700",
  general: "bg-[rgba(148,163,184,0.14)] text-slate-600",
};

function getStatusBadgeVariant(status: string) {
  if (status === "active") {
    return "success" as const;
  }

  if (status === "paused") {
    return "warning" as const;
  }

  return "neutral" as const;
}

function getCategoryClass(category: string) {
  return categoryClasses[category] ?? categoryClasses.general;
}

function getMilestoneBucket(milestone: CarePlanMilestone, currentTime: number) {
  if (milestone.completed) {
    return "completed" as const;
  }

  return new Date(milestone.targetDate).getTime() < currentTime ? "overdue" as const : "inProgress" as const;
}

function getStatusLabel(status: string) {
  return titleCase(status);
}

function getGroupedMilestones(plan: CarePlanView | null, currentTime: number) {
  if (!plan) {
    return {
      inProgress: [] as CarePlanMilestone[],
      overdue: [] as CarePlanMilestone[],
      completed: [] as CarePlanMilestone[],
    };
  }

  return plan.milestones.reduce(
    (groups, milestone) => {
      const bucket = getMilestoneBucket(milestone, currentTime);
      groups[bucket].push(milestone);
      return groups;
    },
    {
      inProgress: [] as CarePlanMilestone[],
      overdue: [] as CarePlanMilestone[],
      completed: [] as CarePlanMilestone[],
    },
  );
}

function MilestoneSection({
  title,
  description,
  milestones,
  expandedMilestones,
  onToggleExpanded,
  onToggleCompleted,
  pendingMilestone,
  currentTime,
}: {
  title: string;
  description: string;
  milestones: CarePlanMilestone[];
  expandedMilestones: Record<string, boolean>;
  onToggleExpanded: (key: string) => void;
  onToggleCompleted: (milestone: CarePlanMilestone, completed: boolean) => void;
  pendingMilestone: string | null;
  currentTime: number;
}) {
  if (!milestones.length) {
    return null;
  }

  return (
    <Card className="space-y-4 p-5 sm:p-6">
      <div>
        <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">{description}</p>
      </div>
      <div className="space-y-4">
        {milestones.map((milestone) => {
          const milestoneKey = `${milestone.index}-${milestone.title}`;
          const isExpanded = Boolean(expandedMilestones[milestoneKey]);
          const isPending = pendingMilestone === milestoneKey;
          const overdue = !milestone.completed && new Date(milestone.targetDate).getTime() < currentTime;

          return (
            <div key={milestoneKey} className="relative pl-8">
              <div className="absolute left-3 top-11 h-[calc(100%-1rem)] w-px bg-[var(--border)]" />
              <button
                type="button"
                aria-label={milestone.completed ? `Mark ${milestone.title} incomplete` : `Mark ${milestone.title} complete`}
                className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--teal-700)] transition hover:border-[var(--rose-300)] hover:bg-[var(--rose-50)]"
                disabled={isPending}
                onClick={() => onToggleCompleted(milestone, !milestone.completed)}
              >
                {isPending ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : milestone.completed ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--border-strong)]" />
                )}
              </button>

              <button
                type="button"
                className="w-full rounded-[22px] border border-[var(--border)] bg-[var(--slate-50)] px-4 py-4 text-left transition hover:bg-white"
                onClick={() => onToggleExpanded(milestoneKey)}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={cn("font-semibold text-[var(--foreground)]", milestone.completed && "text-[var(--foreground-muted)] line-through")}>
                        {milestone.title}
                      </p>
                      <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold", getCategoryClass(milestone.category))}>
                        {titleCase(milestone.category)}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[var(--foreground-muted)]">
                      <Clock3 className="h-4 w-4" />
                      <span className={overdue ? "font-medium text-[var(--rose-600)]" : undefined}>
                        {overdue ? `Overdue ${formatRelativeTime(milestone.targetDate)}` : `Target ${formatDate(milestone.targetDate)}`}
                      </span>
                    </div>
                  </div>
                  {isExpanded ? <ChevronDown className="h-5 w-5 text-[var(--foreground-muted)]" /> : <ChevronRight className="h-5 w-5 text-[var(--foreground-muted)]" />}
                </div>
                {isExpanded ? (
                  <p className="mt-3 text-sm leading-7 text-[var(--foreground-muted)]">{milestone.description}</p>
                ) : null}
              </button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function PatientCarePlansPage({ activePlan: initialActivePlan, previousPlans }: Props) {
  const [activePlan, setActivePlan] = useState(initialActivePlan);
  const [expandedMilestones, setExpandedMilestones] = useState<Record<string, boolean>>({});
  const [showPreviousPlans, setShowPreviousPlans] = useState(false);
  const [pendingMilestone, setPendingMilestone] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [currentTime] = useState(() => Date.now());

  const groupedMilestones = useMemo(() => getGroupedMilestones(activePlan, currentTime), [activePlan, currentTime]);

  async function handleMilestoneToggle(milestone: CarePlanMilestone, completed: boolean) {
    if (!activePlan) {
      return;
    }

    const milestoneKey = `${milestone.index}-${milestone.title}`;
    const previousPlan = activePlan;
    const nextMilestones = activePlan.milestones.map((item) =>
      item.index === milestone.index ? { ...item, completed } : item,
    );
    const completedCount = nextMilestones.filter((item) => item.completed).length;
    const nextPlan = {
      ...activePlan,
      milestones: nextMilestones,
      completedMilestones: completedCount,
      progress: nextMilestones.length ? Math.round((completedCount / nextMilestones.length) * 100) : 0,
    };

    setActivePlan(nextPlan);
    setPendingMilestone(milestoneKey);

    try {
      const response = await fetch(`/api/care-plans/${activePlan.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          milestoneIndex: milestone.index,
          completed,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to update this milestone.");
      }

      setActivePlan((current) =>
        current
          ? {
              ...current,
              milestones: data.carePlan.milestones,
              completedMilestones: data.carePlan.completedMilestones,
              totalMilestones: data.carePlan.totalMilestones,
              progress: data.carePlan.progress,
            }
          : current,
      );
      setToast({
        message: completed ? "Milestone marked complete." : "Milestone moved back to in progress.",
        variant: "success",
      });
    } catch (error) {
      setActivePlan(previousPlan);
      setToast({
        message: error instanceof Error ? error.message : "Unable to update this milestone.",
        variant: "error",
      });
    } finally {
      setPendingMilestone(null);
    }
  }

  if (!activePlan && !previousPlans.length) {
    return (
      <>
        {toast ? <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} /> : null}
        <Card className="border-dashed text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--slate-50)] text-[var(--rose-600)]">
            <CalendarHeart className="h-8 w-8" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold tracking-tight">No care plans yet</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[var(--foreground-muted)]">
            Your provider will create a personalized care plan after your first consultation.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              href="/appointments"
              className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--rose-500)] px-6 text-sm font-medium text-white shadow-[0_12px_30px_rgba(212,88,123,0.28)] transition hover:bg-[var(--rose-600)]"
            >
              Book a consultation
            </Link>
          </div>
        </Card>
      </>
    );
  }

  return (
    <>
      {toast ? <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} /> : null}
      <div className="space-y-6">
        {activePlan ? (
          <Card className="overflow-hidden p-0">
            <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-5 p-6 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar src={activePlan.provider.avatarUrl} name={activePlan.provider.name} size="lg" />
                    <div>
                      <p className="text-sm uppercase tracking-[0.18em] text-[var(--rose-700)]">Active care plan</p>
                      <h2 className="mt-2 text-3xl font-semibold tracking-tight">{activePlan.title}</h2>
                      <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                        {activePlan.provider.name}
                        <span className="mx-2 text-slate-300">|</span>
                        {activePlan.provider.specialty}
                      </p>
                    </div>
                  </div>
                  <Badge variant={getStatusBadgeVariant(activePlan.status)}>{getStatusLabel(activePlan.status)}</Badge>
                </div>

                <p className="max-w-2xl text-sm leading-7 text-[var(--foreground-muted)]">{activePlan.description}</p>

                <div className="flex flex-wrap gap-6 text-sm text-[var(--foreground-muted)]">
                  <div>
                    <p className="uppercase tracking-[0.16em] text-[var(--rose-700)]">Timeline</p>
                    <p className="mt-2 font-medium text-[var(--foreground)]">
                      {formatDate(activePlan.startDate)}
                      {activePlan.endDate ? ` - ${formatDate(activePlan.endDate)}` : " - Ongoing"}
                    </p>
                  </div>
                  <div>
                    <p className="uppercase tracking-[0.16em] text-[var(--rose-700)]">Provider</p>
                    <p className="mt-2 font-medium text-[var(--foreground)]">{activePlan.provider.name}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-[var(--border)] bg-[var(--slate-50)] p-6 sm:p-8 lg:border-l lg:border-t-0">
                <p className="text-sm uppercase tracking-[0.18em] text-[var(--rose-700)]">Progress</p>
                <div className="mt-4 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-4xl font-semibold tracking-tight">{activePlan.progress}%</p>
                    <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                      {activePlan.completedMilestones} of {activePlan.totalMilestones} milestones completed
                    </p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-[var(--teal-700)]" />
                </div>
                <div className="mt-5 h-3 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-[var(--rose-500)] transition-all" style={{ width: `${activePlan.progress}%` }} />
                </div>
                <div className="mt-6 rounded-[22px] border border-[var(--border)] bg-white px-4 py-4 text-sm text-[var(--foreground-muted)]">
                  Stay consistent with the steps your provider set for you. Each completed milestone makes your next visit more targeted.
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="flex items-start gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--slate-50)] text-[var(--teal-700)]">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">No active care plan right now</h2>
              <p className="mt-2 text-sm leading-7 text-[var(--foreground-muted)]">
                Your previous care plans stay here for reference. Your provider will add a new one when your next plan is ready.
              </p>
            </div>
          </Card>
        )}

        {activePlan ? (
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <MilestoneSection
              title="In progress"
              description="These milestones are on track and still open."
              milestones={groupedMilestones.inProgress}
              expandedMilestones={expandedMilestones}
              onToggleExpanded={(key) => setExpandedMilestones((current) => ({ ...current, [key]: !current[key] }))}
              onToggleCompleted={handleMilestoneToggle}
              pendingMilestone={pendingMilestone}
              currentTime={currentTime}
            />
            <div className="space-y-6">
              <MilestoneSection
                title="Overdue"
                description="These steps need attention before your next follow-up."
                milestones={groupedMilestones.overdue}
                expandedMilestones={expandedMilestones}
                onToggleExpanded={(key) => setExpandedMilestones((current) => ({ ...current, [key]: !current[key] }))}
                onToggleCompleted={handleMilestoneToggle}
                pendingMilestone={pendingMilestone}
                currentTime={currentTime}
              />
              <MilestoneSection
                title="Completed"
                description="Completed milestones stay here so you and your provider can track progress over time."
                milestones={groupedMilestones.completed}
                expandedMilestones={expandedMilestones}
                onToggleExpanded={(key) => setExpandedMilestones((current) => ({ ...current, [key]: !current[key] }))}
                onToggleCompleted={handleMilestoneToggle}
                pendingMilestone={pendingMilestone}
                currentTime={currentTime}
              />
            </div>
          </div>
        ) : null}

        {previousPlans.length ? (
          <Card className="space-y-4 p-5 sm:p-6">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 text-left"
              onClick={() => setShowPreviousPlans((current) => !current)}
            >
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-[var(--rose-700)]">History</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">Previous care plans</h2>
              </div>
              {showPreviousPlans ? <ChevronDown className="h-5 w-5 text-[var(--foreground-muted)]" /> : <ChevronRight className="h-5 w-5 text-[var(--foreground-muted)]" />}
            </button>

            {showPreviousPlans ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {previousPlans.map((plan) => (
                  <div key={plan.id} className="rounded-[24px] border border-[var(--border)] bg-[var(--slate-50)] p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold tracking-tight">{plan.title}</p>
                        <p className="mt-1 text-sm text-[var(--foreground-muted)]">{plan.provider.name}</p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(plan.status)}>{getStatusLabel(plan.status)}</Badge>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[var(--foreground-muted)]">{plan.description}</p>
                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-[var(--foreground-muted)]">
                      <span>{formatDate(plan.startDate)}</span>
                      <span className="text-slate-300">|</span>
                      <span>{plan.endDate ? formatDate(plan.endDate) : "No end date"}</span>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-4">
                      <p className="text-sm font-medium text-[var(--foreground)]">{plan.progress}% complete</p>
                      <p className="text-sm text-[var(--foreground-muted)]">{plan.completedMilestones}/{plan.totalMilestones} milestones</p>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                      <div className="h-full rounded-full bg-[var(--rose-400)]" style={{ width: `${plan.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </Card>
        ) : null}

        <Card className="flex items-start gap-4 border-[rgba(61,191,173,0.22)] bg-[rgba(61,191,173,0.08)] p-5 sm:p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[var(--teal-700)]">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-semibold tracking-tight">Need clarification on a milestone?</h3>
            <p className="mt-2 text-sm leading-7 text-[var(--foreground-muted)]">
              Message your provider if you want help understanding a step, adjusting timing, or sharing progress before your next appointment.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/messages?topic=your%20care%20plan"
                className="inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-medium text-[var(--teal-700)] transition hover:bg-[var(--slate-50)]"
              >
                Ask your provider
              </Link>
              <Link
                href="/appointments"
                className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--border)] bg-transparent px-5 text-sm font-medium text-[var(--foreground)] transition hover:bg-white"
              >
                Book follow-up visit
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
