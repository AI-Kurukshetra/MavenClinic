import { startOfMonth, subMonths } from "date-fns";
import { formatAvailabilityDay, formatTime, getSpecialtyLabel } from "@/lib/appointments";
import { requireClinicAdminAccess } from "@/lib/clinic-admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/utils";

type ProviderRow = {
  id: string;
  profile_id: string | null;
  specialty: string;
  bio: string | null;
  accepting_patients: boolean | null;
  rating: number | null;
  total_reviews: number | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string | null;
  role?: string | null;
};

type ProfileNameRow = {
  id: string;
  full_name: string | null;
};

type AppointmentRow = {
  id: string;
  patient_id: string | null;
  provider_id: string | null;
  status: string | null;
  scheduled_at: string;
  created_at: string | null;
};

type InvitationRow = {
  id: string;
  email: string;
  role: string | null;
  accepted: boolean | null;
  expires_at: string | null;
  created_at: string | null;
};

type ConversationRow = {
  id: string;
  patient_id: string;
  provider_profile_id: string | null;
  created_at: string | null;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  content: string;
  read_at: string | null;
  created_at: string | null;
};

type NotificationRow = {
  id: string;
  recipient_id: string | null;
  actor_id: string | null;
  type: string | null;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string | null;
};

type ProviderAvailabilityRow = {
  id: string;
  provider_id: string;
  day_of_week: string | number;
  start_time: string;
  end_time: string;
  location: string | null;
};

type CarePlanRow = {
  id: string;
  patient_id: string | null;
  provider_id: string | null;
  title: string;
  description: string | null;
  milestones: unknown;
  status: string | null;
  created_at: string | null;
};


type ContentRow = {
  id: string;
  title: string;
  content: string | null;
  category: string | null;
  life_stage: string | null;
  published: boolean | null;
  author_id: string | null;
  created_at: string | null;
};

type SupportGroupRow = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  moderator_id: string | null;
  active: boolean | null;
  created_at: string | null;
};

export type ClinicStatsCard = {
  title: string;
  value: string;
  delta: string;
  href: string;
};

export type ClinicProviderListItem = {
  id: string;
  avatarUrl: string | null;
  name: string;
  specialty: string;
  status: "Active and accepting" | "Inactive" | "Pending approval";
  rating: number;
  patients: number;
  joinedDate: string;
  bio: string | null;
  totalReviews: number;
};

export type ClinicInvitationListItem = {
  id: string;
  email: string;
  role: string;
  invitedBy: string;
  sentDate: string;
  expiresDate: string;
  status: "accepted" | "pending" | "expired";
};

export type ClinicConversationListItem = {
  id: string;
  patientName: string;
  providerName: string;
  lastMessagePreview: string;
  lastMessageTime: string;
  messageCount: number;
};

export type ClinicNotificationListItem = {
  id: string;
  userName: string;
  type: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
};

export type ClinicProviderDetail = {
  id: string;
  avatarUrl: string | null;
  name: string;
  specialty: string;
  bio: string;
  rating: number;
  reviews: number;
  totalAppointments: number;
  patients: number;
  availability: Array<{ id: string; dayLabel: string; timeLabel: string; location: string }>;
};

export type ClinicContentItem = {
  id: string;
  title: string;
  category: string;
  lifeStage: string;
  published: boolean;
  author: string;
  date: string;
};

export type ClinicCareTemplateItem = {
  id: string;
  name: string;
  specialty: string;
  milestoneCount: number;
  usageCount: number;
  description: string;
};

export type ClinicSupportGroupItem = {
  id: string;
  name: string;
  category: string;
  members: number;
  moderator: string;
  active: boolean;
};

export type ClinicAnalyticsData = {
  totals: {
    patients: number;
    providers: number;
    appointments: number;
    messages: number;
  };
  mauTrend: Array<{ month: string; value: number }>;
  completionTrend: Array<{ month: string; value: number }>;
  topSpecialties: Array<{ name: string; value: number }>;
  signups: Array<{ month: string; value: number }>;
};

