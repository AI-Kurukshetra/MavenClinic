import { z } from "zod";
import { requireApiRole } from "@/lib/api-auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { isPartnerAccessLevel } from "@/lib/partner-access";
import { sanitizeNullableText } from "@/lib/sanitize";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const invitationSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  fullName: z.string().min(2, "Partner full name is required."),
  accessLevel: z.string().refine(isPartnerAccessLevel, { message: "Choose a valid access level." }),
  message: z.string().max(1000).optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const authResult = await requireApiRole(["patient"]);

    if ("error" in authResult) {
      return authResult.error;
    }

    const payload = invitationSchema.safeParse(await request.json());

    if (!payload.success) {
      return apiError(400, "invalid_partner_invitation", payload.error.issues[0]?.message ?? "Invalid partner invitation.");
    }

    const admin = getSupabaseAdminClient();
    const user = authResult.context.user;
    const patientId = user.id;
    const patientProfileResult = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", patientId)
      .maybeSingle();

    if (patientProfileResult.error) {
      return apiError(500, "patient_profile_lookup_failed", "Unable to verify your profile right now.");
    }

    const patientName = patientProfileResult.data?.full_name ?? user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Maven patient";

    const existingAccessResult = await admin
      .from("partner_access")
      .select("id")
      .eq("patient_id", patientId)
      .is("revoked_at", null)
      .limit(1)
      .maybeSingle();

    if (existingAccessResult.error) {
      return apiError(500, "partner_access_lookup_failed", "Unable to verify current partner access right now.");
    }

    if (existingAccessResult.data?.id) {
      return apiError(409, "partner_access_exists", "Revoke the current partner before inviting a new one.");
    }

    const { data: invitation, error: invitationError } = await admin
      .from("invitations")
      .insert({
        email: payload.data.email.trim().toLowerCase(),
        role: "partner",
        invited_by: patientId,
        metadata: {
          patient_id: patientId,
          access_level: payload.data.accessLevel,
          patient_name: patientName,
          partner_name: payload.data.fullName.trim(),
          message: sanitizeNullableText(payload.data.message ?? null),
        },
      })
      .select("id, email, token")
      .single();

    if (invitationError || !invitation) {
      return apiError(500, "partner_invitation_create_failed", "Unable to create the partner invitation right now.");
    }

    return apiSuccess({
      id: invitation.id,
      email: invitation.email,
      token: invitation.token,
    }, { status: 201 });
  } catch {
    return apiError(500, "partner_invitation_create_failed", "Unable to create the partner invitation right now.");
  }
}
