import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { saveTodaySymptomLogForCurrentUser } from "@/lib/symptoms";
import { symptomLogSchema } from "@/lib/symptoms-shared";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = symptomLogSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: payload.error.issues[0]?.message ?? "Invalid symptom log." }, { status: 400 });
  }

  try {
    const result = await saveTodaySymptomLogForCurrentUser(payload.data);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save symptoms right now.";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 400 });
  }
}
