import { z } from "zod";
import { ensureConsultationRoom } from "@/lib/consultations";
import { requireApiUser } from "@/lib/api-auth";
import { apiError, apiSuccess } from "@/lib/api-response";

const createRoomSchema = z.object({
  appointmentId: z.uuid({ error: "Appointment id is required." }),
});

export async function POST(request: Request) {
  try {
    const authResult = await requireApiUser();

    if ("error" in authResult) {
      return authResult.error;
    }

    const payload = createRoomSchema.safeParse(await request.json());

    if (!payload.success) {
      return apiError(400, "invalid_consultation_room_request", payload.error.issues[0]?.message ?? "Invalid consultation room request.");
    }

    const { user, supabase, profile } = authResult.context;
    let appointmentQuery = supabase
      .from("appointments")
      .select("id, patient_id, provider_id, scheduled_at, video_room_url")
      .eq("id", payload.data.appointmentId);

    if (profile?.role === "provider") {
      const { data: providerRow, error: providerError } = await supabase
        .from("providers")
        .select("id")
        .eq("profile_id", user.id)
        .maybeSingle();

      if (providerError) {
        return apiError(500, "provider_lookup_failed", "Unable to verify this provider.");
      }

      if (!providerRow?.id) {
        return apiError(403, "provider_not_found", "Provider access is unavailable.");
      }

      appointmentQuery = appointmentQuery.eq("provider_id", providerRow.id);
    } else {
      appointmentQuery = appointmentQuery.eq("patient_id", user.id);
    }

    const { data: appointment, error: appointmentError } = await appointmentQuery.maybeSingle();

    if (appointmentError) {
      return apiError(500, "appointment_lookup_failed", "Unable to verify this appointment.");
    }

    if (!appointment) {
      return apiError(404, "appointment_not_found", "Appointment not found.");
    }

    const url = await ensureConsultationRoom({
      supabase,
      appointmentId: appointment.id,
      scheduledAt: appointment.scheduled_at,
      existingUrl: appointment.video_room_url,
    });

    return apiSuccess({ url });
  } catch {
    return apiError(500, "consultation_room_create_failed", "Unable to create consultation room.");
  }
}
