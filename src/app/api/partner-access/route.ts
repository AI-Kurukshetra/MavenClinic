import { z } from "zod";
import { requireApiRole } from "@/lib/api-auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import {
  getPartnerAccessLevelLabel,
  isPartnerAccessLevel,
} from "@/lib/partner-access";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const updatePartnerAccessSchema = z.object({
  accessLevel: z.string().refine(isPartnerAccessLevel, { message: "Choose a valid access level." }),
});

export async function PATCH(request: Request) {
  try {
    const authResult = await requireApiRole(["patient"]);

    if ("error" in authResult) {
      return authResult.error;
    }

    const payload = updatePartnerAccessSchema.safeParse(await request.json());

    if (!payload.success) {
      return apiError(400, "invalid_partner_access", payload.error.issues[0]?.message ?? "Invalid partner access update.");
    }

    const admin = getSupabaseAdminClient();
    const patientId = authResult.context.user.id;
    const { data: existingAccess, error: existingAccessError } = await admin
      .from("partner_access")
      .select("id, partner_id")
      .eq("patient_id", patientId)
      .is("revoked_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingAccessError) {
      return apiError(500, "partner_access_lookup_failed", "Unable to load partner access right now.");
    }

    if (!existingAccess) {
      return apiError(404, "partner_access_not_found", "No active partner access was found.");
    }

    const { error: updateError } = await admin
      .from("partner_access")
      .update({ access_level: payload.data.accessLevel })
      .eq("id", existingAccess.id)
      .eq("patient_id", patientId)
      .is("revoked_at", null);

    if (updateError) {
      return apiError(500, "partner_access_update_failed", "Unable to update partner access right now.");
    }

    return apiSuccess({
      partner: {
        accessLevel: payload.data.accessLevel,
        accessLabel: getPartnerAccessLevelLabel(payload.data.accessLevel),
      },
    });
  } catch {
    return apiError(500, "partner_access_update_failed", "Unable to update partner access right now.");
  }
}

export async function DELETE() {
  try {
    const authResult = await requireApiRole(["patient"]);

    if ("error" in authResult) {
      return authResult.error;
    }

    const admin = getSupabaseAdminClient();
    const patientId = authResult.context.user.id;
    const timestamp = new Date().toISOString();
    const { error } = await admin
      .from("partner_access")
      .update({ revoked_at: timestamp })
      .eq("patient_id", patientId)
      .is("revoked_at", null);

    if (error) {
      return apiError(500, "partner_access_revoke_failed", "Unable to revoke partner access right now.");
    }

    return apiSuccess({ ok: true, revokedAt: timestamp });
  } catch {
    return apiError(500, "partner_access_revoke_failed", "Unable to revoke partner access right now.");
  }
}
