import Link from "next/link";
import { Suspense } from "react";
import { CalendarClock, MessageCircleMore, RefreshCcw, Sparkles, Video } from "lucide-react";
import { AppointmentCard } from "@/components/ui/appointment-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/Toast";
import { Card } from "@/components/ui/card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { SkeletonCard } from "@/components/health/skeleton-card";
import { getPatientDashboardData } from "@/lib/data";
import { formatDate, formatDateTime, formatRelativeTime } from "@/lib/utils";

async function DashboardContent() {
  const data = await getPatientDashboardData();
  const unreadMessages = data.messages.reduce((sum, thread) => sum + thread.unreadCount, 0);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6">
        <Card className="bg-gradient-to-br from-[var(--rose-50)] to-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.24em] text-[var(--rose-700)]">Good morning, {data.profile.firstName}</p>
              <h2 className="text-3xl font-semibold">Your care team is lined up for the week ahead.</h2>
              <p className="max-w-2xl text-sm leading-7 text-[var(--foreground-muted)]">Everything important is here: the next visit, your cycle forecast, a fast symptom check-in, and the latest note from your providers.</p>
            </div>
            <Link href="/appointments"><Button variant="secondary">View all appointments</Button></Link>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--foreground-muted)]">Next appointment</p>
                <h3 className="mt-1 text-2xl font-semibold">{data.nextAppointment?.providerName ?? "No upcoming appointments"}</h3>
                <p className="text-sm text-[var(--foreground-muted)]">{data.nextAppointment?.providerSpecialty ?? "Book a visit to see your next care team session here."}</p>
              </div>
              <div className="rounded-2xl bg-[var(--rose-50)] p-3 text-[var(--rose-700)]"><CalendarClock className="h-5 w-5" /></div>
            </div>
            {data.nextAppointment ? (
              <>
                <p className="text-sm text-[var(--foreground)]">{formatDateTime(data.nextAppointment.scheduledAt)}</p>
                <p className="text-sm text-[var(--foreground-muted)]">{data.nextAppointment.chiefComplaint}</p>
                <Link href={`/consultations/${data.nextAppointment.id}`}>
                  <Button className="gap-2"><Video className="h-4 w-4" />Join video</Button>
                </Link>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-[var(--foreground-muted)]">Once you have a scheduled visit, this card will show the provider, time, and quick consultation access.</p>
                <Link href="/appointments"><Button>Book an appointment</Button></Link>
              </div>
            )}
          </Card>

          <Card className="flex items-center gap-5">
            {data.cycleSummary ? (
              <>
                <ProgressRing value={data.cycleSummary.progress} color="teal" />
                <div className="space-y-2">
                  <p className="text-sm text-[var(--foreground-muted)]">Cycle tracker</p>
                  <h3 className="text-2xl font-semibold">Day {data.cycleSummary.cycleDay} of {data.cycleSummary.cycleLength}</h3>
                  <Badge variant="success">{data.cycleSummary.fertilityStatus}</Badge>
                  <p className="text-sm text-[var(--foreground-muted)]">Next predicted period: {formatDate(data.cycleSummary.nextPeriod)}</p>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-[var(--foreground-muted)]">Cycle tracker</p>
                <h3 className="text-2xl font-semibold">No cycle log yet</h3>
                <p className="text-sm text-[var(--foreground-muted)]">Add your latest cycle entry to unlock predictions and fertility-window context.</p>
              </div>
            )}
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-[var(--foreground-muted)]">Daily check-in</p>
                <h3 className="mt-1 text-2xl font-semibold">How are you feeling today?</h3>
              </div>
              <Badge variant="info">Quick log</Badge>
            </div>
            {data.latestSymptomLog ? (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-[var(--slate-50)] p-4"><p className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Mood</p><p className="mt-2 text-2xl font-semibold">{data.latestSymptomLog.mood}/10</p></div>
                  <div className="rounded-2xl bg-[var(--slate-50)] p-4"><p className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Energy</p><p className="mt-2 text-2xl font-semibold">{data.latestSymptomLog.energy}/10</p></div>
                  <div className="rounded-2xl bg-[var(--slate-50)] p-4"><p className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Pain</p><p className="mt-2 text-2xl font-semibold">{data.latestSymptomLog.painLevel}/10</p></div>
                </div>
                <p className="text-sm text-[var(--foreground-muted)]">Latest log: {formatRelativeTime(data.latestSymptomLog.loggedAt)}</p>
              </>
            ) : (
              <p className="text-sm text-[var(--foreground-muted)]">No symptom logs in the last 14 days yet. Add your first check-in to start trend tracking.</p>
            )}
            <Link href="/symptoms"><Button variant="secondary">Open symptom tracker</Button></Link>
          </Card>

          <Card className="space-y-4 bg-[var(--teal-50)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[var(--teal-700)]">AI health insight</p>
                <h3 className="mt-1 text-2xl font-semibold">Pattern highlight</h3>
              </div>
              <button type="button" className="rounded-full border border-[rgba(23,104,95,0.15)] p-2 text-[var(--teal-700)]"><RefreshCcw className="h-4 w-4" /></button>
            </div>
            {data.aiInsight ? (
              <>
                <p className="text-sm leading-7 text-[var(--foreground)]">{data.aiInsight}</p>
                <div className="inline-flex items-center gap-2 text-sm text-[var(--teal-700)]"><Sparkles className="h-4 w-4" />Generated from your recent symptom logs</div>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-sm leading-7 text-[var(--foreground-muted)]">Add symptom check-ins across the next two weeks to generate an AI trend summary here.</p>
                <Link href="/symptoms"><Button variant="secondary">Log symptoms</Button></Link>
              </div>
            )}
          </Card>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[var(--foreground-muted)]">Care plan progress</p>
              <h3 className="mt-1 text-2xl font-semibold">{data.carePlan?.title ?? "No active care plan"}</h3>
            </div>
            <Badge variant="success">{data.carePlan?.progress ?? 0}% complete</Badge>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-[var(--slate-100)]"><div className="h-full rounded-full bg-[var(--teal-500)]" style={{ width: `${data.carePlan?.progress ?? 0}%` }} /></div>
          {data.carePlan ? (
            <div className="space-y-3">
              {data.carePlan.milestones.map((milestone: { title: string; description: string; targetDate: string; completed: boolean; category: string }) => (
                <div key={milestone.title} className="rounded-2xl border border-[var(--border)] bg-[var(--slate-50)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{milestone.title}</p>
                      <p className="text-sm text-[var(--foreground-muted)]">{milestone.description}</p>
                    </div>
                    <Badge variant={milestone.completed ? "success" : "neutral"}>{milestone.completed ? "Done" : formatRelativeTime(milestone.targetDate)}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--foreground-muted)]">Your provider has not published an active care plan yet.</p>
          )}
        </Card>

        <Card className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[var(--foreground-muted)]">Provider messages</p>
              <h3 className="mt-1 text-2xl font-semibold">Unread updates</h3>
            </div>
            <div className="rounded-full bg-[var(--rose-50)] px-3 py-1 text-sm font-semibold text-[var(--rose-700)]">{unreadMessages} unread</div>
          </div>
          {data.messages.length ? (
            <div className="space-y-3">
              {data.messages.map((thread) => (
                <Link key={thread.id} href="/messages" className="block rounded-2xl border border-[var(--border)] bg-[var(--slate-50)] p-4 transition hover:bg-white">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{thread.providerName}</p>
                      <p className="text-sm text-[var(--foreground-muted)]">{thread.lastMessagePreview}</p>
                    </div>
                    <div className="text-right">
                      <MessageCircleMore className="ml-auto h-4 w-4 text-[var(--rose-700)]" />
                      <p className="mt-1 text-xs text-[var(--foreground-muted)]">{formatRelativeTime(thread.updatedAt)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--foreground-muted)]">No conversation activity yet. When your care team writes back, unread counts will appear here based on `read_at`.</p>
          )}
        </Card>

        {data.nextAppointment ? <AppointmentCard appointment={data.nextAppointment} /> : null}
      </div>
    </div>
  );
}

const dashboardToastMessages: Record<string, string> = {
  "consultation-complete": "Consultation complete.",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const toast = typeof params.toast === "string" ? dashboardToastMessages[params.toast] ?? null : null;

  return (
    <DashboardShell title="Patient dashboard" eyebrow="Daily home">
      {toast ? <Toast message={toast} variant="success" /> : null}
      <Suspense fallback={<div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]"><SkeletonCard /><SkeletonCard /></div>}>
        <DashboardContent />
      </Suspense>
    </DashboardShell>
  );
}
