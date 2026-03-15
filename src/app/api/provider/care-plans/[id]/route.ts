import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireApiRole, type ApiAuthContext } from "@/lib/api-auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { normalizeCarePlanMilestones, providerCarePlanPayloadSchema } from "@/lib/care-plans";
import { sanitizeNullableText, sanitizeText } from "@/lib/sanitize";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const paramsSchema = z.object({
  id: z.string().uuid("Invalid care plan id."),
});

function isMissingCarePlanDateColumnError(error: { message?: string } | null) {
  return Boolean(error?.message?.includes("start_date") || error?.message?.includes("end_date"));
}

async function getProviderContext(): Promise<
  | { error: Response }
  | { context: ApiAuthContext; providerId: string }
> {
  const authResult = await requireApiRole(["provider"]);

  if ("error" in authResult) {
    return { error: authResult.error ?? apiError(401, "unauthorized", "Unauthorized") };
  }

  const { context } = authResult;
  const { data: providerRow, error } = await context.supabase
    .from("providers")
    .select("id")
    .eq("profile_id", context.user.id)
    .maybeSingle();

  if (error || !providerRow?.id) {
    return { error: apiError(403, "provider_not_found", "Provider access is unavailable.") };
  }

  return {
    context,
    providerId: providerRow.id,
  };
}

type SupabaseServerClient = Awaited<ReturnType<typeof getSupabaseServerClient>>;

async function updateCarePlanWithFallback(supabase: SupabaseServerClient, planId: string, providerId: string, values: {
  title: string;
  description: string;
  status: string;
  start_date: string;
  end_date: string | null;
  milestones: ReturnType<typeof normalizeCarePlanMilestones>;
}) {
  const primaryResult = await supabase
    .from("care_plans")
    .update(values)
    .eq("id", planId)
    .eq("provider_id", providerId)
    .select("id, patient_id, provider_id, title, description, status, milestones, created_at, start_date, end_date")
    .single();

  if (!isMissingCarePlanDateColumnError(primaryResult.error)) {
    return primaryResult;
  }

  const fallbackResult = await supabase
    .from("care_plans")
    .update({
      title: values.title,
      description: values.description,
      status: values.status,
      milestones: values.milestones,
    })
    .eq("id", planId)
    .eq("provider_id", providerId)
    .select("id, patient_id, provider_id, title, description, status, milestones, created_at")
    .single();

  return {
    data: fallbackResult.data ? { ...fallbackResult.data, start_date: null, end_date: null } : null,
    error: fallbackResult.error,
  };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const providerResult = await getProviderContext();
    if ("error" in providerResult) {
      return providerResult.error;
    }

    const parsedParams = paramsSchema.safeParse(await params);
    if (!parsedParams.success) {
      return apiError(400, "invalid_care_plan", parsedParams.error.issues[0]?.message ?? "Invalid care plan.");
    }

    const body = await request.json();
    const parsed = providerCarePlanPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(400, "invalid_care_plan", parsed.error.issues[0]?.message ?? "Invalid care plan.");
    }

    const payload = parsed.data;
    const milestones = normalizeCarePlanMilestones(
      payload.milestones.map((milestone) => ({
        title: sanitizeText(milestone.title),
        description: sanitizeText(milestone.description),
        targetDate: milestone.targetDate,
        category: milestone.category,
        completed: Boolean(milestone.completed),
      })),
      payload.startDate,
    );

    const { data: existingPlan, error: existingPlanError } = await providerResult.context.supabase
      .from("care_plans")
      .select("id, patient_id")
      .eq("id", parsedParams.data.id)
      .eq("provider_id", providerResult.providerId)
      .maybeSingle();

    if (existingPlanError || !existingPlan?.patient_id) {
      return apiError(404, "care_plan_not_found", "Care plan not found.");
    }

    const updateResult = await updateCarePlanWithFallback(providerResult.context.supabase, parsedParams.data.id, providerResult.providerId, {
      title: sanitizeText(payload.title),
      description: sanitizeText(payload.description),
      status: payload.status,
      start_date: payload.startDate,
      end_date: sanitizeNullableText(payload.endDate),
      milestones,
    });

    if (updateResult.error || !updateResult.data) {
      return apiError(500, "care_plan_update_failed", "Unable to update this care plan right now.");
    }

    revalidatePath("/provider/care-plans");
    revalidatePath("/care-plans");
    revalidatePath(`/provider/patients/${existingPlan.patient_id}`);

    return apiSuccess({
      carePlan: {
        id: updateResult.data.id,
        patientId: updateResult.data.patient_id,
        providerId: updateResult.data.provider_id,
        title: updateResult.data.title,
        description: updateResult.data.description ?? "Care plan",
        status: updateResult.data.status ?? "active",
        milestones,
        createdAt: updateResult.data.created_at ?? new Date().toISOString(),
        startDate: updateResult.data.start_date ?? payload.startDate,
        endDate: updateResult.data.end_date ?? sanitizeNullableText(payload.endDate),
      },
    });
  } catch {
    return apiError(500, "care_plan_update_failed", "Unable to update this care plan right now.");
  }
}






