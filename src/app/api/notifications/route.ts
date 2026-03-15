import { requireApiUser } from "@/lib/api-auth";
import { apiError, apiSuccess } from "@/lib/api-response";

export async function PATCH() {
  try {
    const authResult = await requireApiUser();

    if ("error" in authResult) {
      return authResult.error;
    }

    const { user, supabase } = authResult.context;
    const readAt = new Date().toISOString();
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: readAt })
      .eq("recipient_id", user.id)
      .is("read_at", null);

    if (error) {
      return apiError(500, "notifications_mark_all_failed", "Unable to mark notifications as read right now.");
    }

    return apiSuccess({ ok: true, readAt });
  } catch {
    return apiError(500, "notifications_mark_all_failed", "Unable to mark notifications as read right now.");
  }
}