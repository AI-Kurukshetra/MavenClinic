"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ClipboardList, LoaderCircle, Plus, Search, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Toast } from "@/components/ui/Toast";
import { carePlanStatusSchema, providerCarePlanPayloadSchema, type ProviderCarePlanMilestoneInput } from "@/lib/care-plans";
import type { ProviderCarePlanListItem, ProviderCarePlanPatientOption, ProviderCarePlansPageData, ProviderCarePlanTemplateOption } from "@/lib/data";
import { cn, formatDate, titleCase } from "@/lib/utils";

type Props = ProviderCarePlansPageData & {
  initialPatientId?: string | null;
};

type ToastState = {
  message: string;
  variant: "success" | "error" | "info";
};

type FormState = {
  patientId: string;
  title: string;
  description: string;
  status: "active" | "paused" | "completed";
  startDate: string;
  endDate: string;
  milestones: ProviderCarePlanMilestoneInput[];
};

const milestoneCategories: Array<ProviderCarePlanMilestoneInput["category"]> = [
  "lifestyle",
  "medication",
  "appointment",
  "nutrition",
  "exercise",
  "mental_health",
];

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getEmptyMilestone(targetDate = getTodayDate()): ProviderCarePlanMilestoneInput {
  return {
    title: "",
    description: "",
    targetDate,
    category: "lifestyle",
    completed: false,
  };
}

function getEmptyForm(initialPatientId?: string | null): FormState {
  const today = getTodayDate();
  return {
    patientId: initialPatientId ?? "",
    title: "",
    description: "",
    status: "active",
    startDate: today,
    endDate: "",
    milestones: [getEmptyMilestone(today)],
  };
}

