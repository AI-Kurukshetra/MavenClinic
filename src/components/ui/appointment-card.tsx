import type { Route } from "next";
import Link from "next/link";
import { CalendarClock, Video } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import type { Appointment } from "@/types/domain";

type AppointmentCardProps = {
  appointment: Appointment;
  canJoin?: boolean;
  joinHref?: Route;
  onReschedule?: () => void;
  onCancel?: () => void;
  busyAction?: "reschedule" | "cancel" | null;
};

export function AppointmentCard({ appointment, canJoin = false, joinHref, onReschedule, onCancel, busyAction = null }: AppointmentCardProps) {
  const statusVariant = appointment.status === "in_progress" ? "success" : appointment.status === "scheduled" ? "info" : "neutral";
  const showActionRow = Boolean(joinHref || onReschedule || onCancel);

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Avatar src={appointment.providerAvatarUrl} name={appointment.providerName} size="lg" />
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold sm:text-xl">{appointment.providerName}</h3>
                <Badge variant={statusVariant}>{appointment.status.replace("_", " ")}</Badge>
              </div>
              <p className="text-sm text-[var(--foreground-muted)]">{appointment.providerSpecialty}</p>
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--slate-50)] px-3 py-1 text-sm text-[var(--foreground-muted)]">
                <CalendarClock className="h-4 w-4 text-[var(--rose-700)]" />
                {formatDateTime(appointment.scheduledAt)} · {appointment.durationMinutes} min
              </div>
            </div>
          </div>
          {showActionRow ? (
            <div className="flex flex-wrap gap-2 sm:justify-end">
              {joinHref && canJoin ? (
                <Link href={joinHref}>
                  <Button className="gap-2"><Video className="h-4 w-4" />Join Video</Button>
                </Link>
              ) : null}
              {onReschedule ? (
                <Button type="button" size="sm" variant="secondary" onClick={onReschedule} disabled={busyAction === "reschedule"}>
                  {busyAction === "reschedule" ? "Updating..." : "Reschedule"}
                </Button>
              ) : null}
              {onCancel ? (
                <Button type="button" size="sm" variant="secondary" onClick={onCancel} disabled={busyAction === "cancel"}>
                  {busyAction === "cancel" ? "Cancelling..." : "Cancel"}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="rounded-[24px] bg-[var(--slate-50)] px-4 py-4 text-sm leading-7 text-[var(--foreground)]">
          {appointment.chiefComplaint}
        </div>
      </div>
    </Card>
  );
}