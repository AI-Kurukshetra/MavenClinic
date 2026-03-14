import { z } from "zod";

export const healthGoals = [
  "Manage my cycle",
  "Start a family",
  "Navigate pregnancy",
  "Menopause support",
  "Mental wellness",
  "General health",
] as const;

export const existingConditions = [
  "PCOS",
  "Endometriosis",
  "Thyroid condition",
  "Migraine",
  "Anxiety",
  "None of these",
] as const;

export const insuranceCarriers = [
  "Aetna",
  "Blue Cross",
  "Cigna",
  "UnitedHealthcare",
  "No insurance / Pay out of pocket",
] as const;

export const providerSpecialties = ["OB/GYN", "Fertility", "Mental Health", "Nutrition", "Menopause"] as const;

export const onboardingSteps = ["Personal", "Goals", "Current Health", "Insurance", "Preferences"] as const;

const requiredTrimmedString = (label: string) => z.string().trim().min(1, `${label} is required.`);

const isoDateString = z
  .string()
  .trim()
  .min(1, "Date of birth is required.")
  .refine((value) => !Number.isNaN(Date.parse(value)), "Enter a valid date of birth.");

const onboardingBaseSchema = z.object({
  fullName: requiredTrimmedString("Full name"),
  dateOfBirth: isoDateString,
  pronouns: requiredTrimmedString("Pronouns"),
  languagePreference: requiredTrimmedString("Language preference"),
  healthGoals: z.array(z.enum(healthGoals)).min(1, "Choose at least one health goal."),
  conditions: z.array(z.enum(existingConditions)).min(1, "Choose at least one current health condition option."),
  medications: requiredTrimmedString("Current medications"),
  insuranceCarrier: z.enum(insuranceCarriers, {
    error: () => ({ message: "Choose an insurance carrier." }),
  }),
  memberId: z.string().trim(),
  specialtyNeeded: z.enum(providerSpecialties, {
    error: () => ({ message: "Choose a specialty need." }),
  }),
  preferredLanguage: requiredTrimmedString("Preferred provider language"),
  genderPreference: requiredTrimmedString("Provider gender preference"),
});

function withInsuranceValidation<T extends z.ZodTypeAny>(schema: T) {
  return schema.superRefine((value, context) => {
    const payload = value as { insuranceCarrier?: string; memberId?: string };

    if (payload.insuranceCarrier !== "No insurance / Pay out of pocket" && !payload.memberId?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["memberId"],
        message: "Insurance member ID is required unless you are paying out of pocket.",
      });
    }
  });
}

export const onboardingSchema = withInsuranceValidation(onboardingBaseSchema);

export const onboardingStepSchemas = [
  onboardingBaseSchema.pick({
    fullName: true,
    dateOfBirth: true,
    pronouns: true,
    languagePreference: true,
  }),
  onboardingBaseSchema.pick({
    healthGoals: true,
  }),
  onboardingBaseSchema.pick({
    conditions: true,
    medications: true,
  }),
  withInsuranceValidation(
    onboardingBaseSchema.pick({
      insuranceCarrier: true,
      memberId: true,
    }),
  ),
  onboardingBaseSchema.pick({
    specialtyNeeded: true,
    preferredLanguage: true,
    genderPreference: true,
  }),
] as const;

export type OnboardingFormValues = z.infer<typeof onboardingSchema>;

export function getOnboardingValidationMessage(result: { success: boolean; error?: { issues?: Array<{ message?: string }> } }) {
  if (result.success) {
    return "";
  }

  return result.error?.issues?.[0]?.message ?? "Please review the highlighted step.";
}
