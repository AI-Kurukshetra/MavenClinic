import { NextResponse } from "next/server";
import { addMinutes, isAfter } from "date-fns";
import { getCurrentUser } from "@/lib/auth";
import { appointmentMutationSchema } from "@/lib/appointments";
import { getAvailableSlotsForProvider } from "@/lib/appointments-data";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function hasSlot(availableDates: Awaited<ReturnType<typeof getAvailableSlotsForProvider>>, scheduledAt: string) {
  return availableDates.some((date) => date.slots.some((slot) => slot.startsAt === scheduledAt));
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = appointmentMutationSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: payload.error.issues[0]?.message ?? "Invalid appointment update." }, { status: 400 });
  }

  const { id } = await context.params;
  const supabase = await getSupabaseServerClient();
  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .select("id, patient_id, provider_id, scheduled_at, status, notes")
    .eq("id", id)
    .eq("patient_id", user.id)
    .maybeSingle();

  if (appointmentError) {
    return NextResponse.json({ error: appointmentError.message }, { status: 400 });
  }

  if (!appointment) {
    return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
  }

  if (payload.data.action === "save_notes") {
    const nextNotes = payload.data.notes.trim();
    const { error: notesError } = await supabase
      .from("appointments")
      .update({
        notes: nextNotes.length ? nextNotes : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", appointment.id)
      .eq("patient_id", user.id);

    if (notesError) {
      return NextResponse.json({ error: notesError.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, notes: nextNotes });
  }

  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .select("profile_id")
    .eq("id", appointment.provider_id)
    .maybeSingle();

  if (providerError) {
    return NextResponse.json({ error: providerError.message }, { status: 400 });
  }

  if (!provider?.profile_id) {
    return NextResponse.json({ error: "Provider profile not found." }, { status: 400 });
  }

  if (payload.data.action === "reschedule") {
    if (appointment.status !== "scheduled") {
      return NextResponse.json({ error: "Only scheduled appointments can be rescheduled." }, { status: 400 });
    }

    const availableDates = await getAvailableSlotsForProvider(appointment.provider_id, appointment.id);
    if (!hasSlot(availableDates, payload.data.scheduledAt)) {
      return NextResponse.json({ error: "That time slot is no longer available. Please choose another." }, { status: 409 });
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
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    const { error: notificationError } = await supabase.from("notifications").insert({
      recipient_id: provider.profile_id,
      actor_id: user.id,
      appointment_id: appointment.id,
      type: "appointment_rescheduled",
      title: "Appointment rescheduled",
      body: "A patient moved their appointment to a new time slot.",
      link: "/provider/dashboard",
    });

    if (notificationError) {
      return NextResponse.json({ error: notificationError.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, toast: "appointment-rescheduled" });
  }

  if (payload.data.action === "cancel") {
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
      return NextResponse.json({ error: cancelError.message }, { status: 400 });
    }

    const { error: notificationError } = await supabase.from("notifications").insert({
      recipient_id: provider.profile_id,
      actor_id: user.id,
      appointment_id: appointment.id,
      type: "appointment_cancelled",
      title: "Appointment cancelled",
      body: "A patient cancelled their appointment.",
      link: "/provider/dashboard",
    });

    if (notificationError) {
      return NextResponse.json({ error: notificationError.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, toast: "appointment-cancelled" });
  }

  if (payload.data.action === "start") {
    const now = new Date();
    const latestJoin = addMinutes(new Date(appointment.scheduled_at), 10);
    if (isAfter(now, addMinutes(new Date(appointment.scheduled_at), 120)) || isAfter(new Date(appointment.scheduled_at), now) && isAfter(new Date(appointment.scheduled_at), latestJoin)) {
      return NextResponse.json({ error: "This consultation is not open yet." }, { status: 400 });
    }

    const { error: startError } = await supabase
      .from("appointments")
      .update({ status: "in_progress", started_at: now.toISOString(), updated_at: now.toISOString() })
      .eq("id", appointment.id)
      .eq("patient_id", user.id);

    if (startError) {
      return NextResponse.json({ error: startError.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  }

  const { error: completeError } = await supabase
    .from("appointments")
    .update({ status: "completed", completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", appointment.id)
    .eq("patient_id", user.id);

  if (completeError) {
    return NextResponse.json({ error: completeError.message }, { status: 400 });
  }

  const { error: notificationError } = await supabase.from("notifications").insert([
    {
      recipient_id: user.id,
      actor_id: user.id,
      appointment_id: appointment.id,
      type: "consultation_complete",
      title: "Consultation complete",
      body: "Your visit has been marked complete. Your dashboard has the latest status.",
      link: "/dashboard",
    },
    {
      recipient_id: provider.profile_id,
      actor_id: user.id,
      appointment_id: appointment.id,
      type: "consultation_complete",
      title: "Consultation finished",
      body: "The patient ended the consultation and the appointment is now complete.",
      link: "/provider/dashboard",
    },
  ]);

  if (notificationError) {
    return NextResponse.json({ error: notificationError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, redirectTo: "/dashboard?toast=consultation-complete" });
}