import { NextResponse } from "next/server";
import { getConversationRoleForCurrentUser, getConversationThreadForUser, markConversationRead } from "@/lib/messaging";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const membership = await getConversationRoleForCurrentUser(id);

    if (!membership) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }

    const thread = await getConversationThreadForUser(id, membership.role, membership.userId);

    if (!thread) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }

    return NextResponse.json({ thread });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load conversation.";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 400 });
  }
}

export async function PATCH(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const membership = await getConversationRoleForCurrentUser(id);

    if (!membership) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }

    await markConversationRead(id, membership.userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update read receipts.";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 400 });
  }
}