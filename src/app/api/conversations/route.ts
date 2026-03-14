import { createConversationForCurrentUser } from "@/lib/messaging";
import { createConversationSchema } from "@/lib/messaging-shared";
import { requireApiUser } from "@/lib/api-auth";
import { apiError, apiSuccess } from "@/lib/api-response";

export async function POST(request: Request) {
  try {
    const authResult = await requireApiUser();

    if ("error" in authResult) {
      return authResult.error;
    }

    const payload = createConversationSchema.safeParse(await request.json());

    if (!payload.success) {
      return apiError(400, "invalid_conversation_request", payload.error.issues[0]?.message ?? "Invalid conversation request.");
    }

    const conversationId = await createConversationForCurrentUser(payload.data);
    return apiSuccess({ ok: true, conversationId });
  } catch (error) {
    const status = error instanceof Error && error.message === "Unauthorized" ? 401 : 400;
    const code = status === 401 ? "unauthorized" : "conversation_create_failed";
    const message = status === 401 ? "Unauthorized" : "Unable to start conversation.";
    return apiError(status, code, message);
  }
}