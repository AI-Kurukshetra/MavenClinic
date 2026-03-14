import { saveTodayFertilityDataForCurrentUser } from "@/lib/cycle";
import { fertilitySnapshotSchema } from "@/lib/cycle-shared";
import { requireApiUser } from "@/lib/api-auth";
import { apiError, apiSuccess } from "@/lib/api-response";

export async function POST(request: Request) {
  try {
    const authResult = await requireApiUser();

    if ("error" in authResult) {
      return authResult.error;
    }

    const payload = fertilitySnapshotSchema.safeParse(await request.json());

    if (!payload.success) {
      return apiError(400, "invalid_fertility_update", payload.error.issues[0]?.message ?? "Invalid fertility update.");
    }

    const entry = await saveTodayFertilityDataForCurrentUser(payload.data);
    return apiSuccess({ ok: true, entry });
  } catch (error) {
    const status = error instanceof Error && error.message === "Unauthorized" ? 401 : 400;
    return apiError(status, status === 401 ? "unauthorized" : "fertility_save_failed", status === 401 ? "Unauthorized" : "Unable to save fertility data.");
  }
}