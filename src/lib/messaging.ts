import "server-only";

import { getCurrentUser } from "@/lib/auth";
import { getSpecialtyLabel } from "@/lib/appointments";
import {
  type ConversationCandidate,
  type ConversationListItem,
  type ConversationMessage,
  type ConversationThread,
  type CreateConversationInput,
  MESSAGE_ATTACHMENT_BUCKET,
  type MessagingPageData,
  type MessagingRole,
} from "@/lib/messaging-shared";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export { createConversationSchema, MESSAGE_ATTACHMENT_BUCKET } from "@/lib/messaging-shared";

type ConversationRow = {
  id: string;
  patient_id: string;
  provider_profile_id: string;
  created_at: string | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

type ProviderRow = {
  id: string;
  profile_id: string | null;
  specialty: string;
  languages: string[] | null;
  accepting_patients?: boolean | null;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
  attachment_path?: string | null;
  attachment_name?: string | null;
};

type ProviderContext = {
  userId: string;
  providerId: string;
};

function getMessagePreview(message?: MessageRow | null) {
  if (!message) {
    return "Start the conversation";
  }

  if (message.attachment_name && !message.content.trim()) {
    return `Attachment: ${message.attachment_name}`;
  }

  if (message.attachment_name && message.content.trim()) {
    return `${message.content} (${message.attachment_name})`;
  }

  return message.content;
}

async function getProviderContext(userId?: string): Promise<ProviderContext> {
  const user = userId ? { id: userId } : await getCurrentUser();

  if (!user) {
    throw new Error("Authenticated provider required.");
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("providers")
    .select("id, profile_id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.profile_id) {
    throw new Error("Provider record not found.");
  }

  return {
    userId: data.profile_id,
    providerId: data.id,
  };
}

async function getProfilesMap(profileIds: string[]) {
  const supabase = await getSupabaseServerClient();
  if (!profileIds.length) {
    return new Map<string, ProfileRow>();
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", profileIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Map((data ?? []).map((profile) => [profile.id, profile as ProfileRow]));
}

async function getProviderMetaMap(profileIds: string[]) {
  const supabase = await getSupabaseServerClient();
  if (!profileIds.length) {
    return new Map<string, ProviderRow>();
  }

  const { data, error } = await supabase
    .from("providers")
    .select("id, profile_id, specialty, languages, accepting_patients")
    .in("profile_id", profileIds);

  if (error) {
    throw new Error(error.message);
  }

  const entries: Array<[string, ProviderRow]> = [];

  for (const provider of (data ?? []) as ProviderRow[]) {
    if (!provider.profile_id) {
      continue;
    }

    entries.push([provider.profile_id, provider]);
  }

  return new Map(entries);
}

async function getConversationRows(role: MessagingRole, userId: string) {
  const supabase = await getSupabaseServerClient();
  const query = supabase
    .from("conversations")
    .select("id, patient_id, provider_profile_id, created_at")
    .order("created_at", { ascending: false });

  const { data, error } = role === "patient"
    ? await query.eq("patient_id", userId)
    : await query.eq("provider_profile_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ConversationRow[];
}

async function getMessagesForConversationIds(conversationIds: string[]) {
  const supabase = await getSupabaseServerClient();
  if (!conversationIds.length) {
    return [] as MessageRow[];
  }

  const { data, error } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, content, created_at, read_at, attachment_path, attachment_name")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as MessageRow[];
}

async function buildConversationList(role: MessagingRole, userId: string) {
  const conversations = await getConversationRows(role, userId);

  if (!conversations.length) {
    return [] as ConversationListItem[];
  }

  const participantIds = Array.from(new Set(conversations.map((conversation) => role === "patient" ? conversation.provider_profile_id : conversation.patient_id)));
  const conversationIds = conversations.map((conversation) => conversation.id);
  const [profilesMap, providerMetaMap, messageRows] = await Promise.all([
    getProfilesMap(participantIds),
    role === "patient" ? getProviderMetaMap(participantIds) : Promise.resolve(new Map<string, ProviderRow>()),
    getMessagesForConversationIds(conversationIds),
  ]);

  const lastMessageByConversation = new Map<string, MessageRow>();
  const unreadCountByConversation = new Map<string, number>();

  for (const message of messageRows) {
    if (!lastMessageByConversation.has(message.conversation_id)) {
      lastMessageByConversation.set(message.conversation_id, message);
    }

    if (message.sender_id !== userId && !message.read_at) {
      unreadCountByConversation.set(message.conversation_id, (unreadCountByConversation.get(message.conversation_id) ?? 0) + 1);
    }
  }

  return conversations.map((conversation) => {
    const participantId = role === "patient" ? conversation.provider_profile_id : conversation.patient_id;
    const participantProfile = profilesMap.get(participantId);
    const providerMeta = role === "patient" ? providerMetaMap.get(participantId) : undefined;
    const lastMessage = lastMessageByConversation.get(conversation.id);

    return {
      id: conversation.id,
      participantId,
      participantName: participantProfile?.full_name ?? "Maven care team",
      participantAvatarUrl: participantProfile?.avatar_url ?? undefined,
      specialtyLabel: providerMeta ? getSpecialtyLabel(providerMeta.specialty) : undefined,
      languages: providerMeta?.languages ?? [],
      lastMessagePreview: getMessagePreview(lastMessage),
      lastMessageAt: lastMessage?.created_at ?? conversation.created_at ?? new Date().toISOString(),
      unreadCount: unreadCountByConversation.get(conversation.id) ?? 0,
    } satisfies ConversationListItem;
  });
}

export async function getConversationThreadForUser(conversationId: string, role: MessagingRole, userId: string): Promise<ConversationThread | null> {
  const supabase = await getSupabaseServerClient();
  const scopedQuery = supabase
    .from("conversations")
    .select("id, patient_id, provider_profile_id, created_at")
    .eq("id", conversationId);

  const { data: conversation, error: conversationError } = role === "patient"
    ? await scopedQuery.eq("patient_id", userId).maybeSingle()
    : await scopedQuery.eq("provider_profile_id", userId).maybeSingle();

  if (conversationError) {
    throw new Error(conversationError.message);
  }

  if (!conversation) {
    return null;
  }

  const participantId = role === "patient" ? conversation.provider_profile_id : conversation.patient_id;
  const [profilesMap, providerMetaMap, messages] = await Promise.all([
    getProfilesMap([conversation.patient_id, conversation.provider_profile_id]),
    getProviderMetaMap([conversation.provider_profile_id]),
    (async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id, conversation_id, sender_id, content, created_at, read_at, attachment_path, attachment_name")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return (data ?? []) as MessageRow[];
    })(),
  ]);

  const participantProfile = profilesMap.get(participantId);
  const providerMeta = providerMetaMap.get(conversation.provider_profile_id);
  const unreadCount = messages.filter((message) => message.sender_id !== userId && !message.read_at).length;

  return {
    id: conversation.id,
    participantId,
    participantName: participantProfile?.full_name ?? "Maven care team",
    participantAvatarUrl: participantProfile?.avatar_url ?? undefined,
    specialtyLabel: role === "patient" && providerMeta ? getSpecialtyLabel(providerMeta.specialty) : undefined,
    languages: role === "patient" ? providerMeta?.languages ?? [] : [],
    unreadCount,
    messages: messages.map((message) => {
      const senderProfile = profilesMap.get(message.sender_id);
      const senderRole = message.sender_id === conversation.patient_id ? "patient" : "provider";
      return {
        id: message.id,
        senderId: message.sender_id,
        senderRole,
        senderName: senderProfile?.full_name ?? (senderRole === "patient" ? "Patient" : "Provider"),
        senderAvatarUrl: senderProfile?.avatar_url ?? undefined,
        content: message.content,
        createdAt: message.created_at,
        readAt: message.read_at,
        attachmentPath: message.attachment_path ?? undefined,
        attachmentName: message.attachment_name ?? undefined,
      } satisfies ConversationMessage;
    }),
  };
}

export async function markConversationRead(conversationId: string, userId: string) {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId)
    .is("read_at", null);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getPatientConversationCandidates() {
  const supabase = await getSupabaseServerClient();
  const { data: providers, error } = await supabase
    .from("providers")
    .select("id, profile_id, specialty, languages, accepting_patients")
    .eq("accepting_patients", true)
    .order("specialty", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (providers ?? []) as ProviderRow[];
  const profilesMap = await getProfilesMap(rows.map((provider) => provider.profile_id).filter((value): value is string => Boolean(value)));

  return rows.flatMap((provider) => {
    if (!provider.profile_id) {
      return [];
    }

    const profile = profilesMap.get(provider.profile_id);
    return [{
      id: provider.profile_id,
      name: profile?.full_name ?? getSpecialtyLabel(provider.specialty),
      avatarUrl: profile?.avatar_url ?? undefined,
      specialtyLabel: getSpecialtyLabel(provider.specialty),
      languages: provider.languages ?? [],
    } satisfies ConversationCandidate];
  });
}

export async function getProviderConversationCandidates(userId: string) {
  const { providerId } = await getProviderContext(userId);
  const supabase = await getSupabaseServerClient();
  const { data: appointments, error } = await supabase
    .from("appointments")
    .select("patient_id")
    .eq("provider_id", providerId);

  if (error) {
    throw new Error(error.message);
  }

  const patientIds = Array.from(new Set((appointments ?? []).map((appointment) => appointment.patient_id).filter(Boolean)));
  const profilesMap = await getProfilesMap(patientIds);

  return patientIds.map((patientId) => {
    const profile = profilesMap.get(patientId);
    return {
      id: patientId,
      name: profile?.full_name ?? "Patient",
      avatarUrl: profile?.avatar_url ?? undefined,
      languages: [],
    } satisfies ConversationCandidate;
  });
}

export async function getPatientMessagingPageData(): Promise<MessagingPageData> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Authenticated patient required.");
  }

  const [conversations, candidates] = await Promise.all([
    buildConversationList("patient", user.id),
    getPatientConversationCandidates(),
  ]);
  const initialConversationId = conversations[0]?.id ?? null;
  const initialThread = initialConversationId ? await getConversationThreadForUser(initialConversationId, "patient", user.id) : null;

  return {
    currentUserId: user.id,
    role: "patient",
    conversations,
    initialConversationId,
    initialThread,
    candidates,
    storageBucket: MESSAGE_ATTACHMENT_BUCKET,
  };
}

export async function getProviderMessagingPageData(): Promise<MessagingPageData> {
  const { userId } = await getProviderContext();
  const [conversations, candidates] = await Promise.all([
    buildConversationList("provider", userId),
    getProviderConversationCandidates(userId),
  ]);
  const initialConversationId = conversations[0]?.id ?? null;
  const initialThread = initialConversationId ? await getConversationThreadForUser(initialConversationId, "provider", userId) : null;

  return {
    currentUserId: userId,
    role: "provider",
    conversations,
    initialConversationId,
    initialThread,
    candidates,
    storageBucket: MESSAGE_ATTACHMENT_BUCKET,
  };
}

export async function createConversationForCurrentUser(payload: CreateConversationInput) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const supabase = await getSupabaseServerClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (profile?.role === "provider") {
    if (!payload.patientId) {
      throw new Error("Patient id is required.");
    }

    const { providerId, userId } = await getProviderContext(user.id);
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select("id")
      .eq("provider_id", providerId)
      .eq("patient_id", payload.patientId)
      .limit(1)
      .maybeSingle();

    if (appointmentError) {
      throw new Error(appointmentError.message);
    }

    if (!appointment) {
      throw new Error("You can only message patients assigned to you.");
    }

    const { data: existing, error: existingError } = await supabase
      .from("conversations")
      .select("id")
      .eq("patient_id", payload.patientId)
      .eq("provider_profile_id", userId)
      .maybeSingle();

    if (existingError) {
      throw new Error(existingError.message);
    }

    if (existing) {
      return existing.id;
    }

    const { data, error } = await supabase
      .from("conversations")
      .insert({ patient_id: payload.patientId, provider_profile_id: userId })
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data.id;
  }

  if (!payload.providerProfileId) {
    throw new Error("Provider id is required.");
  }

  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .select("profile_id")
    .eq("profile_id", payload.providerProfileId)
    .eq("accepting_patients", true)
    .maybeSingle();

  if (providerError) {
    throw new Error(providerError.message);
  }

  if (!provider?.profile_id) {
    throw new Error("Provider not found.");
  }

  const { data: existingConversation, error: existingConversationError } = await supabase
    .from("conversations")
    .select("id")
    .eq("patient_id", user.id)
    .eq("provider_profile_id", provider.profile_id)
    .maybeSingle();

  if (existingConversationError) {
    throw new Error(existingConversationError.message);
  }

  if (existingConversation) {
    return existingConversation.id;
  }

  const { data, error } = await supabase
    .from("conversations")
    .insert({ patient_id: user.id, provider_profile_id: provider.profile_id })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data.id;
}

export async function getConversationRoleForCurrentUser(conversationId: string) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const supabase = await getSupabaseServerClient();
  const { data: conversation, error } = await supabase
    .from("conversations")
    .select("id, patient_id, provider_profile_id")
    .eq("id", conversationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!conversation) {
    return null;
  }

  if (conversation.patient_id === user.id) {
    return { role: "patient" as const, userId: user.id };
  }

  if (conversation.provider_profile_id === user.id) {
    return { role: "provider" as const, userId: user.id };
  }

  return null;
}

export async function resolveConversationThreadForCurrentUser(conversationId: string) {
  const membership = await getConversationRoleForCurrentUser(conversationId);

  if (!membership) {
    return null;
  }

  return getConversationThreadForUser(conversationId, membership.role, membership.userId);
}

export async function getCurrentUserMessagingRole(): Promise<MessagingRole | null> {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.role === "provider" ? "provider" : data?.role === "patient" ? "patient" : null;
}


