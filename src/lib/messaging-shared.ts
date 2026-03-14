import { z } from "zod";

export const MESSAGE_ATTACHMENT_BUCKET = "message-attachments";

export const sendMessageSchema = z.object({
  conversationId: z.uuid({ error: "Conversation id is required." }),
  content: z.string().trim().max(4000, "Keep messages under 4,000 characters.").optional().default(""),
  attachmentPath: z.string().trim().min(1).optional(),
  attachmentName: z.string().trim().min(1).optional(),
}).superRefine((value, ctx) => {
  if (!value.content && !value.attachmentPath) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Write a message or attach a file.",
      path: ["content"],
    });
  }

  if (value.attachmentPath && !value.attachmentName) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Attachment name is required.",
      path: ["attachmentName"],
    });
  }
});

export const createConversationSchema = z.object({
  providerProfileId: z.uuid().optional(),
  patientId: z.uuid().optional(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type CreateConversationInput = z.infer<typeof createConversationSchema>;

export type MessagingRole = "patient" | "provider";

export type ConversationListItem = {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatarUrl?: string;
  specialtyLabel?: string;
  languages: string[];
  lastMessagePreview: string;
  lastMessageAt: string;
  unreadCount: number;
};

export type ConversationMessage = {
  id: string;
  senderId: string;
  senderRole: "patient" | "provider";
  senderName: string;
  senderAvatarUrl?: string;
  content: string;
  createdAt: string;
  readAt?: string | null;
  attachmentPath?: string;
  attachmentName?: string;
};

export type ConversationThread = {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatarUrl?: string;
  specialtyLabel?: string;
  languages: string[];
  unreadCount: number;
  messages: ConversationMessage[];
};

export type ConversationCandidate = {
  id: string;
  name: string;
  avatarUrl?: string;
  specialtyLabel?: string;
  languages: string[];
};

export type MessagingPageData = {
  currentUserId: string;
  role: MessagingRole;
  conversations: ConversationListItem[];
  initialConversationId: string | null;
  initialThread: ConversationThread | null;
  candidates: ConversationCandidate[];
  storageBucket: string;
};
