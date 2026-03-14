"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Brain,
  CalendarClock,
  CheckCircle2,
  HeartPulse,
  Leaf,
  Milk,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { AppointmentCard } from "@/components/ui/appointment-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Toast } from "@/components/ui/Toast";
import { ProviderCard } from "@/components/ui/provider-card";
import {
  bookingConfirmationSchema,
  bookingStepOneSchema,
  bookingStepThreeSchema,
  bookingStepTwoSchema,
  cancelAppointmentSchema,
  cancelReasons,
  inferTimezoneLabel,
  isJoinWindow,
  rescheduleAppointmentSchema,
} from "@/lib/appointments";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn, formatDateTime } from "@/lib/utils";
import type { AppointmentsPageData, BookingProvider, UpcomingAppointment } from "@/lib/appointments-data";

const specialtyIcons = {
  ob_gyn: HeartPulse,
  fertility: Sparkles,
  mental_health: Brain,
  nutrition: Leaf,
  menopause: Activity,
  lactation: Milk,
  general: Stethoscope,
} as const;

const specialtyOptions = [
  { key: "ob_gyn", label: "OB/GYN" },
  { key: "fertility", label: "Fertility" },
  { key: "mental_health", label: "Mental Health" },
  { key: "nutrition", label: "Nutrition" },
  { key: "menopause", label: "Menopause" },
  { key: "lactation", label: "Lactation" },
  { key: "general", label: "General" },
] as const;

const toastMessages: Record<string, string> = {
  "appointment-booked": "Appointment booked successfully.",
  "appointment-rescheduled": "Appointment rescheduled.",
  "appointment-cancelled": "Appointment cancelled.",
};

const cancelReasonLabels: Record<(typeof cancelReasons)[number], string> = {
  schedule_conflict: "Schedule conflict",
  found_another_time: "Found another time",
  symptoms_resolved: "Symptoms resolved",
  insurance_issue: "Insurance issue",
  other: "Other",
};

type Props = AppointmentsPageData & {
  initialToast?: string | null;
};

function getDefaultProvider(providers: BookingProvider[]) {
  return providers[0] ?? null;
}

function getDefaultDate(provider: BookingProvider | null) {
  return provider?.availability.find((date) => date.slots.length > 0)?.date ?? provider?.availability[0]?.date ?? "";
}

function getDefaultSlot(provider: BookingProvider | null, date: string, excludedSlot?: string) {
  const day = provider?.availability.find((item) => item.date === date);
  return day?.slots.find((slot) => slot.startsAt !== excludedSlot)?.startsAt ?? day?.slots[0]?.startsAt ?? "";
}

type ToastState = {
  message: string;
  variant: "success" | "error" | "info";
};

function BookingStepSkeleton() {
  return (
    <Card className="space-y-4 animate-pulse">
      <div className="h-8 w-56 rounded-full bg-[var(--slate-100)]" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-[24px] border border-[var(--border)] bg-[var(--slate-50)] p-5">
            <div className="h-6 w-6 rounded-full bg-[var(--slate-100)]" />
            <div className="mt-4 h-4 w-24 rounded-full bg-[var(--slate-100)]" />
            <div className="mt-3 h-3 w-full rounded-full bg-[var(--slate-100)]" />
            <div className="mt-2 h-3 w-4/5 rounded-full bg-[var(--slate-100)]" />
          </div>
        ))}
      </div>
    </Card>
  );
}

function ProviderCardsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-52 animate-pulse rounded-full bg-[var(--slate-100)]" />
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} className="animate-pulse p-5">
          <div className="flex gap-4">
            <div className="h-14 w-14 rounded-full bg-[var(--slate-100)]" />
            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="h-5 w-36 rounded-full bg-[var(--slate-100)]" />
                  <div className="h-4 w-24 rounded-full bg-[var(--slate-100)]" />
                </div>
                <div className="space-y-2 text-right">
                  <div className="ml-auto h-5 w-16 rounded-full bg-[var(--slate-100)]" />
                  <div className="ml-auto h-4 w-20 rounded-full bg-[var(--slate-100)]" />
                </div>
              </div>
              <div className="h-3 w-full rounded-full bg-[var(--slate-100)]" />
              <div className="h-3 w-5/6 rounded-full bg-[var(--slate-100)]" />
              <div className="flex gap-2">
                <div className="h-7 w-16 rounded-full bg-[var(--slate-100)]" />
                <div className="h-7 w-16 rounded-full bg-[var(--slate-100)]" />
              </div>
              <div className="h-9 w-32 rounded-full bg-[var(--slate-100)]" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function TimeSlotsSkeleton() {
  return (
    <Card className="space-y-4 animate-pulse">
      <div className="h-8 w-52 rounded-full bg-[var(--slate-100)]" />
      <div className="rounded-[24px] bg-[var(--slate-50)] p-4">
        <div className="h-5 w-32 rounded-full bg-[var(--slate-100)]" />
        <div className="mt-3 h-4 w-48 rounded-full bg-[var(--slate-100)]" />
      </div>
      <div className="flex gap-3 overflow-hidden pb-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="min-w-28 rounded-[24px] border border-[var(--border)] bg-[var(--slate-50)] px-4 py-4">
            <div className="h-4 w-12 rounded-full bg-[var(--slate-100)]" />
            <div className="mt-3 h-3 w-16 rounded-full bg-[var(--slate-100)]" />
          </div>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-11 rounded-full bg-[var(--slate-100)]" />
        ))}
      </div>
    </Card>
  );
}

function ConfirmationSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
      <Card className="space-y-4 animate-pulse">
        <div className="h-8 w-44 rounded-full bg-[var(--slate-100)]" />
        <div className="h-28 rounded-[24px] bg-[var(--slate-50)]" />
        <div className="h-32 rounded-[24px] bg-[var(--slate-50)]" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="h-16 rounded-[24px] bg-[var(--slate-50)]" />
          <div className="h-16 rounded-[24px] bg-[var(--slate-50)]" />
        </div>
      </Card>
      <Card className="space-y-4 animate-pulse">
        <div className="h-8 w-40 rounded-full bg-[var(--slate-100)]" />
        <div className="space-y-3 rounded-[24px] bg-[var(--slate-50)] p-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-5 rounded-full bg-[var(--slate-100)]" />
          ))}
        </div>
      </Card>
    </div>
  );
}

