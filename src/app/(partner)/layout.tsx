import { redirect } from "next/navigation";
import { getAuthenticatedRedirectPath, getCurrentProfileWithSync, getCurrentUser } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function ProtectedPartnerLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfileWithSync(user);

  if (profile?.role !== "partner") {
    redirect(getAuthenticatedRedirectPath(profile));
  }

  const admin = getSupabaseAdminClient();
  const accessResult = await admin
    .from("partner_access")
    .select("id")
    .eq("partner_id", user.id)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!accessResult.data?.id) {
    const supabase = await getSupabaseServerClient();
    await supabase.auth.signOut();
    redirect("/login?error=no_partner_access");
  }

  return children;
}
