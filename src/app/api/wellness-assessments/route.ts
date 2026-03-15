import { z } from "zod";
import { requireApiRole } from "@/lib/api-auth";
import { apiError, apiSuccess } from "@/lib/api-response";

const wellnessAssessmentSchema = z.object({
  assessmentType: z.enum(["phq2", "gad2", "sleep", "energy"]),
  answers: z.array(z.number().min(0).max(3)).min(2).max(5),
});

export async function POST(request: Request) {
  try {
    const authResult = await requireApiRole(["patient"]);
    if ("error" in authResult) {
      return authResult.error;
    }

    const payload = wellnessAssessmentSchema.safeParse(await request.json());
    if (!payload.success) {
      return apiError(400, "invalid_wellness_assessment", payload.error.issues[0]?.message ?? "Invalid assessment payload.");
    }

    const score = payload.data.answers.reduce((sum, value) => sum + value, 0);
    const { supabase, user } = authResult.context;
    const { data, error } = await supabase
      .from("wellness_assessments")
      .insert({
        patient_id: user.id,
        assessment_type: payload.data.assessmentType,
        answers: payload.data.answers,
        score,
      })
      .select("id, assessment_type, completed_at")
      .single();

    if (error) {
      return apiError(500, "wellness_assessment_save_failed", "Unable to save this assessment right now.");
    }

    return apiSuccess({ assessment: data }, { status: 201 });
  } catch {
    return apiError(500, "wellness_assessment_save_failed", "Unable to save this assessment right now.");
  }
}