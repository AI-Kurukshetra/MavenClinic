import { addDays, differenceInCalendarDays, startOfDay } from "date-fns";
import { z } from "zod";
import { requireApiRole } from "@/lib/api-auth";
import { apiError, apiSuccess } from "@/lib/api-response";

const pregnancyCreateSchema = z.object({
  lmpDate: z.string().date("Choose a valid last menstrual period date."),
});

export async function POST(request: Request) {
  try {
    const authResult = await requireApiRole(["patient"]);
    if ("error" in authResult) {
      return authResult.error;
    }

    const payload = pregnancyCreateSchema.safeParse(await request.json());
    if (!payload.success) {
      return apiError(400, "invalid_pregnancy_record", payload.error.issues[0]?.message ?? "Invalid pregnancy record.");
    }

    const lmpDate = startOfDay(new Date(payload.data.lmpDate));
    const dueDate = addDays(lmpDate, 280);
    const currentWeek = Math.min(40, Math.max(1, Math.floor(differenceInCalendarDays(startOfDay(new Date()), lmpDate) / 7) + 1));
    const { supabase, user } = authResult.context;

    const { data, error } = await supabase
      .from("pregnancy_records")
      .insert({
        patient_id: user.id,
        status: "active",
        current_week: currentWeek,
        due_date: dueDate.toISOString().slice(0, 10),
      })
      .select("id, due_date, current_week")
      .single();

    if (error) {
      return apiError(500, "pregnancy_create_failed", "Unable to start pregnancy tracking right now.");
    }

    return apiSuccess({ record: data }, { status: 201 });
  } catch {
    return apiError(500, "pregnancy_create_failed", "Unable to start pregnancy tracking right now.");
  }
}