import { redirect } from "next/navigation";
import { getAuthenticatedRedirectPath, getCurrentProfile, getCurrentUser, type AppRole } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const clinicRoles = new Set<AppRole>(["clinic_admin", "super_admin"]);

export async function getCurrentUserRole(): Promise<AppRole | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const supabase = await getSupabaseServerClient();

  try {
    const { data, error } = await supabase.rpc("get_current_user_role");

    if (!error && typeof data === "string") {
      return data as AppRole;
    }
  } catch {
    // Fall back to the profile row until the SQL helper exists in the database.
  }

  const profile = await getCurrentProfile(user.id);
  return profile?.role ?? null;
}

export async function requireClinicAdminAccess() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const role = await getCurrentUserRole();
  const profile = await getCurrentProfile(user.id);

  if (!role || !clinicRoles.has(role)) {
    redirect(getAuthenticatedRedirectPath(profile));
  }

  return {
    user,
    role,
    profile,
  };
}
