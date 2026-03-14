import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { bookAppointmentSchema } from "@/lib/appointments";
import { getAvailableSlotsForProvider } from "@/lib/appointments-data";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function hasSlot(availableDates: Awaited<ReturnType<typeof getAvailableSlotsForProvider>>, scheduledAt: string) {
  return availableDates.some((date) => date.slots.some((slot) => slot.startsAt === scheduledAt));
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = bookAppointmentSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: payload.error.issues[0]?.message ?? "Invalid appointment request." }, { status: 400 });
  }

  const supabase = await getSupabaseServerClient();
  const { specialty, providerId, scheduledAt, chiefComplaint, paymentMethod } = payload.data;

  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .select("id, profile_id, specialty, accepting_patients")
    .eq("id", providerId)
    .maybeSingle();

  if (providerError) {
    return NextResponse.json({ error: providerError.message }, { status: 400 });
  }

  if (!provider?.profile_id || !provider.accepting_patients) {
    return NextResponse.json({ error: "This provider is not accepting new appointments right now." }, { status: 400 });
  }

  if (provider.specialty !== specialty) {
    return NextResponse.json({ error: "Choose a provider that matches your selected specialty." }, { status: 400 });
  }

  const availableDates = await getAvailableSlotsForProvider(providerId);
  if (!hasSlot(availableDates, scheduledAt)) {
    return NextResponse.json({ error: "That time slot is no longer available. Please choose another." }, { status: 409 });
  }

  const { data: existingConversation, error: conversationError } = await supabase
    .from("conversations")
    .select("id")
    .eq("patient_id", user.id)
    .eq("provider_profile_id", provider.profile_id)
    .maybeSingle();

  if (conversationError) {
    return NextResponse.json({ error: conversationError.message }, { status: 400 });
  }

  let conversation = existingConversation;

  if (!conversation) {
    const insertConversationResult = await supabase
      .from("conversations")
      .insert({ patient_id: user.id, provider_profile_id: provider.profile_id })
      .select("id")
      .single();

    if (insertConversationResult.error) {
      return NextResponse.json({ error: insertConversationResult.error.message }, { status: 400 });
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
      chief_complaint: chiefComplaint,
      payment_method: paymentMethod,
      updated_at: new Date().toISOString(),
    })
    .select("id, patient_id, provider_id, scheduled_at")
    .single();

  if (appointmentError) {
    return NextResponse.json({ error: appointmentError.message }, { status: 400 });
  }

  const notifications = [
    {
      recipient_id: user.id,
      actor_id: user.id,
      appointment_id: appointment.id,
      type: "appointment_booked",
      title: "Appointment confirmed",
      body: "Your video appointment has been booked successfully.",
      link: "/appointments",
    },
    {
      recipient_id: provider.profile_id,
      actor_id: user.id,
      appointment_id: appointment.id,
      type: "appointment_booked",
      title: "New patient appointment",
      body: "A patient booked a new video consultation with you.",
      link: "/provider/dashboard",
    },
  ];

  const { error: notificationError } = await supabase.from("notifications").insert(notifications);

  if (notificationError) {
    return NextResponse.json({ error: notificationError.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    appointmentId: appointment.id,
    newAppointment: { id: appointment.id },
    conversationId: conversation.id,
    redirectTo: "/appointments?toast=appointment-booked",
  });
}