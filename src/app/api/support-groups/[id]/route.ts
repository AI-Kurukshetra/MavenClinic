import { z } from "zod";
import { requireApiRole } from "@/lib/api-auth";
import { apiError, apiSuccess } from "@/lib/api-response";

const paramsSchema = z.object({
  id: z.string().uuid("Invalid support group."),
});

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireApiRole(["patient"]);
    if ("error" in authResult) {
      return authResult.error;
    }

    const params = paramsSchema.safeParse(await context.params);
    if (!params.success) {
      return apiError(400, "invalid_support_group", params.error.issues[0]?.message ?? "Invalid support group.");
    }

    const { supabase, user } = authResult.context;
    const { error } = await supabase.from("support_group_members").insert({ group_id: params.data.id, user_id: user.id });
    if (error) {
      return apiError(500, "support_group_join_failed", "Unable to join this support group right now.");
    }

    return apiSuccess({ ok: true }, { status: 201 });
  } catch {
    return apiError(500, "support_group_join_failed", "Unable to join this support group right now.");
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireApiRole(["patient"]);
    if ("error" in authResult) {
      return authResult.error;
    }

    const params = paramsSchema.safeParse(await context.params);
    if (!params.success) {
      return apiError(400, "invalid_support_group", params.error.issues[0]?.message ?? "Invalid support group.");
    }

    const { supabase, user } = authResult.context;
    const { error } = await supabase.from("support_group_members").delete().eq("group_id", params.data.id).eq("user_id", user.id);
    if (error) {
      return apiError(500, "support_group_leave_failed", "Unable to leave this support group right now.");
    }

    return apiSuccess({ ok: true });
  } catch {
    return apiError(500, "support_group_leave_failed", "Unable to leave this support group right now.");
  }
}