import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { ensureConsultationRoom } from "@/lib/consultations";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const createRoomSchema = z.object({
  appointmentId: z.uuid({ error: "Appointment id is required." }),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = createRoomSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: payload.error.issues[0]?.message ?? "Invalid consultation room request." }, { status: 400 });
  }

  const supabase = await getSupabaseServerClient();
  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .select("id, patient_id, scheduled_at, video_room_url")
    .eq("id", payload.data.appointmentId)
    .eq("patient_id", user.id)
    .maybeSingle();

  if (appointmentError) {
    return NextResponse.json({ error: appointmentError.message }, { status: 400 });
  }

  if (!appointment) {
    return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
  }

  try {
    const url = await ensureConsultationRoom({
      supabase,
      appointmentId: appointment.id,
      scheduledAt: appointment.scheduled_at,
      existingUrl: appointment.video_room_url,
    });

    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create consultation room.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}