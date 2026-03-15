import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ConsultationRoom } from "@/features/consultations/consultation-room";
import { getCurrentUser } from "@/lib/auth";
import { getConsultationRoomData } from "@/lib/appointments-data";
import { publicEnv } from "@/lib/env";

export default async function ConsultationRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, user] = await Promise.all([params, getCurrentUser()]);

  if (!user) {
    redirect("/login");
  }

  let data = await getConsultationRoomData(id);

  if (!data) {
    redirect("/appointments");
  }

  if (!data.appointment.videoRoomUrl) {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll().map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");

    await fetch(`${publicEnv.NEXT_PUBLIC_APP_URL}/api/consultations/create-room`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      body: JSON.stringify({ appointmentId: id }),
      cache: "no-store",
    });

    data = await getConsultationRoomData(id);

    if (!data) {
      redirect("/appointments");
    }
  }

  return <ConsultationRoom {...data} currentUserId={user.id} />;
}
