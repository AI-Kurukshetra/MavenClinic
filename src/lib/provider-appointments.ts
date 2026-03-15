import { addDays, endOfDay, endOfWeek, startOfDay, startOfMonth, startOfWeek } from "date-fns";
import { buildAvailabilityByDate, findNextAvailableSlot, type AvailabilityRow, type GeneratedDateSlots } from "@/lib/appointments";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type ProviderAppointmentsPageAppointment = {
  id: string;
  patientId: string;
  patientName: string;
  patientAvatarUrl: string | null;
  scheduledAt: string;
  durationMinutes: number;
  type: "video" | "messaging" | "async_review";
  status: "scheduled" | "in_progress" | "completed" | "cancelled" | "no_show";
  chiefComplaint: string;
  notes: string;
  cancellationReason: string | null;
  createdAt: string | null;
  videoRoomUrl: string | null;
};

export type ProviderAppointmentsPageStats = {
  thisWeek: number;
  completionRate: number;
  avgPerDay: number;
  nextAvailable: string | null;
};

export type ProviderAppointmentsPageData = {
  appointments: ProviderAppointmentsPageAppointment[];
  stats: ProviderAppointmentsPageStats;
  availabilityByAppointmentId: Record<string, GeneratedDateSlots[]>;
};

type AppointmentRow = {
  id: string;
  patient_id: string | null;
  scheduled_at: string;
  duration_minutes: number | null;
  type: string | null;
  status: string | null;
  chief_complaint: string | null;
  notes: string | null;
  cancellation_reason: string | null;
  created_at: string | null;
  video_room_url: string | null;
};

type BookedAppointmentRow = {
  id: string;
  scheduled_at: string;
  duration_minutes: number | null;
  status: string | null;
};

function normalizeAppointmentRow(row: Record<string, unknown>): AppointmentRow {
  return {
    id: typeof row.id === "string" ? row.id : "",
    patient_id: typeof row.patient_id === "string" ? row.patient_id : null,
    scheduled_at: typeof row.scheduled_at === "string" ? row.scheduled_at : new Date().toISOString(),
    duration_minutes: typeof row.duration_minutes === "number" ? row.duration_minutes : null,
    type: typeof row.type === "string" ? row.type : null,
    status: typeof row.status === "string" ? row.status : null,
    chief_complaint: typeof row.chief_complaint === "string" ? row.chief_complaint : null,
    notes: typeof row.notes === "string" ? row.notes : null,
    cancellation_reason: typeof row.cancellation_reason === "string" ? row.cancellation_reason : null,
    created_at: typeof row.created_at === "string" ? row.created_at : null,
    video_room_url: typeof row.video_room_url === "string" ? row.video_room_url : null,
  };
}

function normalizeBookedAppointmentRow(row: Record<string, unknown>): BookedAppointmentRow {
  return {
    id: typeof row.id === "string" ? row.id : "",
    scheduled_at: typeof row.scheduled_at === "string" ? row.scheduled_at : new Date().toISOString(),
    duration_minutes: typeof row.duration_minutes === "number" ? row.duration_minutes : null,
    status: typeof row.status === "string" ? row.status : null,
  };
}

async function getCurrentProviderId() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Authenticated provider required.");
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("providers")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.id) {
    throw new Error("Provider record not found.");
  }

  return data.id as string;
}

function countBusinessDaysInMonthToDate(now: Date) {
  const monthStart = startOfMonth(now);
  let count = 0;
  const cursor = new Date(monthStart);

  while (cursor <= now) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      count += 1;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return Math.max(count, 1);
}

function coerceAppointmentType(value: string | null): ProviderAppointmentsPageAppointment["type"] {
  if (value === "messaging" || value === "async_review") {
    return value;
  }

  return "video";
}

function coerceAppointmentStatus(value: string | null): ProviderAppointmentsPageAppointment["status"] {
  if (value === "in_progress" || value === "completed" || value === "cancelled" || value === "no_show") {
    return value;
  }

  return "scheduled";
}

