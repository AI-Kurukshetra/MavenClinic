import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getConversationRoleForCurrentUser } from "@/lib/messaging";
import { sendMessageSchema } from "@/lib/messaging-shared";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = sendMessageSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: payload.error.issues[0]?.message ?? "Invalid message." }, { status: 400 });
  }

  const membership = await getConversationRoleForCurrentUser(payload.data.conversationId);

  if (!membership || membership.userId !== user.id) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  const supabase = await getSupabaseServerClient();
  const content = payload.data.content || payload.data.attachmentName || "Attachment";

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: payload.data.conversationId,
      sender_id: user.id,
      content,
      message_type: payload.data.attachmentPath ? "file" : "text",
      attachment_path: payload.data.attachmentPath ?? null,
      attachment_name: payload.data.attachmentName ?? null,
    })
    .select("id, conversation_id, sender_id, content, created_at, read_at, attachment_path, attachment_name")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, message: data });
}