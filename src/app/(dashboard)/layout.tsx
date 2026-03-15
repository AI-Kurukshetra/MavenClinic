import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthenticatedRedirectPath, getCurrentProfile, getCurrentProfileWithSync } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function DashboardProfileError() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
      <div className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-[var(--rose-700)]">Patient dashboard</p>
        <h1 className="font-display text-4xl text-[var(--foreground)]">Unable to verify your dashboard access</h1>
        <p className="text-base text-[var(--foreground-muted)]">
          We could not verify your patient profile right now. Please refresh the page or return to login and try again.
        </p>
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/login" className="rounded-full bg-[var(--rose-500)] px-6 py-3 text-sm font-medium text-white transition hover:bg-[var(--rose-600)]">
          Back to login
        </Link>
        <Link href="/appointments" className="rounded-full border border-[var(--border)] bg-white px-6 py-3 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--border-strong)]">
          Open appointments
        </Link>
      </div>
    </main>
  );
}

export default async function ProtectedDashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error("Session error in dashboard layout:", error);
    redirect("/login");
  }

  if (!session) {
    redirect("/login");
  }

  const profile = await getCurrentProfile(session.user.id);

  if (!profile) {
    console.error("Profile lookup failed in dashboard layout for user", session.user.id);
    return <DashboardProfileError />;
  }

  const syncedProfile = (await getCurrentProfileWithSync(session.user)) ?? profile;

  // Only redirect away if role is explicitly a non-patient role
  // AND we are confident in the data.
  const confirmedRole = syncedProfile.role ?? profile?.role;
  if (confirmedRole && confirmedRole !== "patient" && confirmedRole !== null && confirmedRole !== undefined) {
    console.log("Dashboard layout redirecting role:", confirmedRole);
    redirect(
      getAuthenticatedRedirectPath({
        ...syncedProfile,
        role: confirmedRole,
      }),
    );
  }

  if (!syncedProfile.onboarding_complete) {
    redirect("/onboarding");
  }

  return children;
}
