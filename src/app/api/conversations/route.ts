import { NextResponse } from "next/server";
import { createConversationForCurrentUser } from "@/lib/messaging";
import { createConversationSchema } from "@/lib/messaging-shared";

export async function POST(request: Request) {
  const payload = createConversationSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: payload.error.issues[0]?.message ?? "Invalid conversation request." }, { status: 400 });
  }

  try {
    const conversationId = await createConversationForCurrentUser(payload.data);
    return NextResponse.json({ ok: true, conversationId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start conversation.";
    const status = message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}