export async function getProviderAppointmentsPageData(): Promise<ProviderAppointmentsPageData> {
  const providerId = await getCurrentProviderId();
  const admin = getSupabaseAdminClient();
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const availabilityWindowStart = startOfDay(now).toISOString();
  const availabilityWindowEnd = endOfDay(addDays(now, 13)).toISOString();

  const [appointmentsResult, availabilityResult, bookedAppointmentsResult] = await Promise.all([
    admin
      .from("appointments")
      .select("id, patient_id, scheduled_at, duration_minutes, type, status, chief_complaint, notes, cancellation_reason, created_at, video_room_url")
      .eq("provider_id", providerId)
      .order("scheduled_at", { ascending: true }),
    admin
      .from("provider_availability")
      .select("id, day_of_week, start_time, end_time")
      .eq("provider_id", providerId),
    admin
      .from("appointments")
      .select("id, scheduled_at, duration_minutes, status")
      .eq("provider_id", providerId)
      .neq("status", "cancelled")
      .gte("scheduled_at", availabilityWindowStart)
      .lte("scheduled_at", availabilityWindowEnd),
  ]);

  if (appointmentsResult.error) {
    throw new Error(appointmentsResult.error.message);
  }

  if (availabilityResult.error) {
    throw new Error(availabilityResult.error.message);
  }

  if (bookedAppointmentsResult.error) {
    throw new Error(bookedAppointmentsResult.error.message);
  }

  const appointments = ((appointmentsResult.data ?? []) as unknown as Record<string, unknown>[]).map(normalizeAppointmentRow);
  const patientIds = Array.from(new Set(appointments.map((appointment) => appointment.patient_id).filter((value): value is string => Boolean(value))));
  const patientProfilesResult = patientIds.length
    ? await admin.from("profiles").select("id, full_name, avatar_url").in("id", patientIds)
    : { data: [], error: null };

  if (patientProfilesResult.error) {
    throw new Error(patientProfilesResult.error.message);
  }

  const patientMap = new Map((patientProfilesResult.data ?? []).map((profile) => [
    profile.id,
    {
      name: profile.full_name ?? "Patient",
      avatarUrl: profile.avatar_url ?? null,
    },
  ]));

  const rows: ProviderAppointmentsPageAppointment[] = appointments.map((appointment) => ({
    id: appointment.id,
    patientId: appointment.patient_id ?? "",
    patientName: appointment.patient_id ? patientMap.get(appointment.patient_id)?.name ?? "Patient" : "Patient",
    patientAvatarUrl: appointment.patient_id ? patientMap.get(appointment.patient_id)?.avatarUrl ?? null : null,
    scheduledAt: appointment.scheduled_at,
    durationMinutes: appointment.duration_minutes ?? 30,
    type: coerceAppointmentType(appointment.type),
    status: coerceAppointmentStatus(appointment.status),
    chiefComplaint: appointment.chief_complaint ?? "General follow-up",
    notes: appointment.notes ?? "",
    cancellationReason: appointment.cancellation_reason ?? null,
    createdAt: appointment.created_at ?? null,
    videoRoomUrl: appointment.video_room_url ?? null,
  }));

  const thisWeek = rows.filter((appointment) => {
    const scheduledAt = new Date(appointment.scheduledAt);
    return appointment.status === "scheduled" && scheduledAt >= weekStart && scheduledAt <= weekEnd;
  }).length;

  const completedCount = rows.filter((appointment) => appointment.status === "completed").length;
  const noShowCount = rows.filter((appointment) => appointment.status === "no_show").length;
  const completionRate = completedCount + noShowCount ? Math.round((completedCount / (completedCount + noShowCount)) * 100) : 0;
  const monthlyCount = rows.filter((appointment) => new Date(appointment.scheduledAt) >= monthStart).length;
  const avgPerDay = Math.max(0, Math.round((monthlyCount / countBusinessDaysInMonthToDate(now)) * 10) / 10);

  const availabilityRows = (availabilityResult.data ?? []) as AvailabilityRow[];
  const bookedRows = ((bookedAppointmentsResult.data ?? []) as unknown as Record<string, unknown>[]).map(normalizeBookedAppointmentRow);
  const baseAvailability = buildAvailabilityByDate(availabilityRows, bookedRows, 14);
  const nextAvailable = findNextAvailableSlot(baseAvailability);

  const availabilityByAppointmentId = Object.fromEntries(
    rows
      .filter((appointment) => appointment.status === "scheduled" && new Date(appointment.scheduledAt) >= now)
      .map((appointment) => [
        appointment.id,
        buildAvailabilityByDate(
          availabilityRows,
          bookedRows.filter((row) => row.id !== appointment.id),
          14,
        ),
      ]),
  );

  return {
    appointments: rows,
    stats: {
      thisWeek,
      completionRate,
      avgPerDay,
      nextAvailable,
    },
    availabilityByAppointmentId,
  };
}
