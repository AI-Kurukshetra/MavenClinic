import { addMinutes, isAfter } from "date-fns";
import { appointmentMutationSchema } from "@/lib/appointments";
import { getAvailableSlotsForProvider } from "@/lib/appointments-data";
import { requireApiUser } from "@/lib/api-auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { sanitizeNullableText } from "@/lib/sanitize";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

function hasSlot(availableDates: Awaited<ReturnType<typeof getAvailableSlotsForProvider>>, scheduledAt: string) {
  return availableDates.some((date) => date.slots.some((slot) => slot.startsAt === scheduledAt));
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireApiUser();

    if ("error" in authResult) {
      return authResult.error;
    }

    const payload = appointmentMutationSchema.safeParse(await request.json());

    if (!payload.success) {
      return apiError(400, "invalid_appointment_update", payload.error.issues[0]?.message ?? "Invalid appointment update.");
    }

    const { id } = await context.params;
    const { user, supabase, profile } = authResult.context;
    const isProvider = profile?.role === "provider";
    const providerRecord = isProvider
      ? await supabase.from("providers").select("id").eq("profile_id", user.id).maybeSingle()
      : null;

    if (providerRecord?.error) {
      return apiError(500, "provider_lookup_failed", "Unable to verify this provider.");
    }

    const providerId = providerRecord?.data?.id ?? null;
    if (isProvider && !providerId) {
      return apiError(403, "provider_not_found", "Provider access is unavailable.");
    }

    let appointmentQuery = supabase
      .from("appointments")
      .select("id, patient_id, provider_id, scheduled_at, status, notes")
      .eq("id", id);

    appointmentQuery = isProvider ? appointmentQuery.eq("provider_id", providerId) : appointmentQuery.eq("patient_id", user.id);

    const { data: appointment, error: appointmentError } = await appointmentQuery.maybeSingle();

    if (appointmentError) {
      return apiError(500, "appointment_lookup_failed", "Unable to load this appointment.");
    }

    if (!appointment) {
      return apiError(404, "appointment_not_found", "Appointment not found.");
    }

    const { data: provider, error: providerError } = await supabase
      .from("providers")
      .select("profile_id")
      .eq("id", appointment.provider_id)
      .maybeSingle();

    if (providerError) {
      return apiError(500, "provider_lookup_failed", "Unable to verify the assigned provider.");
    }

    if (!provider?.profile_id) {
      return apiError(400, "provider_profile_missing", "Provider profile not found.");
    }

    if (payload.data.action === "save_notes") {
      const nextNotes = sanitizeNullableText(payload.data.notes);
      let notesQuery = supabase
        .from("appointments")
        .update({
          notes: nextNotes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", appointment.id);

      notesQuery = isProvider ? notesQuery.eq("provider_id", providerId) : notesQuery.eq("patient_id", user.id);
      const { error: notesError } = await notesQuery;

      if (notesError) {
        return apiError(500, "appointment_notes_failed", "Unable to save appointment notes.");
      }

      return apiSuccess({ ok: true, notes: nextNotes ?? "" });
    }

    if (payload.data.action === "reschedule") {
      if (isProvider) {
        return apiError(403, "forbidden", "Use the provider scheduling workspace to reschedule visits.");
      }

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
        .eq("patient_id", user.id);

      if (updateError) {
        return apiError(500, "appointment_reschedule_failed", "Unable to reschedule this appointment.");
      }

      const admin = getSupabaseAdminClient();
      const { error: notificationError } = await admin.from("notifications").insert({
        recipient_id: provider.profile_id,
        actor_id: user.id,
        appointment_id: appointment.id,
        type: "appointment_rescheduled",
        title: "Appointment rescheduled",
        body: sanitizeNullableText("A patient moved their appointment to a new time slot."),
        link: "/provider/dashboard",
      });

      if (notificationError) {
        return apiError(500, "notification_create_failed", "Appointment rescheduled, but the provider notification could not be created.");
      }

      return apiSuccess({ ok: true, toast: "appointment-rescheduled" });
    }

    if (payload.data.action === "cancel") {
      if (isProvider) {
        return apiError(403, "forbidden", "Use the provider scheduling workspace to cancel visits.");
      }

      const { error: cancelError } = await supabase
        .from("appointments")
        .update({
          status: "cancelled",
          cancellation_reason: payload.data.reason,
          updated_at: new Date().toISOString(),
        })
        .eq("id", appointment.id)
        .eq("patient_id", user.id);

      if (cancelError) {
        return apiError(500, "appointment_cancel_failed", "Unable to cancel this appointment.");
      }

      const admin = getSupabaseAdminClient();
      const { error: notificationError } = await admin.from("notifications").insert({
        recipient_id: provider.profile_id,
        actor_id: user.id,
        appointment_id: appointment.id,
        type: "appointment_cancelled",
        title: "Appointment cancelled",
        body: sanitizeNullableText("A patient cancelled their appointment."),
        link: "/provider/dashboard",
      });

      if (notificationError) {
        return apiError(500, "notification_create_failed", "Appointment cancelled, but the provider notification could not be created.");
      }

      return apiSuccess({ ok: true, toast: "appointment-cancelled" });
    }

    if (payload.data.action === "start") {
      const now = new Date();
      const scheduledTime = new Date(appointment.scheduled_at);
      const latestJoin = addMinutes(scheduledTime, 10);

      if (
        isAfter(now, addMinutes(scheduledTime, 120)) ||
        (isAfter(scheduledTime, now) && isAfter(scheduledTime, latestJoin))
      ) {
        return apiError(400, "consultation_not_open", "This consultation is not open yet.");
      }

      let startQuery = supabase
        .from("appointments")
        .update({ status: "in_progress", started_at: now.toISOString(), updated_at: now.toISOString() })
        .eq("id", appointment.id);
      startQuery = isProvider ? startQuery.eq("provider_id", providerId) : startQuery.eq("patient_id", user.id);
      const { error: startError } = await startQuery;

      if (startError) {
        return apiError(500, "consultation_start_failed", "Unable to start this consultation.");
      }

      return apiSuccess({ ok: true });
    }

    let completeQuery = supabase
      .from("appointments")
      .update({ status: "completed", completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", appointment.id);
    completeQuery = isProvider ? completeQuery.eq("provider_id", providerId) : completeQuery.eq("patient_id", user.id);
    const { error: completeError } = await completeQuery;

    if (completeError) {
      return apiError(500, "consultation_complete_failed", "Unable to complete this consultation.");
    }

    const admin = getSupabaseAdminClient();
    const notifications = isProvider
      ? [
          {
            recipient_id: appointment.patient_id,
            actor_id: user.id,
            appointment_id: appointment.id,
            type: "consultation_complete",
            title: "Consultation complete",
            body: sanitizeNullableText("Your provider marked this visit complete. Check your care dashboard for follow-up steps."),
            link: "/appointments",
          },
        ]
      : [
          {
            recipient_id: user.id,
            actor_id: user.id,
            appointment_id: appointment.id,
            type: "consultation_complete",
            title: "Consultation complete",
            body: sanitizeNullableText("Your visit has been marked complete. Your dashboard has the latest status."),
            link: "/dashboard",
          },
          {
            recipient_id: provider.profile_id,
            actor_id: user.id,
            appointment_id: appointment.id,
            type: "consultation_complete",
            title: "Consultation finished",
            body: sanitizeNullableText("The patient ended the consultation and the appointment is now complete."),
            link: "/provider/dashboard",
          },
        ];

    const { error: notificationError } = await admin.from("notifications").insert(notifications);

    if (notificationError) {
      return apiError(500, "notification_create_failed", "Consultation completed, but follow-up notifications could not be created.");
    }

    return apiSuccess({ ok: true, redirectTo: isProvider ? "/provider/appointments" : "/dashboard?toast=consultation-complete" });
  } catch {
    return apiError(500, "appointment_update_failed", "Unable to update this appointment right now.");
  }
}