function toDateInput(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function getStatusVariant(status: string) {
  if (status === "active") {
    return "success" as const;
  }

  if (status === "paused") {
    return "warning" as const;
  }

  return "neutral" as const;
}

function buildFormFromPlan(plan: ProviderCarePlanListItem): FormState {
  return {
    patientId: plan.patientId,
    title: plan.title,
    description: plan.description,
    status: carePlanStatusSchema.safeParse(plan.status).success ? (plan.status as FormState["status"]) : "active",
    startDate: toDateInput(plan.startDate),
    endDate: toDateInput(plan.endDate),
    milestones: plan.milestones.length ? plan.milestones.map((milestone) => ({ ...milestone, targetDate: toDateInput(milestone.targetDate) || getTodayDate() })) : [getEmptyMilestone()],
  };
}

function buildTemplateMilestones(template: ProviderCarePlanTemplateOption, startDate: string) {
  return template.milestones.length
    ? template.milestones.map((milestone) => ({
        ...milestone,
        completed: false,
        targetDate: toDateInput(milestone.targetDate) || startDate,
      }))
    : [getEmptyMilestone(startDate)];
}

function buildPlanFromResponse(
  carePlan: {
    id: string;
    patientId: string;
    title: string;
    description: string;
    status: string;
    milestones: ProviderCarePlanMilestoneInput[];
    createdAt: string;
    startDate: string;
    endDate: string | null;
  },
  patient: ProviderCarePlanPatientOption | undefined,
): ProviderCarePlanListItem {
  const completedMilestones = carePlan.milestones.filter((milestone) => milestone.completed).length;
  const totalMilestones = carePlan.milestones.length;

  return {
    id: carePlan.id,
    patientId: carePlan.patientId,
    patientName: patient?.name ?? "Patient",
    patientAvatarUrl: patient?.avatarUrl ?? null,
    title: carePlan.title,
    description: carePlan.description,
    status: carePlan.status,
    createdAt: carePlan.createdAt,
    startDate: carePlan.startDate,
    endDate: carePlan.endDate,
    completedMilestones,
    totalMilestones,
    progress: totalMilestones ? Math.round((completedMilestones / totalMilestones) * 100) : 0,
    milestones: carePlan.milestones,
  };
}

export function ProviderCarePlansPage({ plans: initialPlans, patients, templates, initialPatientId }: Props) {
  const [plans, setPlans] = useState(initialPlans);
  const [form, setForm] = useState<FormState>(() => getEmptyForm(initialPatientId));
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [saving, setSaving] = useState(false);
  const [patientQuery, setPatientQuery] = useState("");
  const [templateId, setTemplateId] = useState("");

  const filteredPatients = useMemo(() => {
    const query = patientQuery.trim().toLowerCase();

    if (!query) {
      return patients;
    }

    return patients.filter((patient) => patient.name.toLowerCase().includes(query));
  }, [patientQuery, patients]);

  const selectedPatient = patients.find((patient) => patient.id === form.patientId);
  const isEditing = Boolean(editingPlanId);

  function resetForm() {
    setEditingPlanId(null);
    setTemplateId("");
    setForm(getEmptyForm(initialPatientId));
  }

  function handleEdit(plan: ProviderCarePlanListItem) {
    setEditingPlanId(plan.id);
    setTemplateId("");
    setForm(buildFormFromPlan(plan));
  }

  function updateMilestone(index: number, updater: (milestone: ProviderCarePlanMilestoneInput) => ProviderCarePlanMilestoneInput) {
    setForm((current) => ({
      ...current,
      milestones: current.milestones.map((milestone, milestoneIndex) => (milestoneIndex === index ? updater(milestone) : milestone)),
    }));
  }

  function moveMilestone(index: number, direction: -1 | 1) {
    setForm((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.milestones.length) {
        return current;
      }

      const milestones = [...current.milestones];
      const [item] = milestones.splice(index, 1);
      milestones.splice(nextIndex, 0, item);
      return { ...current, milestones };
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = providerCarePlanPayloadSchema.safeParse(form);

    if (!payload.success) {
      setToast({
        message: payload.error.issues[0]?.message ?? "Please review the care plan details.",
        variant: "error",
      });
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(isEditing ? `/api/provider/care-plans/${editingPlanId}` : "/api/provider/care-plans", {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload.data),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to save this care plan.");
      }

      const nextPlan = buildPlanFromResponse(data.carePlan, patients.find((patient) => patient.id === data.carePlan.patientId));
      setPlans((current) => {
        if (isEditing) {
          return current.map((plan) => (plan.id === nextPlan.id ? nextPlan : plan));
        }

        return [nextPlan, ...current];
      });
      setToast({
        message: isEditing ? "Care plan updated." : "Care plan created and shared with the patient.",
        variant: "success",
      });

      if (isEditing) {
        setEditingPlanId(nextPlan.id);
        setForm(buildFormFromPlan(nextPlan));
      } else {
        resetForm();
      }
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Unable to save this care plan.",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {toast ? <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} /> : null}
      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Card className="space-y-5 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-[var(--rose-700)]">My care plans</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Provider-authored plans</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">Track every care journey you have created and jump back into editing at any time.</p>
            </div>
            <Button type="button" className="h-11 rounded-full px-5" onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              New care plan
            </Button>
          </div>

          {plans.length ? (
            <div className="space-y-3">
              {plans.map((plan) => (
                <div key={plan.id} className={cn("rounded-[24px] border p-4 transition", editingPlanId === plan.id ? "border-[var(--rose-300)] bg-[var(--rose-50)]/45" : "border-[var(--border)] bg-white") }>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar src={plan.patientAvatarUrl ?? undefined} name={plan.patientName} size="md" />
                      <div>
                        <p className="font-semibold text-[var(--foreground)]">{plan.patientName}</p>
                        <p className="text-sm text-[var(--foreground-muted)]">{plan.title}</p>
                      </div>
                    </div>
                    <Badge variant={getStatusVariant(plan.status)}>{titleCase(plan.status)}</Badge>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[var(--foreground-muted)]">
                    <span>{plan.completedMilestones} of {plan.totalMilestones} completed</span>
                    <span className="text-slate-300">|</span>
                    <span>{formatDate(plan.createdAt)}</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--slate-100)]">
                    <div className="h-full rounded-full bg-[var(--rose-500)]" style={{ width: `${plan.progress}%` }} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button type="button" variant="secondary" size="sm" className="rounded-xl" onClick={() => handleEdit(plan)}>
                      Edit
                    </Button>
                    <Link
                      href={`/provider/patients/${plan.patientId}`}
                      className="inline-flex h-9 cursor-pointer items-center justify-center rounded-xl border border-[var(--border)] px-4 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--slate-50)]"
                    >
                      View patient
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-[var(--border)] px-5 py-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--slate-50)] text-[var(--rose-600)]">
                <ClipboardList className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-xl font-semibold tracking-tight">No care plans created yet</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">Create your first care plan for a patient.</p>
            </div>
          )}
        </Card>

        <Card className="space-y-6 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-[var(--rose-700)]">{isEditing ? "Edit care plan" : "Create care plan"}</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">{isEditing ? "Update patient plan" : "Build a personalized care journey"}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">Select a patient, set the timeline, and outline the next milestones they should follow.</p>
            </div>
            {isEditing ? (
              <Button type="button" variant="ghost" size="sm" className="rounded-xl" onClick={resetForm}>
                <X className="mr-2 h-4 w-4" />
                Clear form
              </Button>
            ) : null}
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-3">
              <label className="space-y-2 text-sm font-medium text-[var(--foreground)]">
                <span>Use a template</span>
                <select
                  value={templateId}
                  onChange={(event) => {
                    const nextTemplateId = event.target.value;
                    setTemplateId(nextTemplateId);
                    const template = templates.find((item) => item.id === nextTemplateId);
                    if (!template) {
                      return;
                    }

                    setForm((current) => ({
                      ...current,
                      title: template.title,
                      description: template.description,
                      milestones: buildTemplateMilestones(template, current.startDate),
                    }));
                  }}
                  className="h-12 w-full rounded-2xl border border-[var(--border)] bg-white px-4 outline-none transition focus:border-[var(--rose-300)] focus:ring-2 focus:ring-[rgba(212,88,123,0.14)]"
                >
                  <option value="">Start from scratch</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>{template.title}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="space-y-4 rounded-[24px] border border-[var(--border)] p-5">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-[var(--rose-700)]">Step 1</p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight">Select patient</h3>
              </div>

              {!isEditing ? (
                <>
                  <label className="relative block">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={patientQuery}
                      onChange={(event) => setPatientQuery(event.target.value)}
                      placeholder="Search by patient name"
                      className="h-12 w-full rounded-2xl border border-[var(--border)] bg-white pl-11 pr-4 outline-none transition focus:border-[var(--rose-300)] focus:ring-2 focus:ring-[rgba(212,88,123,0.14)]"
                    />
                  </label>
                  <div className="grid max-h-72 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
                    {filteredPatients.map((patient) => {
                      const isSelected = form.patientId === patient.id;
                      return (
                        <button
                          key={patient.id}
                          type="button"
                          className={cn(
                            "flex cursor-pointer items-center gap-3 rounded-[22px] border p-4 text-left transition",
                            isSelected ? "border-[var(--rose-300)] bg-[var(--rose-50)]/55" : "border-[var(--border)] hover:bg-[var(--slate-50)]",
                          )}
                          onClick={() => setForm((current) => ({ ...current, patientId: patient.id }))}
                        >
                          <Avatar src={patient.avatarUrl ?? undefined} name={patient.name} size="md" />
                          <div>
                            <p className="font-medium text-[var(--foreground)]">{patient.name}</p>
                            <p className="text-sm text-[var(--foreground-muted)]">Last visit {formatDate(patient.lastVisit)}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {!filteredPatients.length ? <p className="text-sm text-[var(--foreground-muted)]">No patients match this search.</p> : null}
                </>
              ) : selectedPatient ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-[var(--border)] bg-[var(--slate-50)] p-4">
                  <div className="flex items-center gap-3">
                    <Avatar src={selectedPatient.avatarUrl ?? undefined} name={selectedPatient.name} size="md" />
                    <div>
                      <p className="font-medium text-[var(--foreground)]">{selectedPatient.name}</p>
                      <p className="text-sm text-[var(--foreground-muted)]">Patient is locked after plan creation.</p>
                    </div>
                  </div>
                  <Link href={`/provider/patients/${selectedPatient.id}`} className="text-sm font-medium text-[var(--rose-600)] transition hover:text-[var(--rose-700)]">
                    View patient
                  </Link>
                </div>
              ) : null}
            </div>

            <div className="space-y-4 rounded-[24px] border border-[var(--border)] p-5">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-[var(--rose-700)]">Step 2</p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight">Plan details</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-[var(--foreground)] md:col-span-2">
                  <span>Title</span>
                  <input
                    value={form.title}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                    placeholder="e.g. PCOS Management Plan"
                    className="h-12 w-full rounded-2xl border border-[var(--border)] bg-white px-4 outline-none transition focus:border-[var(--rose-300)] focus:ring-2 focus:ring-[rgba(212,88,123,0.14)]"
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-[var(--foreground)] md:col-span-2">
                  <span>Description</span>
                  <textarea
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    rows={4}
                    placeholder="Outline the goals and approach..."
                    className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--rose-300)] focus:ring-2 focus:ring-[rgba(212,88,123,0.14)]"
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-[var(--foreground)]">
                  <span>Status</span>
                  <select
                    value={form.status}
                    onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as FormState["status"] }))}
                    className="h-12 w-full rounded-2xl border border-[var(--border)] bg-white px-4 outline-none transition focus:border-[var(--rose-300)] focus:ring-2 focus:ring-[rgba(212,88,123,0.14)]"
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm font-medium text-[var(--foreground)]">
                  <span>Start date</span>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
                    className="h-12 w-full rounded-2xl border border-[var(--border)] bg-white px-4 outline-none transition focus:border-[var(--rose-300)] focus:ring-2 focus:ring-[rgba(212,88,123,0.14)]"
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-[var(--foreground)] md:col-span-2">
                  <span>End date (optional)</span>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
                    className="h-12 w-full rounded-2xl border border-[var(--border)] bg-white px-4 outline-none transition focus:border-[var(--rose-300)] focus:ring-2 focus:ring-[rgba(212,88,123,0.14)]"
                  />
                </label>
              </div>
            </div>

            <div className="space-y-4 rounded-[24px] border border-[var(--border)] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-[var(--rose-700)]">Step 3</p>
                  <h3 className="mt-2 text-xl font-semibold tracking-tight">Milestones</h3>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="rounded-xl"
                  disabled={form.milestones.length >= 10}
                  onClick={() => setForm((current) => ({
                    ...current,
                    milestones: [...current.milestones, getEmptyMilestone(current.startDate || getTodayDate())],
                  }))}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add milestone
                </Button>
              </div>

              <div className="space-y-4">
                {form.milestones.map((milestone, index) => (
                  <div key={`${index}-${milestone.title}`} className="rounded-[22px] border border-[var(--border)] bg-[var(--slate-50)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--rose-700)]">Milestone {index + 1}</p>
                      <div className="flex items-center gap-2">
                        <button type="button" className="rounded-full border border-[var(--border)] p-2 text-slate-500 transition hover:bg-white disabled:opacity-40" disabled={index === 0} onClick={() => moveMilestone(index, -1)}>
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button type="button" className="rounded-full border border-[var(--border)] p-2 text-slate-500 transition hover:bg-white disabled:opacity-40" disabled={index === form.milestones.length - 1} onClick={() => moveMilestone(index, 1)}>
                          <ArrowDown className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-[rgba(212,88,123,0.2)] p-2 text-[var(--rose-600)] transition hover:bg-white disabled:opacity-40"
                          disabled={form.milestones.length === 1}
                          onClick={() => setForm((current) => ({ ...current, milestones: current.milestones.filter((_, milestoneIndex) => milestoneIndex !== index) }))}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <label className="space-y-2 text-sm font-medium text-[var(--foreground)] md:col-span-2">
                        <span>Title</span>
                        <input
                          value={milestone.title}
                          onChange={(event) => updateMilestone(index, (current) => ({ ...current, title: event.target.value }))}
                          className="h-11 w-full rounded-2xl border border-[var(--border)] bg-white px-4 outline-none transition focus:border-[var(--rose-300)] focus:ring-2 focus:ring-[rgba(212,88,123,0.14)]"
                        />
                      </label>
                      <label className="space-y-2 text-sm font-medium text-[var(--foreground)] md:col-span-2">
                        <span>Description</span>
                        <textarea
                          value={milestone.description}
                          onChange={(event) => updateMilestone(index, (current) => ({ ...current, description: event.target.value }))}
                          rows={3}
                          className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--rose-300)] focus:ring-2 focus:ring-[rgba(212,88,123,0.14)]"
                        />
                      </label>
                      <label className="space-y-2 text-sm font-medium text-[var(--foreground)]">
                        <span>Target date</span>
                        <input
                          type="date"
                          value={milestone.targetDate}
                          onChange={(event) => updateMilestone(index, (current) => ({ ...current, targetDate: event.target.value }))}
                          className="h-11 w-full rounded-2xl border border-[var(--border)] bg-white px-4 outline-none transition focus:border-[var(--rose-300)] focus:ring-2 focus:ring-[rgba(212,88,123,0.14)]"
                        />
                      </label>
                      <label className="space-y-2 text-sm font-medium text-[var(--foreground)]">
                        <span>Category</span>
                        <select
                          value={milestone.category}
                          onChange={(event) => updateMilestone(index, (current) => ({ ...current, category: event.target.value as ProviderCarePlanMilestoneInput["category"] }))}
                          className="h-11 w-full rounded-2xl border border-[var(--border)] bg-white px-4 outline-none transition focus:border-[var(--rose-300)] focus:ring-2 focus:ring-[rgba(212,88,123,0.14)]"
                        >
                          {milestoneCategories.map((category) => (
                            <option key={category} value={category}>{titleCase(category)}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              <Button type="button" variant="secondary" className="rounded-xl" onClick={resetForm}>
                Reset
              </Button>
              <Button type="submit" className="rounded-xl" disabled={saving}>
                {saving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isEditing ? "Update care plan" : "Save care plan"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}

