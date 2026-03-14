import {
  getConversationRoleForCurrentUser,
  getConversationThreadForUser,
  markConversationRead,
} from "@/lib/messaging";
import { requireApiUser } from "@/lib/api-auth";
import { apiError, apiSuccess } from "@/lib/api-response";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireApiUser();

    if ("error" in authResult) {
      return authResult.error;
    }

    const { id } = await context.params;
    const membership = await getConversationRoleForCurrentUser(id);

    if (!membership) {
      return apiError(404, "conversation_not_found", "Conversation not found.");
    }

    const thread = await getConversationThreadForUser(id, membership.role, membership.userId);

    if (!thread) {
      return apiError(404, "conversation_not_found", "Conversation not found.");
    }

    return apiSuccess({ thread });
  } catch (error) {
    const status = error instanceof Error && error.message === "Unauthorized" ? 401 : 400;
    return apiError(status, status === 401 ? "unauthorized" : "conversation_load_failed", status === 401 ? "Unauthorized" : "Unable to load conversation.");
  }
}

export async function PATCH(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireApiUser();

    if ("error" in authResult) {
      return authResult.error;
    }

    const { id } = await context.params;
    const membership = await getConversationRoleForCurrentUser(id);

    if (!membership) {
      return apiError(404, "conversation_not_found", "Conversation not found.");
    }

    await markConversationRead(id, membership.userId);
    return apiSuccess({ ok: true });
  } catch (error) {
    const status = error instanceof Error && error.message === "Unauthorized" ? 401 : 400;
    return apiError(status, status === 401 ? "unauthorized" : "read_receipt_failed", status === 401 ? "Unauthorized" : "Unable to update read receipts.");
  }
}