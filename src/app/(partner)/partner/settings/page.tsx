import { logoutAction } from "@/app/(auth)/actions";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PartnerRemoveAccessButton } from "@/features/partner/partner-client";
import { PartnerAccessChip } from "@/features/partner/partner-shared";
import { getPartnerSettingsPageData } from "@/lib/partner-data";
import { formatDate } from "@/lib/utils";

export default async function PartnerSettingsPage() {
  const data = await getPartnerSettingsPageData();

  return (
    <DashboardShell title="Partner settings" eyebrow="Partner portal" section="partner">
      <div className="space-y-6">
        <Card>
          <p className="text-sm uppercase tracking-[0.22em] text-[var(--rose-700)]">Access details</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            {data.context.hasActiveAccess ? `Current access: ${data.context.accessLabel}` : "No shared access yet"}
          </h2>
          <p className="mt-3 text-sm leading-7 text-[var(--foreground-muted)]">
            {data.context.hasActiveAccess
              ? `Access granted by ${data.context.patientName}${data.context.grantedAt ? ` on ${formatDate(data.context.grantedAt)}` : ""}.`
              : "Your account is active, but no partner access has been shared with you yet."}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {data.accessChips.map((chip) => (
              <PartnerAccessChip key={chip.key} label={chip.label} granted={chip.granted} />
            ))}
          </div>
          <p className="mt-4 text-sm leading-7 text-[var(--foreground-muted)]">
            {data.context.hasActiveAccess
              ? `You cannot change your own access here. Ask ${data.context.patientFirstName} to update your access if something needs to change.`
              : "When your partner shares access, the details will appear here in a read-only summary."}
          </p>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <h3 className="text-2xl font-semibold tracking-tight">What you can see</h3>
            <div className="mt-4 space-y-3 text-sm text-[var(--foreground-muted)]">
              {data.accessChips.map((chip) => (
                <div key={chip.key} className="flex items-center justify-between rounded-2xl border border-[var(--border)] px-4 py-3">
                  <span>{chip.label}</span>
                  <span className={chip.granted ? "text-[var(--teal-700)]" : "text-slate-400"}>{chip.granted ? "Accessible" : "Not shared"}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <h3 className="text-2xl font-semibold tracking-tight">Account actions</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--foreground-muted)]">Use sign out when you are done, or remove your shared access if you no longer need this view.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <form action={logoutAction}>
                <Button type="submit" variant="secondary" className="rounded-xl">Sign out</Button>
              </form>
              {data.context.hasActiveAccess ? <PartnerRemoveAccessButton patientName={data.context.patientName} /> : null}
            </div>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
