import { z } from "zod";

export const carePlanStatusSchema = z.enum(["active", "paused", "completed"]);
export const carePlanMilestoneCategorySchema = z.enum([
  "lifestyle",
  "medication",
  "appointment",
  "nutrition",
  "exercise",
  "mental_health",
]);

export const providerCarePlanMilestoneSchema = z.object({
  title: z.string().min(2, "Milestone title is required."),
  description: z.string().default(""),
  targetDate: z.string().min(1, "Target date is required."),
  category: carePlanMilestoneCategorySchema,
  completed: z.boolean().default(false),
});

export const providerCarePlanPayloadSchema = z.object({
  patientId: z.string().uuid("Select a patient."),
  title: z.string().min(3, "Title is required."),
  description: z.string().min(10, "Description is required."),
  status: carePlanStatusSchema.default("active"),
  startDate: z.string().min(1, "Start date is required."),
  endDate: z.string().optional().or(z.literal("")),
  milestones: z.array(providerCarePlanMilestoneSchema).min(1, "Add at least one milestone.").max(10, "You can add up to 10 milestones."),
});

export type ProviderCarePlanMilestoneInput = z.infer<typeof providerCarePlanMilestoneSchema>;
export type ProviderCarePlanPayload = z.infer<typeof providerCarePlanPayloadSchema>;

export function normalizeCarePlanMilestones(value: unknown, fallbackDate = new Date().toISOString()): ProviderCarePlanMilestoneInput[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((milestone, index) => {
    const item = milestone as Record<string, unknown>;
    const targetDate = typeof item.targetDate === "string" && item.targetDate.length ? item.targetDate : fallbackDate;
    const category: ProviderCarePlanMilestoneInput["category"] = typeof item.category === "string" && carePlanMilestoneCategorySchema.safeParse(item.category).success
      ? (item.category as ProviderCarePlanMilestoneInput["category"])
      : "lifestyle";

    return {
      title: String(item.title ?? `Milestone ${index + 1}`),
      description: String(item.description ?? ""),
      targetDate,
      category,
      completed: Boolean(item.completed),
    };
  });
}

export function getCarePlanProgress(milestones: Array<{ completed: boolean }>) {
  const completedMilestones = milestones.filter((milestone) => milestone.completed).length;
  const totalMilestones = milestones.length;

  return {
    completedMilestones,
    totalMilestones,
    progress: totalMilestones ? Math.round((completedMilestones / totalMilestones) * 100) : 0,
  };
}

export function getCarePlanDateRange({
  createdAt,
  startDate,
  endDate,
  milestones,
}: {
  createdAt?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  milestones: Array<{ targetDate: string }>;
}) {
  const derivedEndDate = milestones
    .map((milestone) => milestone.targetDate)
    .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0];

  return {
    startDate: startDate ?? createdAt ?? new Date().toISOString(),
    endDate: endDate ?? derivedEndDate ?? null,
  };
}
