"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function revokePartnerAccessAction() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const admin = getSupabaseAdminClient();
  await admin.from("partner_access").update({ revoked_at: new Date().toISOString() }).eq("partner_id", user.id).is("revoked_at", null);

  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
