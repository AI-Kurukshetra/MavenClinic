import { redirect } from "next/navigation";
import { getAuthenticatedRedirectPath, getCurrentProfileWithSync, getCurrentUser } from "@/lib/auth";

export default async function ProtectedEmployerLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfileWithSync(user);

  if (profile?.role !== "employer_admin") {
    redirect(getAuthenticatedRedirectPath(profile));
  }

  return children;
}