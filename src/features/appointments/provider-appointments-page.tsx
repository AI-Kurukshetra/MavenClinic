"use client";

import type { Route } from "next";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { endOfMonth, endOfWeek, format, isToday, isTomorrow, startOfMonth, startOfWeek } from "date-fns";
import { CalendarClock, CheckCircle2, ChevronLeft, ChevronRight, Clock3, LoaderCircle, NotebookText, Video } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Toast } from "@/components/ui/Toast";
import { isJoinWindow } from "@/lib/appointments";
import type { ProviderAppointmentsPageData, ProviderAppointmentsPageAppointment } from "@/lib/provider-appointments";
import { cn, formatDate, titleCase } from "@/lib/utils";

type Props = ProviderAppointmentsPageData & {
  initialToast?: string | null;
};

type FilterValue = "all" | "today" | "this_week" | "this_month";
type TabValue = "upcoming" | "today" | "past";
type ToastState = { message: string; variant: "success" | "error" | "info" };

const toastMessages: Record<string, string> = {
  "provider-appointment-rescheduled": "Appointment rescheduled and patient notified.",
  "provider-appointment-cancelled": "Appointment cancelled and patient notified.",
};

function formatRelativeAppointment(value: string) {
  const date = new Date(value);
  if (isToday(date)) {
    return `Today at ${format(date, "h:mm a")}`;
  }
  if (isTomorrow(date)) {
    return `Tomorrow at ${format(date, "h:mm a")}`;
  }
  return format(date, "EEE, MMM d 'at' h:mm a");
}

function getStatusVariant(status: ProviderAppointmentsPageAppointment["status"]) {
  if (status === "scheduled" || status === "in_progress") {
    return "info" as const;
  }
  if (status === "cancelled" || status === "no_show") {
    return "warning" as const;
  }
  return "neutral" as const;
}

function getTypeLabel(type: ProviderAppointmentsPageAppointment["type"]) {
  if (type === "async_review") {
    return "Async review";
  }
  return titleCase(type);
}

function getFilterMatches(filter: FilterValue, scheduledAt: string) {
  const date = new Date(scheduledAt);
  const now = new Date();

  if (filter === "today") {
    return isToday(date);
  }

  if (filter === "this_week") {
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    return date >= weekStart && date <= weekEnd;
  }

  if (filter === "this_month") {
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    return date >= monthStart && date <= monthEnd;
  }

  return true;
}

function CurrentTimeIndicator() {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="h-px flex-1 bg-[rgba(212,88,123,0.28)]" />
      <span className="rounded-full bg-[var(--rose-500)] px-3 py-1 text-xs font-semibold text-white">Current time</span>
      <div className="h-px flex-1 bg-[rgba(212,88,123,0.28)]" />
    </div>
  );
}

