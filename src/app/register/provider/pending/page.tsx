import { redirect } from "next/navigation";
import { logoutAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAuthenticatedRedirectPath, getCurrentProfileWithSync, getCurrentUser } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type ProviderRegistrationState = "pending" | "approved" | "rejected";

async function getProviderApprovalState(userId: string): Promise<ProviderRegistrationState> {
  const admin = getSupabaseAdminClient();
  const primaryResult = await admin
    .from("providers")
    .select("approval_status")
    .eq("profile_id", userId)
    .maybeSingle();

  if (!primaryResult.error) {
    const row = primaryResult.data as { approval_status?: string | null } | null;
    if (!row?.approval_status) {
      return "pending";
    }

    return row.approval_status === "approved" || row.approval_status === "rejected" ? row.approval_status : "pending";
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

  return fallbackResult.data ? "approved" : "pending";
}

export default async function ProviderRegistrationPendingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfileWithSync(user);
  if (profile?.role !== "provider") {
    redirect(getAuthenticatedRedirectPath(profile));
  }

  const approvalStatus = await getProviderApprovalState(user.id);

  if (approvalStatus === "approved") {
    redirect("/provider/dashboard");
  }

  if (approvalStatus === "rejected") {
    const supabase = await getSupabaseServerClient();
    await supabase.auth.signOut();
    redirect("/login?error=application_rejected");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-2xl space-y-6 p-8 text-center sm:p-10">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-[var(--teal-700)]">Application submitted</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Your provider application is under review</h1>
          <p className="mt-4 text-sm leading-7 text-[var(--foreground-muted)]">
            Our clinical team will verify your credentials within 1-2 business days.
          </p>
        </div>
        <div className="rounded-[24px] bg-[var(--slate-50)] px-5 py-4 text-sm text-[var(--foreground-muted)]">
          We will notify you at <span className="font-medium text-[var(--foreground)]">{user.email}</span>
        </div>
        <form action={logoutAction} className="flex justify-center">
          <Button type="submit" variant="secondary" className="rounded-xl px-6">
            Sign out
          </Button>
        </form>
      </Card>
    </main>
  );
}