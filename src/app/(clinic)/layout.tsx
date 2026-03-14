import { redirect } from "next/navigation";
import { getAuthenticatedRedirectPath, getCurrentProfileWithSync, getCurrentUser } from "@/lib/auth";

export default async function ProtectedClinicLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfileWithSync(user);

  if (profile?.role !== "clinic_admin" && profile?.role !== "super_admin") {
    redirect(getAuthenticatedRedirectPath(profile));
  }

  return children;
}