export function ProviderAppointmentsPage({ appointments, stats, availabilityByAppointmentId, initialToast }: Props) {
  const [tab, setTab] = useState<TabValue>("upcoming");
  const [filter, setFilter] = useState<FilterValue>("all");
  const [toast, setToast] = useState<ToastState | null>(() => initialToast ? { message: toastMessages[initialToast] ?? initialToast, variant: "success" } : null);
  const [rescheduleAppointment, setRescheduleAppointment] = useState<ProviderAppointmentsPageAppointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlot, setRescheduleSlot] = useState("");
  const [cancelAppointment, setCancelAppointment] = useState<ProviderAppointmentsPageAppointment | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [pastPage, setPastPage] = useState(1);
  const [pendingAction, startTransition] = useTransition();

  const now = new Date();

  const filteredAppointments = useMemo(() => appointments.filter((appointment) => getFilterMatches(filter, appointment.scheduledAt)), [appointments, filter]);
  const upcomingAppointments = filteredAppointments.filter((appointment) => appointment.status === "scheduled" && new Date(appointment.scheduledAt) >= now);
  const todayAppointments = filteredAppointments.filter((appointment) => isToday(new Date(appointment.scheduledAt)) && ["scheduled", "in_progress"].includes(appointment.status));
  const pastAppointments = filteredAppointments
    .filter((appointment) => ["completed", "cancelled", "no_show"].includes(appointment.status))
    .sort((left, right) => new Date(right.scheduledAt).getTime() - new Date(left.scheduledAt).getTime());
  const pastPages = Math.max(1, Math.ceil(pastAppointments.length / 20));
  const visiblePastAppointments = pastAppointments.slice((pastPage - 1) * 20, pastPage * 20);

  const rescheduleDates = rescheduleAppointment ? availabilityByAppointmentId[rescheduleAppointment.id] ?? [] : [];
  const activeRescheduleDate = rescheduleDates.find((date) => date.date === rescheduleDate) ?? rescheduleDates[0] ?? null;

  function openReschedule(appointment: ProviderAppointmentsPageAppointment) {
    const dates = availabilityByAppointmentId[appointment.id] ?? [];
    const firstDate = dates.find((date) => date.slots.length > 0) ?? dates[0] ?? null;
    setRescheduleAppointment(appointment);
    setRescheduleDate(firstDate?.date ?? "");
    setRescheduleSlot(firstDate?.slots[0]?.startsAt ?? "");
  }

  function handleReschedule() {
    if (!rescheduleAppointment || !rescheduleSlot) {
      setToast({ message: "Choose a new time slot.", variant: "error" });
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/provider/appointments/${rescheduleAppointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reschedule", scheduledAt: rescheduleSlot }),
      });
      const data = await response.json();
      if (!response.ok) {
        setToast({ message: data.error ?? "Unable to reschedule this appointment.", variant: "error" });
        return;
      }

      window.location.href = `/provider/appointments?toast=${data.toast ?? "provider-appointment-rescheduled"}`;
    });
  }

  function handleCancel() {
    if (!cancelAppointment || cancelReason.trim().length < 5) {
      setToast({ message: "Add a cancellation reason.", variant: "error" });
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/provider/appointments/${cancelAppointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", reason: cancelReason.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        setToast({ message: data.error ?? "Unable to cancel this appointment.", variant: "error" });
        return;
      }

      window.location.href = `/provider/appointments?toast=${data.toast ?? "provider-appointment-cancelled"}`;
    });
  }

  return (
    <div className="space-y-6">
      {toast ? <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} /> : null}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--foreground-muted)]">Manage your upcoming and past consultations</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/provider/availability" className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--border)] px-5 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--slate-50)]">
            Set availability
          </Link>
          <select
            value={filter}
            onChange={(event) => {
              setFilter(event.target.value as FilterValue);
              setPastPage(1);
            }}
            className="h-11 rounded-full border border-[var(--border)] bg-white px-4 text-sm outline-none transition focus:border-[var(--rose-300)]"
          >
            <option value="all">All</option>
            <option value="today">Today</option>
            <option value="this_week">This week</option>
            <option value="this_month">This month</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5">
          <p className="text-sm uppercase tracking-[0.16em] text-[var(--rose-700)]">This week</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{stats.thisWeek}</p>
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">scheduled consultations</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm uppercase tracking-[0.16em] text-[var(--rose-700)]">Completion rate</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{stats.completionRate}%</p>
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">completed vs. no-show</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm uppercase tracking-[0.16em] text-[var(--rose-700)]">Avg per day</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{stats.avgPerDay}</p>
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">appointments this month</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm uppercase tracking-[0.16em] text-[var(--rose-700)]">Next available</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight">{stats.nextAvailable ? format(new Date(stats.nextAvailable), "EEE, MMM d") : "No open slots"}</p>
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">{stats.nextAvailable ? format(new Date(stats.nextAvailable), "h:mm a") : "Add availability to open bookings"}</p>
        </Card>
      </div>

      <div className="inline-flex rounded-full border border-[var(--border)] bg-white p-1">
        {([
          { key: "upcoming", label: "Upcoming" },
          { key: "today", label: "Today" },
          { key: "past", label: "Past" },
        ] as const).map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={cn("rounded-full px-5 py-2 text-sm font-medium transition", tab === item.key ? "bg-[var(--rose-500)] text-white" : "text-[var(--foreground-muted)]")}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "upcoming" ? (
        <div className="space-y-4">
          {upcomingAppointments.length ? upcomingAppointments.map((appointment) => (
            <Card key={appointment.id} className="space-y-4 p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <Avatar src={appointment.patientAvatarUrl ?? undefined} name={appointment.patientName} size="lg" />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-semibold">{appointment.patientName}</h2>
                      <Badge variant={getStatusVariant(appointment.status)}>{titleCase(appointment.status)}</Badge>
                      <Badge variant="neutral">{appointment.durationMinutes} min</Badge>
                      <Badge variant="neutral">{getTypeLabel(appointment.type)}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-[var(--foreground-muted)]">{formatRelativeAppointment(appointment.scheduledAt)}</p>
                    <p className="mt-3 line-clamp-1 text-sm text-[var(--foreground)]">{appointment.chiefComplaint}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {isJoinWindow(appointment.scheduledAt, appointment.status) ? (
                    <Link href={`/consultations/${appointment.id}` as Route} className="inline-flex h-10 items-center justify-center rounded-full bg-[var(--rose-500)] px-4 text-sm font-medium text-white transition hover:bg-[var(--rose-600)]">
                      <Video className="mr-2 h-4 w-4" />
                      Join video
                    </Link>
                  ) : (
                    <Button type="button" size="sm" disabled className="rounded-full opacity-60">
                      <Video className="mr-2 h-4 w-4" />
                      Join video
                    </Button>
                  )}
                  <Link href={`/provider/patients/${appointment.patientId}`} className="inline-flex h-10 items-center justify-center rounded-full border border-[var(--border)] px-4 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--slate-50)]">
                    View patient
                  </Link>
                  <Button type="button" size="sm" variant="secondary" className="rounded-full" onClick={() => openReschedule(appointment)}>
                    Reschedule
                  </Button>
                  <Button type="button" size="sm" variant="secondary" className="rounded-full" onClick={() => { setCancelAppointment(appointment); setCancelReason(""); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )) : (
            <Card className="p-8 text-center">
              <CalendarClock className="mx-auto h-10 w-10 text-[var(--rose-600)]" />
              <h2 className="mt-4 text-2xl font-semibold">No upcoming appointments</h2>
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">Your upcoming consultations will appear here as patients book time with you.</p>
            </Card>
          )}
        </div>
      ) : null}

      {tab === "today" ? (
        <Card className="space-y-4 p-5 sm:p-6">
          <div>
            <h2 className="text-2xl font-semibold">Today&apos;s timeline</h2>
            <p className="mt-2 text-sm text-[var(--foreground-muted)]">A focused view of today&apos;s consultations.</p>
          </div>
          {todayAppointments.length ? (
            <div className="space-y-4">
              {todayAppointments.map((appointment, index) => {
                const appointmentTime = new Date(appointment.scheduledAt);
                const showCurrentTime = index === todayAppointments.findIndex((item) => new Date(item.scheduledAt) >= now);
                return (
                  <div key={appointment.id} className="space-y-4">
                    {showCurrentTime ? <CurrentTimeIndicator /> : null}
                    <div className="grid gap-4 md:grid-cols-[120px_1fr] md:items-start">
                      <div className="pt-3 text-sm font-medium text-[var(--foreground-muted)]">{format(appointmentTime, "h:mm a")}</div>
                      <div className="rounded-[24px] border border-[var(--border)] bg-[var(--slate-50)] p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-lg font-semibold">{appointment.patientName}</p>
                            <p className="mt-1 text-sm text-[var(--foreground-muted)]">{appointment.durationMinutes} min <span className="mx-1 text-slate-300">-</span> {getTypeLabel(appointment.type)}</p>
                            <p className="mt-3 text-sm text-[var(--foreground)]">{appointment.chiefComplaint}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant={getStatusVariant(appointment.status)}>{titleCase(appointment.status)}</Badge>
                            <Link href={`/provider/patients/${appointment.patientId}`} className="inline-flex h-9 items-center justify-center rounded-full border border-[var(--border)] px-4 text-sm font-medium text-[var(--foreground)] transition hover:bg-white">
                              View patient
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-[var(--border)] px-5 py-10 text-center">
              <Clock3 className="mx-auto h-10 w-10 text-[var(--rose-600)]" />
              <h3 className="mt-4 text-xl font-semibold">No appointments today</h3>
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">Your next scheduled visit will show up here when it falls on today&apos;s timeline.</p>
            </div>
          )}
        </Card>
      ) : null}

      {tab === "past" ? (
        <div className="space-y-4">
          {visiblePastAppointments.length ? visiblePastAppointments.map((appointment) => (
            <Card key={appointment.id} className="space-y-4 p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold">{appointment.patientName}</h2>
                    <Badge variant={getStatusVariant(appointment.status)}>{titleCase(appointment.status)}</Badge>
                    <Badge variant="neutral">{appointment.durationMinutes} min</Badge>
                  </div>
                  <p className="mt-2 text-sm text-[var(--foreground-muted)]">{formatDate(appointment.scheduledAt, "MMM d, yyyy 'at' h:mm a")}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="secondary" className="rounded-full" onClick={() => setToast({ message: appointment.notes || "No notes saved for this visit.", variant: "info" })}>
                    <NotebookText className="mr-2 h-4 w-4" />
                    View notes
                  </Button>
                  <Link href={`/provider/care-plans?patientId=${appointment.patientId}` as Route} className="inline-flex h-9 items-center justify-center rounded-full bg-[var(--rose-500)] px-4 text-sm font-medium text-white transition hover:bg-[var(--rose-600)]">
                    Create care plan
                  </Link>
                </div>
              </div>
            </Card>
          )) : (
            <Card className="p-8 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-[var(--teal-700)]" />
              <h2 className="mt-4 text-2xl font-semibold">No past appointments yet</h2>
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">Completed, cancelled, and no-show visits will appear here.</p>
            </Card>
          )}

          {pastAppointments.length > 20 ? (
            <div className="flex items-center justify-between gap-4">
              <Button type="button" variant="secondary" size="sm" className="rounded-full" onClick={() => setPastPage((current) => Math.max(1, current - 1))} disabled={pastPage === 1}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              <p className="text-sm text-[var(--foreground-muted)]">Page {pastPage} of {pastPages}</p>
              <Button type="button" variant="secondary" size="sm" className="rounded-full" onClick={() => setPastPage((current) => Math.min(pastPages, current + 1))} disabled={pastPage === pastPages}>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {rescheduleAppointment ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(15,23,42,0.45)] p-4">
          <Card className="max-h-[90vh] w-full max-w-3xl overflow-auto space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Reschedule appointment</h2>
                <p className="mt-1 text-sm text-[var(--foreground-muted)]">Move {rescheduleAppointment.patientName}&apos;s consultation to another open slot.</p>
              </div>
              <Button type="button" variant="ghost" onClick={() => setRescheduleAppointment(null)}>Close</Button>
            </div>
            <div className="rounded-[24px] bg-[var(--slate-50)] p-4 text-sm text-[var(--foreground-muted)]">
              Current time: {formatRelativeAppointment(rescheduleAppointment.scheduledAt)}
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {rescheduleDates.map((date) => (
                <button
                  key={date.date}
                  type="button"
                  onClick={() => {
                    setRescheduleDate(date.date);
                    setRescheduleSlot(date.slots[0]?.startsAt ?? "");
                  }}
                  className={cn("min-w-28 rounded-[24px] border px-4 py-4 text-left transition", rescheduleDate === date.date ? "border-transparent bg-[var(--rose-50)] ring-2 ring-[rgba(212,88,123,0.26)]" : "border-[var(--border)] bg-white")}
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
                  className={cn("rounded-full border px-4 py-3 text-sm font-medium transition", rescheduleSlot === slot.startsAt ? "border-transparent bg-[var(--rose-500)] text-white" : "border-[var(--border)] bg-white")}
                >
                  {slot.label}
                </button>
              )) : <p className="text-sm text-[var(--foreground-muted)]">No alternate slots on this date.</p>}
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setRescheduleAppointment(null)}>Cancel</Button>
              <Button type="button" onClick={handleReschedule} disabled={pendingAction || !rescheduleSlot}>
                {pendingAction ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                Confirm reschedule
              </Button>
            </div>
          </Card>
        </div>
      ) : null}

      {cancelAppointment ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(15,23,42,0.45)] p-4">
          <Card className="w-full max-w-xl space-y-4">
            <div>
              <h2 className="text-2xl font-semibold">Cancel appointment</h2>
              <p className="mt-1 text-sm text-[var(--foreground-muted)]">Tell the patient why this visit is being cancelled.</p>
            </div>
            <textarea
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              rows={5}
              placeholder="Add the reason for the cancellation"
              className="w-full rounded-[24px] border border-[var(--border)] px-4 py-3 outline-none transition focus:border-[var(--rose-300)]"
            />
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setCancelAppointment(null)}>Keep appointment</Button>
              <Button type="button" onClick={handleCancel} disabled={pendingAction || cancelReason.trim().length < 5}>
                {pendingAction ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                Confirm cancel
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
