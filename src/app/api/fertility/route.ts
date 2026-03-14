import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { saveTodayFertilityDataForCurrentUser } from "@/lib/cycle";
import { fertilitySnapshotSchema } from "@/lib/cycle-shared";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = fertilitySnapshotSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: payload.error.issues[0]?.message ?? "Invalid fertility update." }, { status: 400 });
  }

  try {
    const entry = await saveTodayFertilityDataForCurrentUser(payload.data);
    return NextResponse.json({ ok: true, entry });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save fertility data.";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 400 });
  }
}
