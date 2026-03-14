import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { saveCycleLogForCurrentUser } from "@/lib/cycle";
import { cycleLogSchema } from "@/lib/cycle-shared";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = cycleLogSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: payload.error.issues[0]?.message ?? "Invalid cycle log." }, { status: 400 });
  }

  try {
    const log = await saveCycleLogForCurrentUser(payload.data);
    return NextResponse.json({ ok: true, log });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save cycle log.";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 400 });
  }
}
