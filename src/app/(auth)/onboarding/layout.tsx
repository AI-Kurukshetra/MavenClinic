import { redirect } from "next/navigation";
import { getAuthenticatedRedirectPath, getCurrentProfileWithSync, getCurrentUser } from "@/lib/auth";

export default async function ProtectedOnboardingLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfileWithSync(user);

  if (profile?.role && profile.role !== "patient") {
    redirect(getAuthenticatedRedirectPath(profile));
  }

  if (profile?.onboarding_complete) {
    redirect("/dashboard");
  }

  return children;
}