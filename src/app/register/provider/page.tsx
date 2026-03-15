import { redirect } from "next/navigation";
import { registerProviderAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAuthenticatedRedirectPath, getCurrentProfileWithSync, getCurrentUser } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getInvitationError as getProviderInvitationError,
  getProviderInvitationByToken,
  getProviderSpecialtyLabel,
  normalizeInvitationToken,
  providerSpecialties,
} from "@/lib/provider-invitations";

type ProviderRegistrationState = "pending" | "approved" | "rejected";

async function getProviderApprovalState(userId: string): Promise<ProviderRegistrationState | null> {
  const admin = getSupabaseAdminClient();
  const primaryResult = await admin
    .from("providers")
    .select("approval_status")
    .eq("profile_id", userId)
    .maybeSingle();

  if (!primaryResult.error) {
    const row = primaryResult.data as { approval_status?: string | null } | null;
    if (!row?.approval_status) {
      return row ? "approved" : null;
    }

    return row.approval_status === "pending" || row.approval_status === "rejected" ? row.approval_status : "approved";
  }

  if (!primaryResult.error.message.includes("approval_status")) {
    throw new Error(primaryResult.error.message);
  }

  const fallbackResult = await admin
    .from("providers")
    .select("id")
    .eq("profile_id", userId)
    .maybeSingle();

  if (fallbackResult.error) {
    throw new Error(fallbackResult.error.message);
  }

  return fallbackResult.data ? "approved" : null;
}

export default async function ProviderRegistrationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const currentUser = await getCurrentUser();

  if (currentUser) {
    const profile = await getCurrentProfileWithSync(currentUser);

    if (profile?.role === "provider") {
      const approvalStatus = await getProviderApprovalState(currentUser.id);

      if (approvalStatus === "pending") {
        redirect("/register/provider/pending");
      }

      if (approvalStatus === "rejected") {
        redirect("/login?error=application_rejected");
      }
    }

    redirect(getAuthenticatedRedirectPath(profile));
  }

  const token = normalizeInvitationToken(params.token);
  const invitation = token ? await getProviderInvitationByToken(token) : null;
  const invitationError = token ? getProviderInvitationError(invitation) : null;
  const error = params.error ?? invitationError;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-3xl space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-[var(--teal-700)]">Provider invite</p>
          <h1 className="mt-2 text-4xl font-semibold">Create your provider account</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--foreground-muted)]">
            Provider registration is invite-only. Paste your invite token below or open the full invite link you received from Maven Clinic.
          </p>
        </div>

        {params.message ? <div className="rounded-2xl bg-[var(--teal-50)] px-4 py-3 text-sm text-[var(--teal-700)]">{params.message}</div> : null}
        {error ? <div className="rounded-2xl bg-[var(--rose-50)] px-4 py-3 text-sm text-[var(--rose-700)]">{error}</div> : null}

        {!invitation ? (
          <form method="GET" className="space-y-5">
            <label className="block space-y-2">
              <span className="text-sm text-[var(--foreground-muted)]">Invite token</span>
              <input name="token" defaultValue={token} placeholder="Paste your provider invite token" className="w-full rounded-2xl border border-[var(--border)] px-4 py-3" required />
            </label>
            <div className="flex justify-end border-t border-[var(--border)] pt-5">
              <Button>Validate invite</Button>
            </div>
          </form>
        ) : null}

        {invitation && !error ? (
          <form action={registerProviderAction} className="space-y-5">
            <input type="hidden" name="token" value={token} />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm text-[var(--foreground-muted)]">Invited email</span>
                <input value={invitation.email} disabled className="w-full rounded-2xl border border-[var(--border)] bg-[var(--slate-50)] px-4 py-3 text-[var(--foreground-muted)]" />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-[var(--foreground-muted)]">Full name</span>
                <input name="fullName" placeholder="Dr. Sarah Chen" className="w-full rounded-2xl border border-[var(--border)] px-4 py-3" required />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-[var(--foreground-muted)]">Password</span>
                <input name="password" type="password" placeholder="Create a secure password" className="w-full rounded-2xl border border-[var(--border)] px-4 py-3" minLength={8} required />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-[var(--foreground-muted)]">Specialty</span>
                <select name="specialty" defaultValue="" className="w-full rounded-2xl border border-[var(--border)] px-4 py-3" required>
                  <option value="" disabled>Select specialty</option>
                  {providerSpecialties.map((specialty) => (
                    <option key={specialty} value={specialty}>{getProviderSpecialtyLabel(specialty)}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm text-[var(--foreground-muted)]">Consultation fee (USD)</span>
                <input name="consultationFee" type="number" min="0" step="0.01" placeholder="85" className="w-full rounded-2xl border border-[var(--border)] px-4 py-3" required />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-[var(--foreground-muted)]">License number</span>
                <input name="licenseNumber" placeholder="CA-123456" className="w-full rounded-2xl border border-[var(--border)] px-4 py-3" required />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-[var(--foreground-muted)]">Languages</span>
                <input name="languages" placeholder="English, Spanish" className="w-full rounded-2xl border border-[var(--border)] px-4 py-3" required />
              </label>
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm text-[var(--foreground-muted)]">Bio</span>
                <textarea name="bio" placeholder="Share your clinical focus, patient approach, and areas of expertise." className="min-h-36 w-full rounded-[24px] border border-[var(--border)] px-4 py-3" required />
              </label>
            </div>
            <div className="flex justify-end border-t border-[var(--border)] pt-5">
              <Button>Create provider account</Button>
            </div>
          </form>
        ) : null}
      </Card>
    </main>
  );
}