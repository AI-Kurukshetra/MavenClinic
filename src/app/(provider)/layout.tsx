import { redirect } from "next/navigation";
import { getAuthenticatedRedirectPath, getCurrentProfileWithSync, getCurrentUser } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type ProviderAccessState = {
  suspended: boolean;
  approvalStatus: "pending" | "approved" | "rejected";
};

async function getProviderAccessState(userId: string): Promise<ProviderAccessState | null> {
  const admin = getSupabaseAdminClient();
  const primaryResult = await admin
    .from("providers")
    .select("id, suspended, approval_status")
    .eq("profile_id", userId)
    .maybeSingle();

  if (!primaryResult.error) {
    const row = primaryResult.data as { suspended?: boolean | null; approval_status?: string | null } | null;
    return row
      ? {
          suspended: Boolean(row.suspended),
          approvalStatus: row.approval_status === "pending" || row.approval_status === "rejected" ? row.approval_status : "approved",
        }
      : null;
  }

  if (!primaryResult.error.message.includes("approval_status")) {
    throw new Error(primaryResult.error.message);
  }

  const fallbackResult = await admin
    .from("providers")
    .select("id, suspended")
    .eq("profile_id", userId)
    .maybeSingle();

  if (fallbackResult.error) {
    throw new Error(fallbackResult.error.message);
  }

  const fallbackRow = fallbackResult.data as { suspended?: boolean | null } | null;
  return fallbackRow ? { suspended: Boolean(fallbackRow.suspended), approvalStatus: "approved" } : null;
}

export default async function ProtectedProviderLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfileWithSync(user);

  if (profile?.role !== "provider") {
    redirect(getAuthenticatedRedirectPath(profile));
  }

  const providerAccess = await getProviderAccessState(user.id);

  if (providerAccess?.suspended) {
    const supabase = await getSupabaseServerClient();
    await supabase.auth.signOut();
    redirect("/login?error=account_suspended");
  }

  if (providerAccess?.approvalStatus === "pending") {
    redirect("/register/provider/pending");
  }

  if (providerAccess?.approvalStatus === "rejected") {
    const supabase = await getSupabaseServerClient();
    await supabase.auth.signOut();
    redirect("/login?error=application_rejected");
  }

  return children;
}