function formatDateLabel(value?: string | null) {
  if (!value) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTimeLabel(value?: string | null) {
  if (!value) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatRoleLabel(value?: string | null) {
  if (!value) {
    return "Unknown";
  }

  return value
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function getProviderStatus(value: boolean | null): ClinicProviderListItem["status"] {
  if (value === true) {
    return "Active and accepting";
  }

  if (value === false) {
    return "Inactive";
  }

  return "Pending approval";
}

function getInvitationStatus(invitation: InvitationRow): ClinicInvitationListItem["status"] {
  if (invitation.accepted) {
    return "accepted";
  }

  if (invitation.expires_at && new Date(invitation.expires_at).getTime() < Date.now()) {
    return "expired";
  }

  return "pending";
}

type QueryResult<T> = PromiseLike<{ data: T | null; error: { message?: string } | null }>;

async function safeRows<T>(query: QueryResult<T[]>): Promise<T[]> {
  try {
    const result = await query;
    if (result.error) {
      return [];
    }

    return result.data ?? [];
  } catch {
    return [];
  }
}

async function safeMaybeSingle<T>(query: QueryResult<T>): Promise<T | null> {
  try {
    const result = await query;
    if (result.error) {
      return null;
    }

    return result.data;
  } catch {
    return null;
  }
}

async function getBaseClinicData() {
  await requireClinicAdminAccess();
  const admin = getSupabaseAdminClient();

  const [providers, providerProfiles, appointments, patientProfiles, invitations, conversations, messages, notifications] = await Promise.all([
    safeRows<ProviderRow>(admin.from("providers").select("id, profile_id, specialty, bio, accepting_patients, rating, total_reviews").order("specialty", { ascending: true })),
    safeRows<ProfileRow>(admin.from("profiles").select("id, full_name, avatar_url, created_at, role").in("role", ["provider", "patient", "clinic_admin", "super_admin"])),
    safeRows<AppointmentRow>(admin.from("appointments").select("id, patient_id, provider_id, status, scheduled_at, created_at").order("scheduled_at", { ascending: false })),
    safeRows<ProfileRow>(admin.from("profiles").select("id, full_name, avatar_url, created_at, role").eq("role", "patient")),
    safeRows<InvitationRow>(admin.from("invitations").select("id, email, role, accepted, expires_at, created_at").order("created_at", { ascending: false })),
    safeRows<ConversationRow>(admin.from("conversations").select("id, patient_id, provider_profile_id, created_at").order("created_at", { ascending: false })),
    safeRows<MessageRow>(admin.from("messages").select("id, conversation_id, sender_id, content, read_at, created_at").order("created_at", { ascending: false })),
    safeRows<NotificationRow>(admin.from("notifications").select("id, recipient_id, actor_id, type, title, body, read_at, created_at").order("created_at", { ascending: false })),
  ]);

  const profileMap = new Map(providerProfiles.map((profile) => [profile.id, profile]));
  const patientMap = new Map(patientProfiles.map((profile) => [profile.id, profile]));

  return {
    admin,
    providers,
    providerProfiles,
    profileMap,
    patientProfiles,
    patientMap,
    appointments,
    invitations,
    conversations,
    messages,
    notifications,
  };
}

export async function getClinicDashboardData() {
  const base = await getBaseClinicData();

  const patientsByProvider = new Map<string, Set<string>>();
  const monthlyAppointmentsStart = startOfMonth(new Date()).getTime();

  for (const appointment of base.appointments) {
    if (!appointment.provider_id || !appointment.patient_id) {
      continue;
    }

    const set = patientsByProvider.get(appointment.provider_id) ?? new Set<string>();
    set.add(appointment.patient_id);
    patientsByProvider.set(appointment.provider_id, set);
  }

  const providerManagement: ClinicProviderListItem[] = base.providers.map((provider) => {
    const profile = provider.profile_id ? base.profileMap.get(provider.profile_id) : undefined;
    return {
      id: provider.id,
      avatarUrl: profile?.avatar_url ?? null,
      name: profile?.full_name ?? `${getSpecialtyLabel(provider.specialty)} specialist`,
      specialty: getSpecialtyLabel(provider.specialty),
      status: getProviderStatus(provider.accepting_patients),
      rating: Number(provider.rating ?? 0),
      patients: patientsByProvider.get(provider.id)?.size ?? 0,
      joinedDate: formatDateLabel(profile?.created_at),
      bio: provider.bio,
      totalReviews: Number(provider.total_reviews ?? 0),
    };
  });

  const invitationQueue = base.invitations.map((invitation) => ({
    id: invitation.id,
    email: invitation.email,
    role: formatRoleLabel(invitation.role),
    invitedBy: "Clinic admin",
    sentDate: formatDateLabel(invitation.created_at),
    expiresDate: formatDateLabel(invitation.expires_at),
    status: getInvitationStatus(invitation),
  }));

  const messagesByConversation = new Map<string, MessageRow[]>();
  for (const message of base.messages) {
    const list = messagesByConversation.get(message.conversation_id) ?? [];
    list.push(message);
    messagesByConversation.set(message.conversation_id, list);
  }

  const conversationLoad: ClinicConversationListItem[] = base.conversations.map((conversation) => {
    const patientName = base.patientMap.get(conversation.patient_id)?.full_name ?? "Patient";
    const providerName = conversation.provider_profile_id
      ? base.profileMap.get(conversation.provider_profile_id)?.full_name ?? "Provider"
      : "Unassigned provider";
    const rows = messagesByConversation.get(conversation.id) ?? [];
    const lastMessage = rows[0];

    return {
      id: conversation.id,
      patientName,
      providerName,
      lastMessagePreview: lastMessage?.content ?? "No messages yet.",
      lastMessageTime: formatDateTimeLabel(lastMessage?.created_at ?? conversation.created_at),
      messageCount: rows.length,
    };
  });

  const notifications = base.notifications.map((item) => ({
    id: item.id,
    userName: item.recipient_id ? base.profileMap.get(item.recipient_id)?.full_name ?? "User" : "System",
    type: item.type ?? "system",
    title: item.title,
    body: item.body ?? "",
    time: formatDateTimeLabel(item.created_at),
    read: Boolean(item.read_at),
  }));

  return {
    stats: {
      cards: [
        {
          title: "Providers",
          value: String(providerManagement.length),
          delta: "Review roster and approval status",
          href: "/clinic/providers",
        },
        {
          title: "Invitations",
          value: String(invitationQueue.filter((item) => item.status === "pending").length),
          delta: "Pending onboarding invitations",
          href: "/clinic/invitations",
        },
        {
          title: "Conversations",
          value: String(conversationLoad.length),
          delta: "Audit active patient-provider threads",
          href: "/clinic/dashboard?tab=conversations",
        },
        {
          title: "Notifications",
          value: String(notifications.length),
          delta: "Recent operational events",
          href: "/clinic/dashboard?tab=notifications",
        },
        {
          title: "Platform patients",
          value: String(base.patientProfiles.length),
          delta: "Patients with profiles on the platform",
          href: "/clinic/analytics",
        },
        {
          title: "This month appointments",
          value: String(base.appointments.filter((appointment) => new Date(appointment.scheduled_at).getTime() >= monthlyAppointmentsStart).length),
          delta: "Appointments scheduled in the current month",
          href: "/clinic/analytics",
        },
      ] satisfies ClinicStatsCard[],
      summary: [
        `${providerManagement.filter((item) => item.status === "Active and accepting").length} providers are currently accepting patients`,
        `${invitationQueue.filter((item) => item.status === "pending").length} invitations still need action`,
        `${notifications.filter((item) => !item.read).length} notifications are unread platform-wide`,
      ],
    },
    providerManagement,
    invitationQueue,
    conversationLoad,
    notifications,
  };
}

export async function getClinicProvidersPageData() {
  const { providerManagement } = await getClinicDashboardData();
  return { providers: providerManagement };
}

export async function getClinicInvitationsPageData() {
  const { invitationQueue } = await getClinicDashboardData();
  return { invitations: invitationQueue };
}

export async function getClinicConversationsPageData() {
  const { conversationLoad } = await getClinicDashboardData();
  return { conversations: conversationLoad };
}

export async function getClinicNotificationsPageData() {
  const { notifications } = await getClinicDashboardData();
  return { notifications };
}

export async function getClinicProviderDetailData(providerId: string): Promise<ClinicProviderDetail | null> {
  await requireClinicAdminAccess();
  const admin = getSupabaseAdminClient();
  const provider = await safeMaybeSingle<ProviderRow>(
    admin.from("providers").select("id, profile_id, specialty, bio, accepting_patients, rating, total_reviews").eq("id", providerId).maybeSingle(),
  );

  if (!provider) {
    return null;
  }

  const [profile, appointments, availability] = await Promise.all([
    provider.profile_id
      ? safeMaybeSingle<ProfileRow>(admin.from("profiles").select("id, full_name, avatar_url, created_at").eq("id", provider.profile_id).maybeSingle())
      : Promise.resolve(null),
    safeRows<AppointmentRow>(admin.from("appointments").select("id, patient_id, provider_id, status, scheduled_at, created_at").eq("provider_id", providerId)),
    safeRows<ProviderAvailabilityRow>(admin.from("provider_availability").select("id, provider_id, day_of_week, start_time, end_time, location").eq("provider_id", providerId).order("day_of_week", { ascending: true }).order("start_time", { ascending: true })),
  ]);

  const patientIds = new Set(appointments.map((item) => item.patient_id).filter((value): value is string => Boolean(value)));

  return {
    id: provider.id,
    avatarUrl: profile?.avatar_url ?? null,
    name: profile?.full_name ?? `${getSpecialtyLabel(provider.specialty)} specialist`,
    specialty: getSpecialtyLabel(provider.specialty),
    bio: provider.bio ?? "This provider has not added a public biography yet.",
    rating: Number(provider.rating ?? 0),
    reviews: Number(provider.total_reviews ?? 0),
    totalAppointments: appointments.length,
    patients: patientIds.size,
    availability: availability.map((slot) => ({
      id: slot.id,
      dayLabel: formatAvailabilityDay(slot.day_of_week),
      timeLabel: `${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}`,
      location: slot.location ?? "Virtual",
    })),
  };
}

export async function getClinicContentPageData() {
  await requireClinicAdminAccess();
  const admin = getSupabaseAdminClient();
  const articles = await safeRows<ContentRow>(
    admin.from("educational_content").select("id, title, content, category, life_stage, published, author_id, created_at").order("created_at", { ascending: false }),
  );
  const authorIds = Array.from(new Set(articles.map((item) => item.author_id).filter((value): value is string => Boolean(value))));
  const authors = authorIds.length
    ? await safeRows<ProfileNameRow>(admin.from("profiles").select("id, full_name").in("id", authorIds))
    : [];
  const authorMap = new Map(authors.map((author) => [author.id, author.full_name ?? "Clinic admin"]));

  return {
    articles: articles.map((article) => ({
      id: article.id,
      title: article.title,
      category: article.category ?? "General",
      lifeStage: article.life_stage ?? "All stages",
      published: Boolean(article.published),
      author: article.author_id ? authorMap.get(article.author_id) ?? "Clinic admin" : "Clinic admin",
      date: formatDateLabel(article.created_at),
    })) as ClinicContentItem[],
  };
}

export async function getClinicCareTemplatesPageData() {
  await requireClinicAdminAccess();
  const admin = getSupabaseAdminClient();
  const templates = await safeRows<CarePlanRow>(
    admin.from("care_plans").select("id, patient_id, provider_id, title, description, milestones, status, created_at").is("patient_id", null).order("created_at", { ascending: false }),
  );
  const allCarePlans = await safeRows<CarePlanRow>(
    admin.from("care_plans").select("id, patient_id, provider_id, title, description, milestones, status, created_at").not("patient_id", "is", null),
  );
  const usageCountByTitle = new Map<string, number>();
  for (const plan of allCarePlans) {
    usageCountByTitle.set(plan.title, (usageCountByTitle.get(plan.title) ?? 0) + 1);
  }

  return {
    templates: templates.map((template) => ({
      id: template.id,
      name: template.title,
      specialty: template.status === "template" ? "General" : "General",
      milestoneCount: Array.isArray(template.milestones) ? template.milestones.length : 0,
      usageCount: usageCountByTitle.get(template.title) ?? 0,
      description: template.description ?? "Reusable care plan template.",
    })) as ClinicCareTemplateItem[],
  };
}

export async function getClinicSupportGroupsPageData() {
  await requireClinicAdminAccess();
  const admin = getSupabaseAdminClient();
  const [groups, providerRows] = await Promise.all([
    safeRows<SupportGroupRow>(
      admin.from("support_groups").select("id, name, description, category, moderator_id, active, created_at").order("created_at", { ascending: false }),
    ),
    safeRows<{ profile_id: string | null }>(admin.from("providers").select("profile_id")),
  ]);
  const moderatorIds = Array.from(new Set([
    ...groups.map((item) => item.moderator_id).filter((value): value is string => Boolean(value)),
    ...providerRows.map((item) => item.profile_id).filter((value): value is string => Boolean(value)),
  ]));
  const moderators = moderatorIds.length
    ? await safeRows<ProfileNameRow>(admin.from("profiles").select("id, full_name").in("id", moderatorIds))
    : [];
  const moderatorMap = new Map(moderators.map((item) => [item.id, item.full_name ?? "Clinic admin"]));

  return {
    groups: groups.map((group) => ({
      id: group.id,
      name: group.name,
      category: group.category ?? "General",
      members: 0,
      moderator: group.moderator_id ? moderatorMap.get(group.moderator_id) ?? "Clinic admin" : "Unassigned",
      active: Boolean(group.active),
    })) as ClinicSupportGroupItem[],
    moderators: providerRows
      .map((row) => row.profile_id)
      .filter((value): value is string => Boolean(value))
      .map((id) => ({ id, name: moderatorMap.get(id) ?? "Clinic provider" })),
  };
}

export async function getClinicAnalyticsPageData(): Promise<ClinicAnalyticsData> {
  const base = await getBaseClinicData();
  const providerMap = new Map(base.providers.map((provider) => [provider.id, provider]));
  const months = Array.from({ length: 6 }, (_, index) => startOfMonth(subMonths(new Date(), 5 - index)));

  const mauTrend = months.map((month) => {
    const nextMonth = startOfMonth(subMonths(month, -1));
    const members = new Set<string>();

    for (const appointment of base.appointments) {
      const value = new Date(appointment.scheduled_at);
      if (value >= month && value < nextMonth) {
        if (appointment.patient_id) members.add(appointment.patient_id);
        const providerProfileId = appointment.provider_id ? providerMap.get(appointment.provider_id)?.profile_id : null;
        if (providerProfileId) members.add(providerProfileId);
      }
    }

    for (const message of base.messages) {
      const value = message.created_at ? new Date(message.created_at) : null;
      if (value && value >= month && value < nextMonth && message.sender_id) {
        members.add(message.sender_id);
      }
    }

    return {
      month: formatDate(month, "MMM yyyy"),
      value: members.size,
    };
  });

  const completionTrend = months.map((month) => {
    const nextMonth = startOfMonth(subMonths(month, -1));
    const total = base.appointments.filter((appointment) => {
      const value = new Date(appointment.scheduled_at);
      return value >= month && value < nextMonth && appointment.status !== "cancelled";
    });
    const completed = total.filter((appointment) => appointment.status === "completed");

    return {
      month: formatDate(month, "MMM yyyy"),
      value: total.length ? Math.round((completed.length / total.length) * 100) : 0,
    };
  });

  const specialtyCounts = new Map<string, number>();
  for (const appointment of base.appointments) {
    if (!appointment.provider_id) {
      continue;
    }

    const provider = providerMap.get(appointment.provider_id);
    const label = provider ? getSpecialtyLabel(provider.specialty) : "General";
    specialtyCounts.set(label, (specialtyCounts.get(label) ?? 0) + 1);
  }

  const topSpecialties = Array.from(specialtyCounts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 6);

  const signupMap = new Map<string, number>();
  for (const profile of [...base.providerProfiles, ...base.patientProfiles]) {
    if (!profile.created_at) {
      continue;
    }

    const month = formatDate(profile.created_at, "MMM yyyy");
    signupMap.set(month, (signupMap.get(month) ?? 0) + 1);
  }

  const signups = months.map((month) => ({
    month: formatDate(month, "MMM yyyy"),
    value: signupMap.get(formatDate(month, "MMM yyyy")) ?? 0,
  }));

  return {
    totals: {
      patients: base.patientProfiles.length,
      providers: base.providers.length,
      appointments: base.appointments.length,
      messages: base.messages.length,
    },
    mauTrend,
    completionTrend,
    topSpecialties,
    signups,
  };
}
