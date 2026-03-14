import { aiRequestSchema, generateAiInsight } from "@/lib/ai/insights";
import { requireApiUser } from "@/lib/api-auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { sanitizeText } from "@/lib/sanitize";

export async function POST(request: Request) {
  try {
    const authResult = await requireApiUser();

    if ("error" in authResult) {
      return authResult.error;
    }

    const payload = aiRequestSchema.safeParse(await request.json());

    if (!payload.success) {
      return apiError(400, "invalid_ai_request", payload.error.issues[0]?.message ?? "Invalid AI request.");
    }

    const { user, supabase } = authResult.context;
    const result = await generateAiInsight(payload.data.type, payload.data.data);
    const safeResult = typeof result === "string" ? sanitizeText(result) : result;

    if (payload.data.type === "symptom_insight" && payload.data.logId && typeof safeResult === "string") {
      const { data: log, error: logError } = await supabase
        .from("symptom_logs")
        .select("id")
        .eq("id", payload.data.logId)
        .eq("patient_id", user.id)
        .maybeSingle();

      if (logError) {
        return apiError(500, "symptom_log_lookup_failed", "Unable to verify the symptom log for this insight.");
      }

      if (!log) {
        return apiError(404, "symptom_log_not_found", "Symptom log not found.");
      }

      const { error: updateError } = await supabase
        .from("symptom_logs")
        .update({ ai_insight: safeResult })
        .eq("id", payload.data.logId);

      if (updateError) {
        return apiError(500, "insight_persist_failed", "Unable to save this insight right now.");
      }
    }

    return apiSuccess({ result: safeResult });
  } catch {
    return apiError(500, "ai_generation_failed", "Unable to generate insight.");
  }
}