import { z } from "zod";
import { requireApiRole } from "@/lib/api-auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { sanitizeNullableText, sanitizeText } from "@/lib/sanitize";

const insuranceSchema = z.object({
  carrier: z.string().trim().min(2, "Choose an insurance carrier."),
  memberId: z.string().trim().min(4, "Enter a valid member ID."),
  groupNumber: z.string().trim().optional().nullable(),
});

export async function PATCH(request: Request) {
  try {
    const authResult = await requireApiRole(["patient"]);
    if ("error" in authResult) {
      return authResult.error;
    }

    const payload = insuranceSchema.safeParse(await request.json());
    if (!payload.success) {
      return apiError(400, "invalid_insurance_payload", payload.error.issues[0]?.message ?? "Invalid insurance details.");
    }

    const { supabase, user } = authResult.context;
    const { error } = await supabase
      .from("profiles")
      .update({
        insurance_carrier: sanitizeText(payload.data.carrier),
        insurance_member_id: sanitizeText(payload.data.memberId),
        insurance_group_number: sanitizeNullableText(payload.data.groupNumber ?? null),
      })
      .eq("id", user.id);

    if (error) {
      return apiError(500, "insurance_update_failed", "Unable to save insurance details right now.");
    }

    return apiSuccess({ ok: true });
  } catch {
    return apiError(500, "insurance_update_failed", "Unable to save insurance details right now.");
  }
}