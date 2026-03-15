import { apiError, apiSuccess } from "@/lib/api-response";
import { getCurrentProfile } from "@/lib/auth";
import { referralPayloadSchema } from "@/lib/referral-shared";
import { createReferral } from "@/lib/referrals";
import { sanitizeNullableText, sanitizeText } from "@/lib/sanitize";

export async function POST(request: Request) {
  const profile = await getCurrentProfile();

  if (!profile) {
    return apiError(401, "unauthorized", "Unauthorized");
  }

  if (profile.role !== "provider") {
    return apiError(403, "forbidden", "Forbidden");
  }

  const payload = referralPayloadSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return apiError(400, "invalid_referral_payload", payload.error.issues[0]?.message ?? "Invalid referral payload.");
  }

  try {
    const referral = await createReferral({
      ...payload.data,
      reason: sanitizeText(payload.data.reason),
      clinicalNotes: sanitizeNullableText(payload.data.clinicalNotes),
    });

    return apiSuccess({ referral }, { status: 201 });
  } catch (error) {
    return apiError(500, "referral_create_failed", error instanceof Error ? error.message : "Unable to create referral.");
  }
}
