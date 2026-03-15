import { z } from "zod";
import { requireApiUser } from "@/lib/api-auth";
import { apiError, apiSuccess } from "@/lib/api-response";

const paramsSchema = z.object({
  id: z.string().uuid("Invalid notification id."),
});

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireApiUser();

    if ("error" in authResult) {
      return authResult.error;
    }

    const parsedParams = paramsSchema.safeParse(await params);

    if (!parsedParams.success) {
      return apiError(400, "invalid_notification", parsedParams.error.issues[0]?.message ?? "Invalid notification.");
    }

    const { supabase } = authResult.context;
    const readAt = new Date().toISOString();
    const { data, error } = await supabase
      .from("notifications")
      .update({ read_at: readAt })
      .eq("id", parsedParams.data.id)
      .is("read_at", null)
      .select("id, read_at")
      .maybeSingle();

    if (error) {
      return apiError(500, "notification_update_failed", "Unable to update this notification right now.");
    }

    return apiSuccess({ ok: true, notification: data ?? { id: parsedParams.data.id, read_at: readAt } });
  } catch {
    return apiError(500, "notification_update_failed", "Unable to update this notification right now.");
  }
}
