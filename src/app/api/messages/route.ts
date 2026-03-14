import { getConversationRoleForCurrentUser } from "@/lib/messaging";
import { sendMessageSchema } from "@/lib/messaging-shared";
import { requireApiUser } from "@/lib/api-auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { sanitizeNullableText, sanitizeText } from "@/lib/sanitize";

export async function POST(request: Request) {
  try {
    const authResult = await requireApiUser();

    if ("error" in authResult) {
      return authResult.error;
    }

    const payload = sendMessageSchema.safeParse(await request.json());

    if (!payload.success) {
      return apiError(400, "invalid_message", payload.error.issues[0]?.message ?? "Invalid message.");
    }

    const { user, supabase } = authResult.context;
    const membership = await getConversationRoleForCurrentUser(payload.data.conversationId);

    if (!membership || membership.userId !== user.id) {
      return apiError(404, "conversation_not_found", "Conversation not found.");
    }

    const content = sanitizeText(payload.data.content || payload.data.attachmentName || "Attachment");

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: payload.data.conversationId,
        sender_id: user.id,
        content,
        message_type: payload.data.attachmentPath ? "file" : "text",
        attachment_path: sanitizeNullableText(payload.data.attachmentPath),
        attachment_name: sanitizeNullableText(payload.data.attachmentName),
      })
      .select("id, conversation_id, sender_id, content, created_at, read_at, attachment_path, attachment_name")
      .single();

    if (error) {
      return apiError(500, "message_send_failed", "Unable to send this message right now.");
    }

    return apiSuccess({ ok: true, message: data });
  } catch {
    return apiError(500, "message_send_failed", "Unable to send this message right now.");
  }
}