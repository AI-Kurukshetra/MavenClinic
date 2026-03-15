import { z } from "zod";
import { requireApiUser } from "@/lib/api-auth";
import { apiError, apiSuccess } from "@/lib/api-response";

const milestoneMutationSchema = z.object({
  milestoneIndex: z.number().int().min(0),
  completed: z.boolean(),
});

type CarePlanMilestone = {
  title: string;
  description: string;
  targetDate: string;
  completed: boolean;
  category: string;
};

function parseMilestones(value: unknown): CarePlanMilestone[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((milestone, index) => {
    const item = milestone as Record<string, unknown>;
    return {
      title: String(item.title ?? `Milestone ${index + 1}`),
      description: String(item.description ?? ""),
      targetDate: String(item.targetDate ?? new Date().toISOString()),
      completed: Boolean(item.completed),
      category: String(item.category ?? "general"),
    } satisfies CarePlanMilestone;
  });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireApiUser();

    if ("error" in authResult) {
      return authResult.error;
    }

    const payload = milestoneMutationSchema.safeParse(await request.json());

    if (!payload.success) {
      return apiError(400, "invalid_care_plan_milestone", payload.error.issues[0]?.message ?? "Invalid milestone update.");
    }

    const { id } = await context.params;
    const { user, supabase } = authResult.context;
    const { data: carePlan, error: carePlanError } = await supabase
      .from("care_plans")
      .select("id, patient_id, milestones")
      .eq("id", id)
      .eq("patient_id", user.id)
      .maybeSingle();

    if (carePlanError) {
      return apiError(500, "care_plan_lookup_failed", "Unable to load this care plan.");
    }

    if (!carePlan) {
      return apiError(404, "care_plan_not_found", "Care plan not found.");
    }

    const milestones = parseMilestones(carePlan.milestones);
    const milestone = milestones[payload.data.milestoneIndex];

    if (!milestone) {
      return apiError(404, "milestone_not_found", "Milestone not found.");
    }

    const updatedMilestones = milestones.map((item, index) =>
      index === payload.data.milestoneIndex ? { ...item, completed: payload.data.completed } : item,
    );

    const { error: updateError } = await supabase
      .from("care_plans")
      .update({ milestones: updatedMilestones })
      .eq("id", id)
      .eq("patient_id", user.id);

    if (updateError) {
      return apiError(500, "care_plan_update_failed", "Unable to update this milestone right now.");
    }

    const completedMilestones = updatedMilestones.filter((item) => item.completed).length;

    return apiSuccess({
      carePlan: {
        id,
        milestones: updatedMilestones.map((item, index) => ({ ...item, index })),
        completedMilestones,
        totalMilestones: updatedMilestones.length,
        progress: updatedMilestones.length ? Math.round((completedMilestones / updatedMilestones.length) * 100) : 0,
      },
    });
  } catch {
    return apiError(500, "care_plan_update_failed", "Unable to update this milestone right now.");
  }
}
