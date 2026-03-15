import { notFound } from "next/navigation";
import { Toast } from "@/components/ui/Toast";
import { Card } from "@/components/ui/card";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { ClinicProviderDetailActions } from "@/features/clinic/clinic-dashboard-tools";
import { getClinicProviderDetailData } from "@/lib/clinic-admin-data";

function getParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : null;
}

export default async function ClinicProviderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const provider = await getClinicProviderDetailData(id);

  if (!provider) {
    notFound();
  }

  const message = getParam(query.message);
  const error = getParam(query.error);
  const panel = getParam(query.panel);

  return (
    <DashboardShell title="Provider profile" eyebrow="Clinic administration" section="clinic">
      <div className="space-y-6">
        {message ? <Toast message={message} variant="success" /> : null}
        {error ? <Toast message={error} variant="error" /> : null}

        <Card className="p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(232,125,155,0.14)] text-xl font-semibold text-[var(--rose-700)]">
                {provider.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-[var(--rose-700)]">Provider detail</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight">{provider.name}</h2>
                <p className="mt-2 text-sm text-[var(--foreground-muted)]">{provider.specialty}</p>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--foreground-muted)]">{provider.bio}</p>
              </div>
            </div>
            <ClinicProviderDetailActions providerId={provider.id} redirectTo={`/clinic/providers/${provider.id}`} />
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="p-5"><p className="text-sm text-[var(--foreground-muted)]">Total appointments</p><p className="mt-3 text-3xl font-semibold tracking-tight">{provider.totalAppointments}</p></Card>
          <Card className="p-5"><p className="text-sm text-[var(--foreground-muted)]">Rating</p><p className="mt-3 text-3xl font-semibold tracking-tight">{provider.rating ? provider.rating.toFixed(1) : "New"} {provider.rating ? <span className="text-amber-400">{"\u2605"}</span> : null}</p></Card>
          <Card className="p-5"><p className="text-sm text-[var(--foreground-muted)]">Reviews</p><p className="mt-3 text-3xl font-semibold tracking-tight">{provider.reviews}</p></Card>
          <Card className="p-5"><p className="text-sm text-[var(--foreground-muted)]">Patients</p><p className="mt-3 text-3xl font-semibold tracking-tight">{provider.patients}</p></Card>
        </div>

        <Card className="p-6">
          <p className="text-sm uppercase tracking-[0.22em] text-[var(--rose-700)]">Availability</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight">Availability schedule</h3>
          {provider.availability.length ? (
            <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {provider.availability.map((slot) => (
                <div key={slot.id} className="rounded-2xl border border-[var(--border)] px-4 py-4">
                  <p className="font-medium text-[var(--foreground)]">{slot.dayLabel}</p>
                  <p className="mt-1 text-sm text-[var(--foreground-muted)]">{slot.timeLabel}</p>
                  <p className="mt-1 text-sm text-[var(--teal-700)]">{slot.location}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-[var(--foreground-muted)]">No availability windows are configured yet.</p>
          )}
        </Card>

        {panel === "edit" ? (
          <Card className="p-6 text-sm leading-7 text-[var(--foreground-muted)]">
            Edit profile controls are the next clinic-admin workflow to wire into this page.
          </Card>
        ) : null}
        {panel === "appointments" ? (
          <Card className="p-6 text-sm leading-7 text-[var(--foreground-muted)]">
            Appointment-level drilldown is coming next. The summary cards above already reflect this provider&apos;s live appointment volume.
          </Card>
        ) : null}
      </div>
    </DashboardShell>
  );
}