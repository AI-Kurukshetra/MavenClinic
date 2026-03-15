import { redirect } from "next/navigation";
import { registerPartnerAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAuthenticatedRedirectPath, getCurrentProfileWithSync, getCurrentUser } from "@/lib/auth";
import {
  getPartnerInvitationAccessLabel,
  getPartnerInvitationByToken,
  getPartnerInvitationError,
  normalizePartnerInvitationToken,
} from "@/lib/partner-invitations";

export default async function PartnerRegistrationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const currentUser = await getCurrentUser();

  if (currentUser) {
    const profile = await getCurrentProfileWithSync(currentUser);
    redirect(getAuthenticatedRedirectPath(profile));
  }

  const token = normalizePartnerInvitationToken(params.token);
  const invitation = token ? await getPartnerInvitationByToken(token) : null;
  const invitationError = token ? getPartnerInvitationError(invitation) : null;
  const error = params.error ?? invitationError;
  const accessLabel = getPartnerInvitationAccessLabel(invitation);
  const patientName = invitation?.metadata?.patient_name ?? "your partner";
  const partnerName = invitation?.metadata?.partner_name ?? "";

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-3xl space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-[var(--teal-700)]">Partner invite</p>
          <h1 className="mt-2 text-4xl font-semibold">Create your partner account</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--foreground-muted)]">
            Partner registration is invite-only. Use the invitation token you received from Maven Clinic to create your read-only partner account.
          </p>
        </div>

        {params.message ? <div className="rounded-2xl bg-[var(--teal-50)] px-4 py-3 text-sm text-[var(--teal-700)]">{params.message}</div> : null}
        {error ? <div className="rounded-2xl bg-[var(--rose-50)] px-4 py-3 text-sm text-[var(--rose-700)]">{error}</div> : null}

        {!invitation ? (
          <form method="GET" className="space-y-5">
            <label className="block space-y-2">
              <span className="text-sm text-[var(--foreground-muted)]">Invite token</span>
              <input name="token" defaultValue={token} placeholder="Paste your partner invite token" className="w-full rounded-2xl border border-[var(--border)] px-4 py-3" required />
            </label>
            <div className="flex justify-end border-t border-[var(--border)] pt-5">
              <Button>Validate invite</Button>
            </div>
          </form>
        ) : null}

        {invitation && !error ? (
          <form action={registerPartnerAction} className="space-y-5">
            <input type="hidden" name="token" value={token} />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm text-[var(--foreground-muted)]">Invited email</span>
                <input value={invitation.email} disabled className="w-full rounded-2xl border border-[var(--border)] bg-[var(--slate-50)] px-4 py-3 text-[var(--foreground-muted)]" />
              </label>
              <div className="rounded-[24px] border border-[var(--border)] bg-[var(--slate-50)] p-4 sm:col-span-2">
                <p className="text-sm uppercase tracking-[0.16em] text-[var(--rose-700)]">Shared by {patientName}</p>
                <p className="mt-2 text-lg font-semibold tracking-tight">Viewing: {accessLabel}</p>
                {invitation.metadata?.message ? <p className="mt-3 text-sm leading-6 text-[var(--foreground-muted)]">&ldquo;{invitation.metadata.message}&rdquo;</p> : null}
              </div>
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm text-[var(--foreground-muted)]">Full name</span>
                <input name="fullName" defaultValue={partnerName} placeholder="Alex Johnson" className="w-full rounded-2xl border border-[var(--border)] px-4 py-3" required />
              </label>
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm text-[var(--foreground-muted)]">Password</span>
                <input name="password" type="password" placeholder="Create a secure password" className="w-full rounded-2xl border border-[var(--border)] px-4 py-3" minLength={8} required />
              </label>
            </div>
            <div className="flex justify-end border-t border-[var(--border)] pt-5">
              <Button>Create partner account</Button>
            </div>
          </form>
        ) : null}
      </Card>
    </main>
  );
}

