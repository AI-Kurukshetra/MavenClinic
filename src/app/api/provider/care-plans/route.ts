import { revalidatePath } from "next/cache";
import { requireApiRole, type ApiAuthContext } from "@/lib/api-auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { normalizeCarePlanMilestones, providerCarePlanPayloadSchema } from "@/lib/care-plans";
import { sanitizeNullableText, sanitizeText } from "@/lib/sanitize";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

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

async function insertCarePlanWithFallback(supabase: SupabaseServerClient, values: {
  patient_id: string;
  provider_id: string;
  title: string;
  description: string;
  status: string;
  start_date: string;
  end_date: string | null;
  milestones: ReturnType<typeof normalizeCarePlanMilestones>;
}) {
  const primaryResult = await supabase
    .from("care_plans")
    .insert(values)
    .select("id, patient_id, provider_id, title, description, status, milestones, created_at, start_date, end_date")
    .single();

  if (!isMissingCarePlanDateColumnError(primaryResult.error)) {
    return primaryResult;
  }

  const fallbackResult = await supabase
    .from("care_plans")
    .insert({
      patient_id: values.patient_id,
      provider_id: values.provider_id,
      title: values.title,
      description: values.description,
      status: values.status,
      milestones: values.milestones,
    })
    .select("id, patient_id, provider_id, title, description, status, milestones, created_at")
    .single();

  return {
    data: fallbackResult.data ? { ...fallbackResult.data, start_date: null, end_date: null } : null,
    error: fallbackResult.error,
  };
}

export async function POST(request: Request) {
  try {
    const providerResult = await getProviderContext();
    if ("error" in providerResult) {
      return providerResult.error;
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

    const insertResult = await insertCarePlanWithFallback(providerResult.context.supabase, {
      patient_id: payload.patientId,
      provider_id: providerResult.providerId,
      title: sanitizeText(payload.title),
      description: sanitizeText(payload.description),
      status: payload.status,
      start_date: payload.startDate,
      end_date: sanitizeNullableText(payload.endDate),
      milestones,
    });

    if (insertResult.error || !insertResult.data) {
      return apiError(500, "care_plan_create_failed", "Unable to save this care plan right now.");
    }

    const { data: providerProfile } = await providerResult.context.supabase
      .from("profiles")
      .select("full_name")
      .eq("id", providerResult.context.user.id)
      .maybeSingle();

    const admin = getSupabaseAdminClient();
    await admin.from("notifications").insert({
      recipient_id: payload.patientId,
      actor_id: providerResult.context.user.id,
      type: "care_plan",
      title: `New care plan from Dr. ${providerProfile?.full_name ?? "your Maven provider"}`,
      body: sanitizeText(payload.title),
      link: "/care-plans",
    });

    revalidatePath("/provider/care-plans");
    revalidatePath("/care-plans");
    revalidatePath(`/provider/patients/${payload.patientId}`);

    return apiSuccess({
      carePlan: {
        id: insertResult.data.id,
        patientId: insertResult.data.patient_id,
        providerId: insertResult.data.provider_id,
        title: insertResult.data.title,
        description: insertResult.data.description ?? "Care plan",
        status: insertResult.data.status ?? "active",
        milestones,
        createdAt: insertResult.data.created_at ?? new Date().toISOString(),
        startDate: insertResult.data.start_date ?? payload.startDate,
        endDate: insertResult.data.end_date ?? sanitizeNullableText(payload.endDate),
      },
    }, { status: 201 });
  } catch {
    return apiError(500, "care_plan_create_failed", "Unable to save this care plan right now.");
  }
}






