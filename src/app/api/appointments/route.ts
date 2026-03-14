import { bookAppointmentSchema } from "@/lib/appointments";
import { getAvailableSlotsForProvider } from "@/lib/appointments-data";
import { requireApiUser } from "@/lib/api-auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { sanitizeNullableText, sanitizeText } from "@/lib/sanitize";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

function hasSlot(availableDates: Awaited<ReturnType<typeof getAvailableSlotsForProvider>>, scheduledAt: string) {
  return availableDates.some((date) => date.slots.some((slot) => slot.startsAt === scheduledAt));
}

export async function POST(request: Request) {
  try {
    const authResult = await requireApiUser();

    if ("error" in authResult) {
      return authResult.error;
    }

    const payload = bookAppointmentSchema.safeParse(await request.json());

    if (!payload.success) {
      return apiError(400, "invalid_appointment_request", payload.error.issues[0]?.message ?? "Invalid appointment request.");
    }

    const { user, supabase } = authResult.context;
    const { specialty, providerId, scheduledAt, chiefComplaint, paymentMethod } = payload.data;

    const { data: provider, error: providerError } = await supabase
      .from("providers")
      .select("id, profile_id, specialty, accepting_patients")
      .eq("id", providerId)
      .maybeSingle();

    if (providerError) {
      return apiError(500, "provider_lookup_failed", "Unable to verify provider availability.");
    }

    if (!provider?.profile_id || !provider.accepting_patients) {
      return apiError(400, "provider_unavailable", "This provider is not accepting new appointments right now.");
    }

    if (provider.specialty !== specialty) {
      return apiError(400, "specialty_mismatch", "Choose a provider that matches your selected specialty.");
    }

    const availableDates = await getAvailableSlotsForProvider(providerId);
    if (!hasSlot(availableDates, scheduledAt)) {
      return apiError(409, "slot_unavailable", "That time slot is no longer available. Please choose another.");
    }

    const { data: existingConversation, error: conversationError } = await supabase
      .from("conversations")
      .select("id")
      .eq("patient_id", user.id)
      .eq("provider_profile_id", provider.profile_id)
      .maybeSingle();

    if (conversationError) {
      return apiError(500, "conversation_lookup_failed", "Unable to prepare secure messaging for this appointment.");
    }

    let conversation = existingConversation;

    if (!conversation) {
      const insertConversationResult = await supabase
        .from("conversations")
        .insert({ patient_id: user.id, provider_profile_id: provider.profile_id })
        .select("id")
        .single();

      if (insertConversationResult.error) {
        return apiError(500, "conversation_create_failed", "Unable to create secure messaging for this appointment.");
      }

      conversation = insertConversationResult.data;
    }

    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .insert({
        patient_id: user.id,
        provider_id: providerId,
        scheduled_at: scheduledAt,
        duration_minutes: 30,
        type: "video",
        status: "scheduled",
        chief_complaint: sanitizeText(chiefComplaint),
        payment_method: paymentMethod,
        updated_at: new Date().toISOString(),
      })
      .select("id, patient_id, provider_id, scheduled_at")
      .single();

    if (appointmentError) {
      return apiError(500, "appointment_create_failed", "Unable to book this appointment right now.");
    }

    const admin = getSupabaseAdminClient();
    const notifications = [
      {
        recipient_id: user.id,
        actor_id: user.id,
        appointment_id: appointment.id,
        type: "appointment_booked",
        title: "Appointment confirmed",
        body: sanitizeNullableText("Your video appointment has been booked successfully."),
        link: "/appointments",
      },
      {
        recipient_id: provider.profile_id,
        actor_id: user.id,
        appointment_id: appointment.id,
        type: "appointment_booked",
        title: "New patient appointment",
        body: sanitizeNullableText("A patient booked a new video consultation with you."),
        link: "/provider/dashboard",
      },
    ];

    const { error: notificationError } = await admin.from("notifications").insert(notifications);

    if (notificationError) {
      return apiError(500, "notification_create_failed", "Appointment booked, but follow-up notifications could not be created.");
    }

    return apiSuccess({
      ok: true,
      appointmentId: appointment.id,
      newAppointment: { id: appointment.id },
      conversationId: conversation.id,
      redirectTo: "/appointments?toast=appointment-booked",
    });
  } catch {
    return apiError(500, "appointment_booking_failed", "Unable to book this appointment right now.");
  }
}