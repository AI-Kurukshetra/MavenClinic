import { env } from "@/lib/env";

export async function ensureConsultationRoom({
  supabase,
  appointmentId,
  scheduledAt,
  existingUrl,
}: {
  supabase: {
    from: (table: string) => {
      update: (values: Record<string, unknown>) => {
        eq: (column: string, value: string) => PromiseLike<{ error: { message: string } | null }>;
      };
    };
  };
  appointmentId: string;
  scheduledAt: string;
  existingUrl?: string | null;
}) {
  if (existingUrl) {
    return existingUrl;
  }

  const fallbackUrl = `/consultations/${appointmentId}/demo`;

  if (!env.DAILY_API_KEY) {
    const { error } = await supabase
      .from("appointments")
      .update({ video_room_url: fallbackUrl, updated_at: new Date().toISOString() })
      .eq("id", appointmentId);

    if (error) {
      throw new Error(error.message);
    }

    return fallbackUrl;
  }

  const expiration = Math.max(
    Math.floor(Date.now() / 1000) + 7200,
    Math.floor(new Date(scheduledAt).getTime() / 1000) + 7200,
  );

  const response = await fetch("https://api.daily.co/v1/rooms", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.DAILY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: `appointment-${appointmentId}`,
      privacy: "private",
      properties: {
        exp: expiration,
        enable_chat: true,
        enable_screenshare: true,
      },
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(details || `Daily room creation failed for appointment ${appointmentId}.`);
  }

  const room = await response.json() as { url?: string };

  if (!room.url) {
    throw new Error("Daily room creation did not return a room URL.");
  }

  const { error } = await supabase
    .from("appointments")
    .update({ video_room_url: room.url, updated_at: new Date().toISOString() })
    .eq("id", appointmentId);

  if (error) {
    throw new Error(error.message);
  }

  return room.url;
}