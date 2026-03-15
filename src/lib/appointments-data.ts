import { addDays, endOfDay, startOfDay } from "date-fns";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth";
import {
  buildAvailabilityByDate,
  findNextAvailableSlot,
  getSpecialtyLabel,
  isJoinWindow,
  type AvailabilityRow,
  type BookedAppointmentRow,
  type GeneratedDateSlots,
} from "@/lib/appointments";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Appointment, Provider } from "@/types/domain";

export type BookingProvider = Provider & {
  availability: GeneratedDateSlots[];
};

export type UpcomingAppointment = Appointment & {
  conversationId?: string;
};

export type AppointmentsPageData = {
  currentUserId: string;
  upcomingAppointments: UpcomingAppointment[];
  bookingProviders: BookingProvider[];
};

export type ConsultationRoomData = {
  appointment: UpcomingAppointment;
  provider: {
    id: string;
    fullName: string;
    specialtyLabel: string;
    bio: string;
    languages: string[];
    avatarUrl?: string;
  };
  conversationId: string;
  messages: Array<{
    id: string;
    sender: "patient" | "provider";
    content: string;
    createdAt: string;
  }>;
};

type ProviderRow = {
  id: string;
  profile_id: string | null;
  specialty: string;
  bio: string | null;
  languages: string[] | null;
  accepting_patients: boolean | null;
  suspended?: boolean | null;
  approval_status?: string | null;
  consultation_fee_cents: number | null;
  rating: number | null;
  total_reviews: number | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

function getAdminClientSafe() {
  try {
    return getSupabaseAdminClient();
  } catch (error) {
    console.error("Appointments admin client unavailable:", {
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

async function getProviderProfilesMap(profileIds: string[]) {
  const admin = getAdminClientSafe();
  const supabase = await getSupabaseServerClient();
  const profileClient = admin ?? supabase;
  const { data, error } = profileIds.length
    ? await profileClient.from("profiles").select("id, full_name, avatar_url").in("id", profileIds)
    : { data: [], error: null };

  if (error) {
    console.error("Appointments provider profile lookup failed:", {
      message: error.message,
      profileIds,
    });
    return new Map<string, ProfileRow>();
  }

  return new Map((data as ProfileRow[]).map((profile) => [profile.id, profile]));
}

async function getBookableProviderRows() {
  const admin = getAdminClientSafe();
  const supabase = await getSupabaseServerClient();
  const providerClient = admin ?? supabase;

  const baseSelect = "id, profile_id, specialty, bio, languages, accepting_patients, consultation_fee_cents, rating, total_reviews, suspended, approval_status";
  const legacySelect = "id, profile_id, specialty, bio, languages, accepting_patients, consultation_fee_cents, rating, total_reviews";

  const primaryResult = await providerClient.from("providers").select(baseSelect).order("specialty", { ascending: true });
  let providerRows = (primaryResult.data ?? []) as ProviderRow[];

  if (primaryResult.error && (primaryResult.error.message.includes("suspended") || primaryResult.error.message.includes("approval_status"))) {
    console.error("Bookable providers query hit legacy schema, retrying without optional columns:", primaryResult.error.message);
    const legacyResult = await providerClient.from("providers").select(legacySelect).order("specialty", { ascending: true });

    if (legacyResult.error) {
      console.error("Legacy bookable providers query failed:", legacyResult.error.message);
      return { data: [] as ProviderRow[], error: null };
    }

    providerRows = (legacyResult.data ?? []) as ProviderRow[];
  } else if (primaryResult.error) {
    console.error("Bookable providers query failed:", primaryResult.error.message);
    return { data: [] as ProviderRow[], error: null };
  }

  const strictlyBookable = providerRows.filter(
    (provider) =>
      provider.accepting_patients === true &&
      provider.suspended !== true &&
      (provider.approval_status == null || provider.approval_status === "approved"),
  );

  const acceptingFallback = providerRows.filter((provider) => provider.accepting_patients !== false);
  const finalProviders = strictlyBookable.length ? strictlyBookable : acceptingFallback.length ? acceptingFallback : providerRows;

  console.log("Providers query result:", {
    count: finalProviders.length,
    totalCandidates: providerRows.length,
    usedAdminClient: Boolean(admin),
  });

  return { data: finalProviders, error: null };
}
function mapProvider(row: ProviderRow, profile?: ProfileRow | null, availability: GeneratedDateSlots[] = []): BookingProvider {
  const nextAvailable = findNextAvailableSlot(availability);

  return {
    id: row.id,
    profileId: row.profile_id ?? undefined,
    fullName: profile?.full_name ?? "Maven provider",
    specialty: row.specialty as Provider["specialty"],
    specialtyLabel: getSpecialtyLabel(row.specialty),
    bio: row.bio ?? "Specialist on the Maven care team.",
    languages: row.languages ?? ["English"],
    acceptingPatients: row.accepting_patients ?? true,
    consultationFeeCents: row.consultation_fee_cents ?? 0,
    rating: Number(row.rating ?? 5),
    totalReviews: row.total_reviews ?? 0,
    avatarUrl: profile?.avatar_url ?? undefined,
    nextAvailable: nextAvailable ? [nextAvailable] : [],
    availability,
  };
}

async function getConversationMap(patientId: string, providerProfileIds: string[]) {
  const supabase = await getSupabaseServerClient();
  const { data, error } = providerProfileIds.length
    ? await supabase
        .from("conversations")
        .select("id, provider_profile_id")
        .eq("patient_id", patientId)
        .in("provider_profile_id", providerProfileIds)
    : { data: [], error: null };

  if (error) {
    console.error("Appointments conversation lookup failed:", {
      patientId,
      message: error.message,
    });
    return new Map<string, string>();
  }

  return new Map((data ?? []).map((conversation) => [conversation.provider_profile_id, conversation.id]));
}

export async function getAppointmentsPageData(): Promise<AppointmentsPageData> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Authenticated patient required.");
  }

  try {
    const supabase = await getSupabaseServerClient();
    const admin = getAdminClientSafe();
    const providerClient = admin ?? supabase;
    const bookingWindowStart = startOfDay(new Date()).toISOString();
    const bookingWindowEnd = endOfDay(addDays(new Date(), 13)).toISOString();

    const [upcomingAppointmentsResult, bookableProvidersResult] = await Promise.all([
      supabase
        .from("appointments")
        .select("id, patient_id, provider_id, scheduled_at, duration_minutes, type, status, chief_complaint, video_room_url, notes, payment_method, started_at")
        .eq("patient_id", user.id)
        .in("status", ["scheduled", "in_progress"])
        .order("scheduled_at", { ascending: true }),
      getBookableProviderRows(),
    ]);

    if (upcomingAppointmentsResult.error) {
      throw new Error(upcomingAppointmentsResult.error.message);
    }


    const upcomingAppointmentsRows = upcomingAppointmentsResult.data ?? [];
    const bookableProviderRows = (bookableProvidersResult.data ?? []) as ProviderRow[];
    const appointmentProviderIds = Array.from(new Set(upcomingAppointmentsRows.map((appointment) => appointment.provider_id).filter(Boolean)));
    const allProviderIds = Array.from(new Set([...appointmentProviderIds, ...bookableProviderRows.map((provider) => provider.id)]));

    const [appointmentProviderRowsResult, availabilityResult, bookedAppointmentsResult] = await Promise.all([
      allProviderIds.length
        ? providerClient
            .from("providers")
            .select("id, profile_id, specialty, bio, languages, accepting_patients, consultation_fee_cents, rating, total_reviews")
            .in("id", allProviderIds)
        : Promise.resolve({ data: [] as ProviderRow[], error: null }),
      allProviderIds.length
        ? supabase
            .from("provider_availability")
            .select("id, provider_id, day_of_week, start_time, end_time")
            .in("provider_id", allProviderIds)
        : Promise.resolve({ data: [] as Array<AvailabilityRow & { provider_id: string }>, error: null }),
      allProviderIds.length
        ? supabase
            .from("appointments")
            .select("id, provider_id, scheduled_at, duration_minutes, status")
            .in("provider_id", allProviderIds)
            .neq("status", "cancelled")
            .gte("scheduled_at", bookingWindowStart)
            .lte("scheduled_at", bookingWindowEnd)
        : Promise.resolve({ data: [] as Array<BookedAppointmentRow & { provider_id: string }>, error: null }),
    ]);

    if (appointmentProviderRowsResult.error) {
      throw new Error(appointmentProviderRowsResult.error.message);
    }

    if (availabilityResult.error) {
      throw new Error(availabilityResult.error.message);
    }

    if (bookedAppointmentsResult.error) {
      throw new Error(bookedAppointmentsResult.error.message);
    }

    const allProviderRows = (appointmentProviderRowsResult.data ?? []) as ProviderRow[];
    const profileIds = Array.from(new Set(allProviderRows.map((provider) => provider.profile_id).filter((value): value is string => Boolean(value))));
    const [profilesMap, conversationMap] = await Promise.all([
      getProviderProfilesMap(profileIds),
      getConversationMap(user.id, profileIds),
    ]);

    const availabilityByProviderId = new Map<string, AvailabilityRow[]>();
    for (const row of (availabilityResult.data ?? []) as Array<AvailabilityRow & { provider_id: string }>) {
      const current = availabilityByProviderId.get(row.provider_id) ?? [];
      current.push(row);
      availabilityByProviderId.set(row.provider_id, current);
    }

    const bookingsByProviderId = new Map<string, BookedAppointmentRow[]>();
    for (const row of (bookedAppointmentsResult.data ?? []) as Array<BookedAppointmentRow & { provider_id: string }>) {
      const current = bookingsByProviderId.get(row.provider_id) ?? [];
      current.push(row);
      bookingsByProviderId.set(row.provider_id, current);
    }

    const providerMap = new Map<string, BookingProvider>();
    for (const provider of allProviderRows) {
      const profile = provider.profile_id ? profilesMap.get(provider.profile_id) : null;
      const availability = buildAvailabilityByDate(
        availabilityByProviderId.get(provider.id) ?? [],
        bookingsByProviderId.get(provider.id) ?? [],
      );

      providerMap.set(provider.id, mapProvider(provider, profile, availability));
    }

    const upcomingAppointments: UpcomingAppointment[] = upcomingAppointmentsRows.flatMap((appointment) => {
      const provider = providerMap.get(appointment.provider_id);

      if (!provider) {
        return [];
      }

      return [
        {
          id: appointment.id,
          patientId: appointment.patient_id,
          providerId: appointment.provider_id,
          providerName: provider.fullName,
          providerSpecialty: provider.specialtyLabel,
          providerAvatarUrl: provider.avatarUrl ?? undefined,
          scheduledAt: appointment.scheduled_at,
          durationMinutes: appointment.duration_minutes ?? 30,
          type: appointment.type,
          status: appointment.status,
          chiefComplaint: appointment.chief_complaint ?? "General follow-up",
          videoRoomUrl: appointment.video_room_url ?? undefined,
          notes: appointment.notes ?? undefined,
          paymentMethod: (appointment.payment_method as Appointment["paymentMethod"]) ?? undefined,
          startedAt: appointment.started_at ?? undefined,
          conversationId: provider.profileId ? conversationMap.get(provider.profileId) : undefined,
        },
      ];
    });

    const bookingProviders = bookableProviderRows
      .map((provider) => providerMap.get(provider.id))
      .filter((provider): provider is BookingProvider => Boolean(provider));

    return {
      currentUserId: user.id,
      upcomingAppointments,
      bookingProviders,
    };
  } catch (error) {
    console.error("Appointments page data error:", {
      userId: user.id,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return {
      currentUserId: user.id,
      upcomingAppointments: [],
      bookingProviders: [],
    };
  }
}

export async function getAvailableSlotsForProvider(providerId: string, excludedAppointmentId?: string) {
  const supabase = await getSupabaseServerClient();
  const bookingWindowStart = startOfDay(new Date()).toISOString();
  const bookingWindowEnd = endOfDay(addDays(new Date(), 13)).toISOString();

  const [availabilityResult, bookedAppointmentsResult] = await Promise.all([
    supabase
      .from("provider_availability")
      .select("id, day_of_week, start_time, end_time")
      .eq("provider_id", providerId),
    supabase
      .from("appointments")
      .select("id, scheduled_at, duration_minutes, status")
      .eq("provider_id", providerId)
      .neq("status", "cancelled")
      .gte("scheduled_at", bookingWindowStart)
      .lte("scheduled_at", bookingWindowEnd),
  ]);

  if (availabilityResult.error) {
    throw new Error(availabilityResult.error.message);
  }

  if (bookedAppointmentsResult.error) {
    throw new Error(bookedAppointmentsResult.error.message);
  }

  const bookedAppointments = (bookedAppointmentsResult.data ?? []).filter((appointment) => appointment.id !== excludedAppointmentId);
  return buildAvailabilityByDate(availabilityResult.data ?? [], bookedAppointments);
}

export async function getConsultationRoomData(appointmentId: string): Promise<ConsultationRoomData | null> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Authenticated user required.");
  }

  const profile = await getCurrentProfile(user.id);
  const supabase = await getSupabaseServerClient();
  let appointmentQuery = supabase
    .from("appointments")
    .select("id, patient_id, provider_id, scheduled_at, duration_minutes, type, status, chief_complaint, video_room_url, notes, payment_method, started_at")
    .eq("id", appointmentId);

  if (profile?.role === "provider") {
    const { data: providerRecord, error: providerRecordError } = await supabase
      .from("providers")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (providerRecordError) {
      throw new Error(providerRecordError.message);
    }

    if (!providerRecord?.id) {
      return null;
    }

    appointmentQuery = appointmentQuery.eq("provider_id", providerRecord.id);
  } else {
    appointmentQuery = appointmentQuery.eq("patient_id", user.id);
  }

  const { data: appointmentRow, error: appointmentError } = await appointmentQuery.maybeSingle();

  if (appointmentError) {
    throw new Error(appointmentError.message);
  }

  if (!appointmentRow) {
    return null;
  }

  const joinAllowed = isJoinWindow(appointmentRow.scheduled_at, appointmentRow.status);
  if (!joinAllowed || !["scheduled", "in_progress"].includes(appointmentRow.status)) {
    return null;
  }

  const admin = getSupabaseAdminClient();
  const { data: providerRow, error: providerError } = await admin
    .from("providers")
    .select("id, profile_id, specialty, bio, languages")
    .eq("id", appointmentRow.provider_id)
    .maybeSingle();

  if (providerError) {
    throw new Error(providerError.message);
  }

  if (!providerRow?.profile_id) {
    return null;
  }

  const { data: providerProfile, error: providerProfileError } = await admin
    .from("profiles")
    .select("id, full_name, avatar_url")
    .eq("id", providerRow.profile_id)
    .maybeSingle();

  if (providerProfileError) {
    throw new Error(providerProfileError.message);
  }

  const { data: existingConversationRow, error: conversationError } = await supabase
    .from("conversations")
    .select("id")
    .eq("patient_id", appointmentRow.patient_id)
    .eq("provider_profile_id", providerRow.profile_id)
    .maybeSingle();

  if (conversationError) {
    throw new Error(conversationError.message);
  }

  let conversationRow = existingConversationRow;

  if (!conversationRow) {
    const insertResult = await supabase
      .from("conversations")
      .insert({ patient_id: appointmentRow.patient_id, provider_profile_id: providerRow.profile_id })
      .select("id")
      .single();

    if (insertResult.error) {
      throw new Error(insertResult.error.message);
    }

    conversationRow = insertResult.data;
  }

  if (appointmentRow.status === "scheduled") {
    const startedAt = new Date().toISOString();
    let startQuery = supabase
      .from("appointments")
      .update({ status: "in_progress", started_at: startedAt, updated_at: startedAt })
      .eq("id", appointmentRow.id)
      .eq("status", "scheduled");

    if (profile?.role === "provider") {
      startQuery = startQuery.eq("provider_id", appointmentRow.provider_id);
    } else {
      startQuery = startQuery.eq("patient_id", appointmentRow.patient_id);
    }

    const { error: startError } = await startQuery;

    if (startError) {
      throw new Error(startError.message);
    }

    appointmentRow.status = "in_progress";
    appointmentRow.started_at = startedAt;
  }

  const { data: messagesRows, error: messagesError } = await supabase
    .from("messages")
    .select("id, sender_id, content, created_at")
    .eq("conversation_id", conversationRow.id)
    .order("created_at", { ascending: true });

  if (messagesError) {
    throw new Error(messagesError.message);
  }

  const { error: readError } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationRow.id)
    .neq("sender_id", user.id)
    .is("read_at", null);

  if (readError) {
    throw new Error(readError.message);
  }

  return {
    appointment: {
      id: appointmentRow.id,
      patientId: appointmentRow.patient_id,
      providerId: appointmentRow.provider_id,
      providerName: providerProfile?.full_name ?? "Maven provider",
      providerSpecialty: getSpecialtyLabel(providerRow.specialty),
      providerAvatarUrl: providerProfile?.avatar_url ?? undefined,
      scheduledAt: appointmentRow.scheduled_at,
      durationMinutes: appointmentRow.duration_minutes ?? 30,
      type: appointmentRow.type,
      status: appointmentRow.status,
      chiefComplaint: appointmentRow.chief_complaint ?? "General follow-up",
      videoRoomUrl: appointmentRow.video_room_url ?? undefined,
      notes: appointmentRow.notes ?? undefined,
      paymentMethod: (appointmentRow.payment_method as Appointment["paymentMethod"]) ?? undefined,
      startedAt: appointmentRow.started_at ?? undefined,
      conversationId: conversationRow.id,
    },
    provider: {
      id: providerRow.id,
      fullName: providerProfile?.full_name ?? "Maven provider",
      specialtyLabel: getSpecialtyLabel(providerRow.specialty),
      bio: providerRow.bio ?? "Specialist on the Maven care team.",
      languages: providerRow.languages ?? ["English"],
      avatarUrl: providerProfile?.avatar_url ?? undefined,
    },
    conversationId: conversationRow.id,
    messages: (messagesRows ?? []).map((message) => ({
      id: message.id,
      sender: message.sender_id === user.id ? "patient" : "provider",
      content: message.content,
      createdAt: message.created_at,
    })),
  };
}






