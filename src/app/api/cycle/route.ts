import { saveCycleLogForCurrentUser } from "@/lib/cycle";
import { cycleLogSchema } from "@/lib/cycle-shared";
import { requireApiUser } from "@/lib/api-auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { sanitizeText } from "@/lib/sanitize";

export async function POST(request: Request) {
  try {
    const authResult = await requireApiUser();

    if ("error" in authResult) {
      return authResult.error;
    }

    const rawPayload = await request.json();
    const payload = cycleLogSchema.safeParse({
      ...rawPayload,
      notes: sanitizeText(typeof rawPayload?.notes === "string" ? rawPayload.notes : ""),
    });

    if (!payload.success) {
      return apiError(400, "invalid_cycle_log", payload.error.issues[0]?.message ?? "Invalid cycle log.");
    }

    const log = await saveCycleLogForCurrentUser(payload.data);
    return apiSuccess({ ok: true, log });
  } catch (error) {
    const status = error instanceof Error && error.message === "Unauthorized" ? 401 : 400;
    return apiError(status, status === 401 ? "unauthorized" : "cycle_log_save_failed", status === 401 ? "Unauthorized" : "Unable to save cycle log.");
  }
}