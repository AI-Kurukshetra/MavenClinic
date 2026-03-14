import { addDays, addMinutes, isBefore, startOfDay } from "date-fns";
import { z } from "zod";
import type { ProviderSpecialty } from "@/types/domain";

export const appointmentSpecialties = [
  { key: "ob_gyn", label: "OB/GYN" },
  { key: "fertility", label: "Fertility" },
  { key: "mental_health", label: "Mental Health" },
  { key: "nutrition", label: "Nutrition" },
  { key: "menopause", label: "Menopause" },
  { key: "lactation", label: "Lactation" },
  { key: "general", label: "General" },
] as const satisfies ReadonlyArray<{ key: ProviderSpecialty | "general"; label: string }>;

export const specialtyKeys = appointmentSpecialties.map((item) => item.key) as [
  (typeof appointmentSpecialties)[number]["key"],
  ...(typeof appointmentSpecialties)[number]["key"][],
];

export const bookingStepOneSchema = z.object({
  specialty: z.enum(specialtyKeys, { error: "Choose a specialty to continue." }),
});

export const bookingStepTwoSchema = z.object({
  providerId: z.uuid({ error: "Choose a provider to continue." }),
});

export const bookingStepThreeSchema = z.object({
  scheduledAt: z.iso.datetime({ error: "Choose a time slot to continue." }),
});

export const bookingConfirmationSchema = z.object({
  chiefComplaint: z.string().trim().min(10, "Tell your care team a bit more before booking."),
  paymentMethod: z.enum(["insurance", "direct_pay"], { error: "Choose how you want to pay." }),
});

export const bookAppointmentSchema = bookingStepOneSchema
  .merge(bookingStepTwoSchema)
  .merge(bookingStepThreeSchema)
  .merge(bookingConfirmationSchema);

export const rescheduleAppointmentSchema = z.object({
  scheduledAt: z.iso.datetime({ error: "Choose a new time slot." }),
});

export const cancelReasons = [
  "schedule_conflict",
  "found_another_time",
  "symptoms_resolved",
  "insurance_issue",
  "other",
] as const;

export const cancelAppointmentSchema = z.object({
  reason: z.enum(cancelReasons, { error: "Choose a cancellation reason." }),
});

export const consultationNotesSchema = z.object({
  notes: z.string().trim().max(4000, "Keep notes under 4,000 characters."),
});

export const appointmentMutationSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("reschedule"), scheduledAt: z.iso.datetime() }),
  z.object({ action: z.literal("cancel"), reason: z.enum(cancelReasons) }),
  z.object({ action: z.literal("start") }),
  z.object({ action: z.literal("complete") }),
  z.object({ action: z.literal("save_notes"), notes: consultationNotesSchema.shape.notes }),
]);

export type BookingValues = z.infer<typeof bookAppointmentSchema>;
export type RescheduleValues = z.infer<typeof rescheduleAppointmentSchema>;
export type CancelValues = z.infer<typeof cancelAppointmentSchema>;
export type ConsultationNotesValues = z.infer<typeof consultationNotesSchema>;
export type AppointmentMutationValues = z.infer<typeof appointmentMutationSchema>;

export type AvailabilityRow = {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  location: string | null;
};

export type BookedAppointmentRow = {
  id: string;
  scheduled_at: string;
  duration_minutes: number | null;
  status: string | null;
};

export type GeneratedSlot = {
  startsAt: string;
  label: string;
};

export type GeneratedDateSlots = {
  date: string;
  label: string;
  dayLabel: string;
  slots: GeneratedSlot[];
};

const dayIndexMap: Record<string, number> = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  tues: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  thurs: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
};

function parseTime(value: string) {
  const [hoursValue, minutesValue] = value.split(":");
  return {
    hours: Number.parseInt(hoursValue ?? "0", 10),
    minutes: Number.parseInt(minutesValue ?? "0", 10),
  };
}

function formatDayLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
}

function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

function formatTimeLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
}

export function getSpecialtyLabel(value: string) {
  return appointmentSpecialties.find((item) => item.key === value)?.label ?? titleCase(value);
}

export function titleCase(value: string) {
  return value
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function isJoinWindow(scheduledAt: string, status: string) {
  if (status === "in_progress") {
    return true;
  }

  const scheduledTime = new Date(scheduledAt).getTime();
  const now = Date.now();
  const tenMinutes = 10 * 60 * 1000;

  return scheduledTime - now <= tenMinutes && scheduledTime - now >= -60 * 60 * 1000;
}

export function buildAvailabilityByDate(
  availability: AvailabilityRow[],
  bookedAppointments: BookedAppointmentRow[],
  days = 14,
) {
  const today = startOfDay(new Date());
  const now = new Date();
  const bookedTimes = new Set(
    bookedAppointments
      .filter((appointment) => appointment.status !== "cancelled")
      .map((appointment) => new Date(appointment.scheduled_at).getTime()),
  );

  const dates: GeneratedDateSlots[] = [];

  for (let offset = 0; offset < days; offset += 1) {
    const day = addDays(today, offset);
    const matchingWindows = availability.filter((slot) => dayIndexMap[slot.day_of_week.toLowerCase()] === day.getDay());

    const slots: GeneratedSlot[] = [];

    for (const window of matchingWindows) {
      const startParts = parseTime(window.start_time);
      const endParts = parseTime(window.end_time);
      let pointer = new Date(day);
      pointer.setHours(startParts.hours, startParts.minutes, 0, 0);

      const windowEnd = new Date(day);
      windowEnd.setHours(endParts.hours, endParts.minutes, 0, 0);

      while (isBefore(addMinutes(pointer, 29), windowEnd)) {
        const slotTime = pointer.getTime();
        const slotDate = new Date(pointer);

        if (!bookedTimes.has(slotTime) && !isBefore(slotDate, now)) {
          slots.push({
            startsAt: slotDate.toISOString(),
            label: formatTimeLabel(slotDate),
          });
        }

        pointer = addMinutes(pointer, 30);
      }
    }

    dates.push({
      date: day.toISOString().slice(0, 10),
      label: formatDateLabel(day),
      dayLabel: formatDayLabel(day),
      slots,
    });
  }

  return dates;
}

export function findNextAvailableSlot(dates: GeneratedDateSlots[]) {
  for (const date of dates) {
    if (date.slots[0]) {
      return date.slots[0].startsAt;
    }
  }

  return null;
}

export function inferTimezoneLabel() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}