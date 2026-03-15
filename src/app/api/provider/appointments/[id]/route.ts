import { z } from "zod";
import { getAvailableSlotsForProvider } from "@/lib/appointments-data";
import { requireApiRole } from "@/lib/api-auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { sanitizeNullableText, sanitizeText } from "@/lib/sanitize";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const providerAppointmentMutationSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("reschedule"), scheduledAt: z.iso.datetime({ error: "Choose a valid time slot." }) }),
  z.object({ action: z.literal("cancel"), reason: z.string().trim().min(5, "Add a cancellation reason.") }),
]);

const paramsSchema = z.object({
  id: z.string().uuid("Invalid appointment id."),
});

function hasSlot(availableDates: Awaited<ReturnType<typeof getAvailableSlotsForProvider>>, scheduledAt: string) {
  return availableDates.some((date) => date.slots.some((slot) => slot.startsAt === scheduledAt));
}

async function getProviderContext() {
  const authResult = await requireApiRole(["provider"]);

  if ("error" in authResult) {
    return { error: authResult.error ?? apiError(401, "unauthorized", "Unauthorized") };
  }

  const { supabase, user } = authResult.context;
  const { data: providerRow, error } = await supabase
    .from("providers")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (error || !providerRow?.id) {
    return { error: apiError(403, "provider_not_found", "Provider access is unavailable.") };
  }

  return {
    context: authResult.context,
    providerId: providerRow.id,
  };
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const providerResult = await getProviderContext();

    if ("error" in providerResult) {
      return providerResult.error;
    }

    const parsedParams = paramsSchema.safeParse(await context.params);
    if (!parsedParams.success) {
      return apiError(400, "invalid_appointment", parsedParams.error.issues[0]?.message ?? "Invalid appointment.");
    }

    const payload = providerAppointmentMutationSchema.safeParse(await request.json());
    if (!payload.success) {
      return apiError(400, "invalid_appointment_update", payload.error.issues[0]?.message ?? "Invalid appointment update.");
    }

    const { supabase, user } = providerResult.context;
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select("id, patient_id, provider_id, scheduled_at, status")
      .eq("id", parsedParams.data.id)
      .eq("provider_id", providerResult.providerId)
      .maybeSingle();

    if (appointmentError) {
      return apiError(500, "appointment_lookup_failed", "Unable to load this appointment.");
    }

    if (!appointment?.patient_id) {
      return apiError(404, "appointment_not_found", "Appointment not found.");
    }

    const admin = getSupabaseAdminClient();

    if (payload.data.action === "reschedule") {
      if (appointment.status !== "scheduled") {
        return apiError(400, "appointment_not_reschedulable", "Only scheduled appointments can be rescheduled.");
      }

      const availableDates = await getAvailableSlotsForProvider(appointment.provider_id, appointment.id);
      if (!hasSlot(availableDates, payload.data.scheduledAt)) {
        return apiError(409, "slot_unavailable", "That time slot is no longer available. Please choose another.");
      }

      const { error: updateError } = await supabase
        .from("appointments")
        .update({
          scheduled_at: payload.data.scheduledAt,
          status: "scheduled",
          started_at: null,
          completed_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", appointment.id)
        .eq("provider_id", providerResult.providerId);

      if (updateError) {
        return apiError(500, "appointment_reschedule_failed", "Unable to reschedule this appointment.");
      }

      await admin.from("notifications").insert({
        recipient_id: appointment.patient_id,
        actor_id: user.id,
        appointment_id: appointment.id,
        type: "appointment_rescheduled",
        title: "Appointment rescheduled",
        body: sanitizeNullableText("Your provider moved your appointment to a new time."),
        link: "/appointments",
      });

      return apiSuccess({ ok: true, toast: "provider-appointment-rescheduled" });
    }

    const { error: cancelError } = await supabase
      .from("appointments")
      .update({
        status: "cancelled",
        cancellation_reason: sanitizeText(payload.data.reason),
        updated_at: new Date().toISOString(),
      })
      .eq("id", appointment.id)
      .eq("provider_id", providerResult.providerId);

    if (cancelError) {
      return apiError(500, "appointment_cancel_failed", "Unable to cancel this appointment.");
    }

    await admin.from("notifications").insert({
      recipient_id: appointment.patient_id,
      actor_id: user.id,
      appointment_id: appointment.id,
      type: "appointment_cancelled",
      title: "Appointment cancelled",
      body: sanitizeNullableText(payload.data.reason),
      link: "/appointments",
    });

    return apiSuccess({ ok: true, toast: "provider-appointment-cancelled" });
  } catch {
    return apiError(500, "appointment_update_failed", "Unable to update this appointment right now.");
  }
}