export function AppointmentsView({ currentUserId, upcomingAppointments, bookingProviders, initialToast }: Props) {
  const router = useRouter();
  const initialProviders = bookingProviders.filter((provider) => provider.specialty === "ob_gyn");
  const initialProvider = getDefaultProvider(initialProviders);
  const initialDate = getDefaultDate(initialProvider);
  const initialSlot = getDefaultSlot(initialProvider, initialDate);

  const [tab, setTab] = useState<"upcoming" | "book">("upcoming");
  const [step, setStep] = useState(1);
  const [loadingStep, setLoadingStep] = useState<number | null>(null);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState<(typeof specialtyOptions)[number]["key"]>("ob_gyn");
  const [selectedProviderId, setSelectedProviderId] = useState(initialProvider?.id ?? "");
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedSlot, setSelectedSlot] = useState(initialSlot);
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"insurance" | "direct_pay">("insurance");
  const [error, setError] = useState("");
  const [timezoneLabel, setTimezoneLabel] = useState("your local timezone");
  const [toast, setToast] = useState<ToastState | null>(() => {
    if (!initialToast) {
      return null;
    }

    return {
      message: toastMessages[initialToast] ?? initialToast,
      variant: "success",
    };
  });
  const [rescheduleAppointment, setRescheduleAppointment] = useState<UpcomingAppointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlot, setRescheduleSlot] = useState("");
  const [cancelAppointment, setCancelAppointment] = useState<UpcomingAppointment | null>(null);
  const [cancelReason, setCancelReason] = useState<(typeof cancelReasons)[number]>("schedule_conflict");
  const [pendingAction, startTransition] = useTransition();
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const filteredProviders = bookingProviders.filter((provider) => provider.specialty === selectedSpecialty);
  const selectedProvider = filteredProviders.find((provider) => provider.id === selectedProviderId) ?? filteredProviders[0] ?? null;
  const selectedProviderDates = selectedProvider?.availability ?? [];
  const activeDate = selectedProviderDates.find((date) => date.date === selectedDate) ?? selectedProviderDates.find((date) => date.slots.length > 0) ?? selectedProviderDates[0] ?? null;
  const rescheduleProvider = rescheduleAppointment ? bookingProviders.find((provider) => provider.id === rescheduleAppointment.providerId) ?? null : null;
  const rescheduleDates = rescheduleProvider?.availability ?? [];
  const activeRescheduleDate = rescheduleDates.find((date) => date.date === rescheduleDate) ?? rescheduleDates.find((date) => date.slots.length > 0) ?? rescheduleDates[0] ?? null;
  const visibleStep = loadingStep ?? step;

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setTimezoneLabel(inferTimezoneLabel());
    }, 0);

    return () => {
      window.clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel(`appointments-${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `patient_id=eq.${currentUserId}`,
        },
        () => {
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [currentUserId, router]);

  function withTransientLoading(setter: (value: boolean) => void, callback: () => void) {
    setter(true);
    callback();
    window.setTimeout(() => setter(false), 300);
  }

  function transitionToStep(nextStep: number) {
    setError("");
    setLoadingStep(nextStep);
    window.setTimeout(() => {
      setStep(nextStep);
      setLoadingStep(null);
    }, 280);
  }

  function chooseSpecialty(specialty: (typeof specialtyOptions)[number]["key"]) {
    withTransientLoading(setProvidersLoading, () => {
      setSelectedSpecialty(specialty);
      const providers = bookingProviders.filter((provider) => provider.specialty === specialty);
      const nextProvider = getDefaultProvider(providers);
      const nextDate = getDefaultDate(nextProvider);
      setSelectedProviderId(nextProvider?.id ?? "");
      setSelectedDate(nextDate);
      setSelectedSlot(getDefaultSlot(nextProvider, nextDate));
      setError("");
    });
  }

  function chooseProvider(provider: BookingProvider) {
    withTransientLoading(setSlotsLoading, () => {
      const nextDate = getDefaultDate(provider);
      setSelectedProviderId(provider.id);
      setSelectedDate(nextDate);
      setSelectedSlot(getDefaultSlot(provider, nextDate));
      setError("");
    });
  }

  function chooseDate(date: string) {
    withTransientLoading(setSlotsLoading, () => {
      setSelectedDate(date);
      setSelectedSlot(getDefaultSlot(selectedProvider, date));
      setError("");
    });
  }

  function openReschedule(appointment: UpcomingAppointment) {
    withTransientLoading(setSlotsLoading, () => {
      const provider = bookingProviders.find((item) => item.id === appointment.providerId) ?? null;
      const nextDate = getDefaultDate(provider);
      setRescheduleAppointment(appointment);
      setRescheduleDate(nextDate);
      setRescheduleSlot(getDefaultSlot(provider, nextDate, appointment.scheduledAt));
      setError("");
    });
  }

  function chooseRescheduleDate(date: string) {
    withTransientLoading(setSlotsLoading, () => {
      setRescheduleDate(date);
      setRescheduleSlot(getDefaultSlot(rescheduleProvider, date, rescheduleAppointment?.scheduledAt));
      setError("");
    });
  }

  function goToStep(nextStep: number) {
    setError("");

    if (nextStep === 2) {
      const parsed = bookingStepOneSchema.safeParse({ specialty: selectedSpecialty });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "Choose a specialty to continue.");
        return;
      }
    }

    if (nextStep === 3) {
      const parsed = bookingStepTwoSchema.safeParse({ providerId: selectedProviderId });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "Choose a provider to continue.");
        return;
      }
    }

    if (nextStep === 4) {
      const parsed = bookingStepThreeSchema.safeParse({ scheduledAt: selectedSlot });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "Choose a time slot to continue.");
        return;
      }
    }

    transitionToStep(nextStep);
  }

  function submitBooking() {
    const parsed = bookingConfirmationSchema.safeParse({ chiefComplaint, paymentMethod });
    if (!parsed.success || !selectedProviderId || !selectedSlot) {
      setError(parsed.success ? "Choose a provider and time slot before booking." : parsed.error.issues[0]?.message ?? "Complete the booking form.");
      return;
    }

    setError("");
    setBookingSuccess(false);
    startTransition(async () => {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          specialty: selectedSpecialty,
          providerId: selectedProviderId,
          scheduledAt: selectedSlot,
          chiefComplaint: parsed.data.chiefComplaint,
          paymentMethod: parsed.data.paymentMethod,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setToast({ message: data.error ?? "Unable to book appointment.", variant: "error" });
        return;
      }

      if (data.newAppointment?.id) {
        void fetch("/api/consultations/create-room", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appointmentId: data.newAppointment.id }),
          keepalive: true,
        }).catch(() => undefined);
      }

      setBookingSuccess(true);
      await new Promise((resolve) => window.setTimeout(resolve, 1500));
      router.push(data.redirectTo ?? "/appointments?toast=appointment-booked");
      router.refresh();
    });
  }

  function submitReschedule() {
    if (!rescheduleAppointment) {
      return;
    }

    const parsed = rescheduleAppointmentSchema.safeParse({ scheduledAt: rescheduleSlot });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Choose a new slot.");
      return;
    }

    setError("");
    startTransition(async () => {
      const response = await fetch(`/api/appointments/${rescheduleAppointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reschedule", scheduledAt: parsed.data.scheduledAt }),
      });

      const data = await response.json();
      if (!response.ok) {
        setToast({ message: data.error ?? "Unable to reschedule appointment.", variant: "error" });
        return;
      }

      setRescheduleAppointment(null);
      router.push(`/appointments?toast=${data.toast ?? "appointment-rescheduled"}`);
      router.refresh();
    });
  }

  function submitCancellation() {
    if (!cancelAppointment) {
      return;
    }

    const parsed = cancelAppointmentSchema.safeParse({ reason: cancelReason });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Choose a reason.");
      return;
    }

    setError("");
    startTransition(async () => {
      const response = await fetch(`/api/appointments/${cancelAppointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", reason: parsed.data.reason }),
      });

      const data = await response.json();
      if (!response.ok) {
        setToast({ message: data.error ?? "Unable to cancel appointment.", variant: "error" });
        return;
      }

      setCancelAppointment(null);
      router.push(`/appointments?toast=${data.toast ?? "appointment-cancelled"}`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {toast ? <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} /> : null}

      <div className="inline-flex rounded-full border border-[var(--border)] bg-white p-1">
        {(["upcoming", "book"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setTab(value);
              setError("");
            }}
            className={cn(
              "rounded-full px-5 py-2 text-sm font-medium transition",
              tab === value ? "bg-[var(--rose-500)] text-white" : "text-[var(--foreground-muted)]",
            )}
          >
            {value === "upcoming" ? "Upcoming appointments" : "Book new appointment"}
          </button>
        ))}
      </div>

      {tab === "upcoming" ? (
        <div className="space-y-4">
          {upcomingAppointments.length ? (
            upcomingAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                canJoin={isJoinWindow(appointment.scheduledAt, appointment.status)}
                joinHref={`/consultations/${appointment.id}`}
                onReschedule={appointment.status === "scheduled" ? () => openReschedule(appointment) : undefined}
                onCancel={appointment.status === "scheduled" ? () => setCancelAppointment(appointment) : undefined}
              />
            ))
          ) : (
            <Card className="space-y-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--rose-50)] text-[var(--rose-700)]">
                <CalendarClock className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold">No upcoming appointments</h2>
                <p className="text-sm text-[var(--foreground-muted)]">Book your next visit to see confirmations, join links, and schedule changes here.</p>
              </div>
              <div className="flex justify-center">
                <Button type="button" onClick={() => setTab("book")}>Book now</Button>
              </div>
            </Card>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--foreground-muted)]">
            {[1, 2, 3, 4].map((value) => (
              <div key={value} className={cn("inline-flex items-center gap-2 rounded-full px-4 py-2", value === visibleStep ? "bg-[var(--rose-50)] text-[var(--rose-700)]" : "bg-white")}>Step {value}</div>
            ))}
          </div>

          {visibleStep === 1 ? (
            loadingStep === 1 ? (
              <BookingStepSkeleton />
            ) : (
              <Card className="space-y-4">
                <h2 className="text-2xl font-semibold">Choose a specialty</h2>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {specialtyOptions.map((specialty) => {
                    const Icon = specialtyIcons[specialty.key];
                    return (
                      <button
                        key={specialty.key}
                        type="button"
                        onClick={() => chooseSpecialty(specialty.key)}
                        className={cn(
                          "rounded-[24px] border px-4 py-5 text-left transition",
                          specialty.key === selectedSpecialty ? "border-transparent bg-[var(--rose-50)] ring-2 ring-[rgba(232,125,155,0.35)]" : "border-[var(--border)] bg-white",
                        )}
                      >
                        <Icon className="h-6 w-6 text-[var(--rose-700)]" />
                        <p className="mt-4 font-semibold">{specialty.label}</p>
                        <p className="mt-1 text-sm text-[var(--foreground-muted)]">See specialists with live telehealth availability.</p>
                      </button>
                    );
                  })}
                </div>
              </Card>
            )
          ) : null}

          {visibleStep === 2 ? (
            loadingStep === 2 || providersLoading ? (
              <ProviderCardsSkeleton />
            ) : (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">Choose a provider</h2>
                {filteredProviders.length ? (
                  filteredProviders.map((provider) => (
                    <ProviderCard
                      key={provider.id}
                      provider={provider}
                      selected={provider.id === selectedProviderId}
                      ctaLabel={provider.id === selectedProviderId ? "Selected" : "Select provider"}
                      onAction={() => chooseProvider(provider)}
                    />
                  ))
                ) : (
                  <Card className="space-y-3 text-center">
                    <h3 className="text-xl font-semibold">No providers available</h3>
                    <p className="text-sm text-[var(--foreground-muted)]">There are no providers in this specialty accepting new patients right now. Try another specialty.</p>
                  </Card>
                )}
              </div>
            )
          ) : null}

          {visibleStep === 3 ? (
            loadingStep === 3 || slotsLoading ? (
              <TimeSlotsSkeleton />
            ) : (
              <Card className="space-y-4">
                <h2 className="text-2xl font-semibold">Choose a time slot</h2>
                {selectedProvider ? (
                  <div className="rounded-[24px] bg-[var(--slate-50)] p-4">
                    <p className="font-semibold">{selectedProvider.fullName}</p>
                    <p className="text-sm text-[var(--foreground-muted)]">{selectedProvider.specialtyLabel}</p>
                    <p className="mt-2 text-sm text-[var(--foreground-muted)]">Slots shown in {timezoneLabel}</p>
                  </div>
                ) : null}
                {selectedProviderDates.length ? (
                  <>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {selectedProviderDates.map((date) => (
                        <button
                          key={date.date}
                          type="button"
                          onClick={() => chooseDate(date.date)}
                          className={cn(
                            "min-w-28 rounded-[24px] border px-4 py-4 text-left transition",
                            selectedDate === date.date ? "border-transparent bg-[var(--rose-50)] ring-2 ring-[rgba(232,125,155,0.35)]" : "border-[var(--border)] bg-white",
                          )}
                        >
                          <p className="font-semibold">{date.dayLabel}</p>
                          <p className="text-sm text-[var(--foreground-muted)]">{date.label}</p>
                        </button>
                      ))}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {activeDate?.slots.length ? activeDate.slots.map((slot) => (
                        <button
                          key={slot.startsAt}
                          type="button"
                          onClick={() => setSelectedSlot(slot.startsAt)}
                          className={cn(
                            "rounded-full border px-4 py-3 text-sm font-medium transition",
                            selectedSlot === slot.startsAt ? "border-transparent bg-[var(--rose-500)] text-white" : "border-[var(--border)] bg-white text-[var(--foreground)]",
                          )}
                        >
                          {slot.label}
                        </button>
                      )) : <p className="text-sm text-[var(--foreground-muted)]">No open slots on this day. Try another date.</p>}
                    </div>
                  </>
                ) : (
                  <Card className="border-dashed text-center text-sm text-[var(--foreground-muted)]">No available slots in the next 14 days.</Card>
                )}
              </Card>
            )
          ) : null}

          {visibleStep === 4 ? (
            loadingStep === 4 ? (
              <ConfirmationSkeleton />
            ) : bookingSuccess ? (
              <Card className="space-y-4 border-[rgba(46,168,152,0.22)] bg-[rgba(61,191,173,0.12)] text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(61,191,173,0.18)] text-[var(--teal-700)]">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold text-[var(--foreground)]">Appointment booked!</h2>
                  <p className="text-sm text-[var(--foreground-muted)]">Your visit is confirmed. Redirecting to your appointments now.</p>
                </div>
              </Card>
            ) : (
              <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
                <Card className="space-y-4">
                  <h2 className="text-2xl font-semibold">Confirm booking</h2>
                  <div className="rounded-[24px] bg-[var(--slate-50)] p-4 text-sm text-[var(--foreground-muted)]">
                    <p className="font-semibold text-[var(--foreground)]">{selectedProvider?.fullName}</p>
                    <p>{selectedProvider?.specialtyLabel}</p>
                    <p className="mt-2">{selectedSlot ? formatDateTime(selectedSlot) : "Choose a slot"} - 30 min</p>
                    <p className="mt-1">Slots shown in {timezoneLabel}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Chief complaint</label>
                    <textarea
                      value={chiefComplaint}
                      onChange={(event) => setChiefComplaint(event.target.value)}
                      className="min-h-32 w-full rounded-[24px] border border-[var(--border)] px-4 py-3"
                      placeholder="Tell your care team what you want to discuss."
                    />
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm font-medium">How would you like to pay?</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {([
                        { key: "insurance", label: "Insurance" },
                        { key: "direct_pay", label: "Direct pay" },
                      ] as const).map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => setPaymentMethod(option.key)}
                          className={cn(
                            "rounded-[24px] border px-4 py-4 text-left transition",
                            paymentMethod === option.key ? "border-transparent bg-[var(--teal-50)] ring-2 ring-[rgba(46,168,152,0.25)]" : "border-[var(--border)] bg-white",
                          )}
                        >
                          <p className="font-semibold">{option.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </Card>
                <Card className="space-y-4">
                  <h3 className="text-2xl font-semibold">Visit summary</h3>
                  <div className="space-y-3 rounded-[24px] bg-[var(--slate-50)] p-4 text-sm text-[var(--foreground-muted)]">
                    <div className="flex justify-between gap-4"><span>Provider</span><span className="font-medium text-[var(--foreground)]">{selectedProvider?.fullName ?? "-"}</span></div>
                    <div className="flex justify-between gap-4"><span>Specialty</span><span className="font-medium text-[var(--foreground)]">{selectedProvider?.specialtyLabel ?? "-"}</span></div>
                    <div className="flex justify-between gap-4"><span>Date & time</span><span className="font-medium text-[var(--foreground)]">{selectedSlot ? formatDateTime(selectedSlot) : "-"}</span></div>
                    <div className="flex justify-between gap-4"><span>Duration</span><span className="font-medium text-[var(--foreground)]">30 min</span></div>
                    <div className="flex justify-between gap-4"><span>Fee</span><span className="font-medium text-[var(--foreground)]">{selectedProvider ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(selectedProvider.consultationFeeCents / 100) : "-"}</span></div>
                  </div>
                </Card>
              </div>
            )
          ) : null}

          {error ? <div className="rounded-[24px] border border-[rgba(212,88,123,0.18)] bg-[rgba(212,88,123,0.08)] px-4 py-3 text-sm text-[var(--rose-700)]">{error}</div> : null}

          <div className="flex flex-wrap justify-between gap-3">
            <Button type="button" variant="secondary" onClick={() => {
              if (step > 1) {
                transitionToStep(step - 1);
                return;
              }

              setTab("upcoming");
            }}>
              {step > 1 ? "Back" : "See upcoming"}
            </Button>
            {step < 4 ? (
              <Button type="button" onClick={() => goToStep(step + 1)}>Continue</Button>
            ) : (
              <Button type="button" onClick={submitBooking} disabled={pendingAction}>{pendingAction ? "Booking..." : "Confirm & Book"}</Button>
            )}
          </div>
        </div>
      )}

      {rescheduleAppointment && rescheduleProvider ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(15,23,42,0.45)] p-4">
          <Card className="max-h-[90vh] w-full max-w-3xl overflow-auto space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Reschedule appointment</h2>
                <p className="text-sm text-[var(--foreground-muted)]">Pick a new slot in {timezoneLabel}.</p>
              </div>
              <Button type="button" variant="ghost" onClick={() => setRescheduleAppointment(null)}>Close</Button>
            </div>
            <div className="rounded-[24px] bg-[var(--slate-50)] p-4">
              <div className="flex items-start gap-4">
                <Avatar src={rescheduleAppointment.providerAvatarUrl} name={rescheduleAppointment.providerName} size="lg" />
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-semibold text-[var(--foreground)]">{rescheduleAppointment.providerName}</p>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--foreground-muted)]">{rescheduleAppointment.providerSpecialty}</span>
                  </div>
                  <p className="text-sm text-[var(--foreground-muted)]">Current time: {formatDateTime(rescheduleAppointment.scheduledAt)}</p>
                  <p className="text-sm leading-6 text-[var(--foreground)]">{rescheduleAppointment.chiefComplaint}</p>
                </div>
              </div>
            </div>
            {slotsLoading ? (
              <TimeSlotsSkeleton />
            ) : (
              <>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {rescheduleDates.map((date) => (
                    <button
                      key={date.date}
                      type="button"
                      onClick={() => chooseRescheduleDate(date.date)}
                      className={cn(
                        "min-w-28 rounded-[24px] border px-4 py-4 text-left transition",
                        rescheduleDate === date.date ? "border-transparent bg-[var(--rose-50)] ring-2 ring-[rgba(232,125,155,0.35)]" : "border-[var(--border)] bg-white",
                      )}
                    >
                      <p className="font-semibold">{date.dayLabel}</p>
                      <p className="text-sm text-[var(--foreground-muted)]">{date.label}</p>
                    </button>
                  ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {activeRescheduleDate?.slots.length ? activeRescheduleDate.slots.map((slot) => (
                    <button
                      key={slot.startsAt}
                      type="button"
                      onClick={() => setRescheduleSlot(slot.startsAt)}
                      className={cn(
                        "rounded-full border px-4 py-3 text-sm font-medium transition",
                        rescheduleSlot === slot.startsAt ? "border-transparent bg-[var(--rose-500)] text-white" : "border-[var(--border)] bg-white text-[var(--foreground)]",
                      )}
                    >
                      {slot.label}
                    </button>
                  )) : <p className="text-sm text-[var(--foreground-muted)]">No alternate slots on this day. Try another date.</p>}
                </div>
              </>
            )}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setRescheduleAppointment(null)}>Cancel</Button>
              <Button type="button" onClick={submitReschedule} disabled={pendingAction}>{pendingAction ? "Saving..." : "Confirm reschedule"}</Button>
            </div>
          </Card>
        </div>
      ) : null}

      {cancelAppointment ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(15,23,42,0.45)] p-4">
          <Card className="w-full max-w-xl space-y-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold">Cancel appointment</h2>
              <p className="text-sm text-[var(--foreground-muted)]">Choose a reason before cancelling this visit.</p>
            </div>
            <div className="space-y-3">
              {cancelReasons.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setCancelReason(reason)}
                  className={cn(
                    "w-full rounded-[24px] border px-4 py-4 text-left transition",
                    cancelReason === reason ? "border-transparent bg-[var(--rose-50)] ring-2 ring-[rgba(232,125,155,0.35)]" : "border-[var(--border)] bg-white",
                  )}
                >
                  {cancelReasonLabels[reason]}
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setCancelAppointment(null)}>Keep appointment</Button>
              <Button type="button" onClick={submitCancellation} disabled={pendingAction}>{pendingAction ? "Cancelling..." : "Confirm cancel"}</Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
