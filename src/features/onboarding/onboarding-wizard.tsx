"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HealthChip } from "@/components/ui/health-chip";
import {
  existingConditions,
  getOnboardingValidationMessage,
  healthGoals,
  insuranceCarriers,
  onboardingSchema,
  onboardingSteps,
  onboardingStepSchemas,
  providerSpecialties,
  type OnboardingFormValues,
} from "@/lib/onboarding";

const defaultForm: OnboardingFormValues = {
  fullName: "",
  dateOfBirth: "",
  pronouns: "She / her",
  languagePreference: "English",
  healthGoals: [],
  conditions: [],
  medications: "",
  insuranceCarrier: "Aetna",
  memberId: "",
  specialtyNeeded: "OB/GYN",
  preferredLanguage: "English",
  genderPreference: "No preference",
};

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [form, setForm] = useState<OnboardingFormValues>(defaultForm);
  const progress = useMemo(() => ((step + 1) / onboardingSteps.length) * 100, [step]);

  function updateField<K extends keyof OnboardingFormValues>(field: K, value: OnboardingFormValues[K]) {
    setError("");
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleValue(field: "healthGoals" | "conditions", value: string) {
    setError("");
    setForm((current) => ({
      ...current,
      [field]: current[field].includes(value as never)
        ? current[field].filter((item) => item !== value)
        : [...current[field], value as never],
    }));
  }

  function validateCurrentStep() {
    const result = onboardingStepSchemas[step].safeParse(form);

    if (result.success) {
      setError("");
      return true;
    }

    setError(getOnboardingValidationMessage(result));
    return false;
  }

  function handleContinue() {
    if (!validateCurrentStep()) {
      return;
    }

    setStep((current) => current + 1);
  }

  function handleSubmit() {
    const parsed = onboardingSchema.safeParse(form);

    if (!parsed.success) {
      setError(getOnboardingValidationMessage(parsed));
      return;
    }

    setError("");
    startTransition(async () => {
      const response = await fetch("/api/profile/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Unable to save onboarding details.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-3xl overflow-hidden p-0">
        <div className="h-2 w-full bg-[var(--slate-100)]">
          <div className="h-full bg-[var(--rose-500)] transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="space-y-10 p-8 sm:p-10">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-[var(--rose-700)]">
              Step {step + 1} of {onboardingSteps.length}
            </p>
            <h1 className="mt-3 text-4xl font-semibold">{onboardingSteps[step]}</h1>
          </div>

          {step === 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm text-[var(--foreground-muted)]">Full name</span>
                <input
                  value={form.fullName}
                  onChange={(event) => updateField("fullName", event.target.value)}
                  className="w-full rounded-2xl border border-[var(--border)] px-4 py-3"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-[var(--foreground-muted)]">Date of birth</span>
                <input
                  value={form.dateOfBirth}
                  onChange={(event) => updateField("dateOfBirth", event.target.value)}
                  type="date"
                  className="w-full rounded-2xl border border-[var(--border)] px-4 py-3"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-[var(--foreground-muted)]">Pronouns</span>
                <input
                  value={form.pronouns}
                  onChange={(event) => updateField("pronouns", event.target.value)}
                  className="w-full rounded-2xl border border-[var(--border)] px-4 py-3"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-[var(--foreground-muted)]">Language preference</span>
                <input
                  value={form.languagePreference}
                  onChange={(event) => updateField("languagePreference", event.target.value)}
                  className="w-full rounded-2xl border border-[var(--border)] px-4 py-3"
                />
              </label>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="flex flex-wrap gap-3">
              {healthGoals.map((goal) => (
                <HealthChip
                  key={goal}
                  label={goal}
                  selected={form.healthGoals.includes(goal)}
                  onToggle={() => toggleValue("healthGoals", goal)}
                />
              ))}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-3">
                {existingConditions.map((condition) => (
                  <HealthChip
                    key={condition}
                    label={condition}
                    selected={form.conditions.includes(condition)}
                    onToggle={() => toggleValue("conditions", condition)}
                  />
                ))}
              </div>
              <label className="block space-y-2">
                <span className="text-sm text-[var(--foreground-muted)]">Current medications</span>
                <textarea
                  value={form.medications}
                  onChange={(event) => updateField("medications", event.target.value)}
                  className="min-h-32 w-full rounded-[24px] border border-[var(--border)] px-4 py-3"
                />
              </label>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm text-[var(--foreground-muted)]">Carrier</span>
                <select
                  value={form.insuranceCarrier}
                  onChange={(event) => updateField("insuranceCarrier", event.target.value as OnboardingFormValues["insuranceCarrier"])}
                  className="w-full rounded-2xl border border-[var(--border)] px-4 py-3"
                >
                  {insuranceCarriers.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm text-[var(--foreground-muted)]">Member ID</span>
                <input
                  value={form.memberId}
                  onChange={(event) => updateField("memberId", event.target.value)}
                  placeholder="Required unless paying out of pocket"
                  className="w-full rounded-2xl border border-[var(--border)] px-4 py-3"
                />
              </label>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm text-[var(--foreground-muted)]">Specialty needed</span>
                <select
                  value={form.specialtyNeeded}
                  onChange={(event) => updateField("specialtyNeeded", event.target.value as OnboardingFormValues["specialtyNeeded"])}
                  className="w-full rounded-2xl border border-[var(--border)] px-4 py-3"
                >
                  {providerSpecialties.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm text-[var(--foreground-muted)]">Preferred provider language</span>
                <input
                  value={form.preferredLanguage}
                  onChange={(event) => updateField("preferredLanguage", event.target.value)}
                  className="w-full rounded-2xl border border-[var(--border)] px-4 py-3"
                />
              </label>
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm text-[var(--foreground-muted)]">Provider gender preference</span>
                <input
                  value={form.genderPreference}
                  onChange={(event) => updateField("genderPreference", event.target.value)}
                  className="w-full rounded-2xl border border-[var(--border)] px-4 py-3"
                />
              </label>
            </div>
          ) : null}

          {error ? <div className="rounded-2xl bg-[var(--rose-50)] px-4 py-3 text-sm text-[var(--rose-700)]">{error}</div> : null}

          <div className="flex items-center justify-between gap-4 border-t border-[var(--border)] pt-6">
            <Button
              variant="ghost"
              onClick={() => {
                setError("");
                setStep((current) => Math.max(current - 1, 0));
              }}
              disabled={step === 0 || isPending}
            >
              Back
            </Button>
            <Button onClick={() => (step === onboardingSteps.length - 1 ? handleSubmit() : handleContinue())} disabled={isPending}>
              {step === onboardingSteps.length - 1 ? (isPending ? "Saving..." : "Complete onboarding") : "Continue"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
