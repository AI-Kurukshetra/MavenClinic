import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { NotificationsFeed } from "@/components/health/notifications-feed";
import { getCurrentProfileWithSync, getCurrentUser } from "@/lib/auth";
import { getNotificationsPageData } from "@/lib/data";
import type { AppRole } from "@/lib/roles";

function getShellSection(role?: AppRole | null) {
  if (role === "provider") {
    return "provider" as const;
  }

  if (role === "employer_admin") {
    return "employer" as const;
  }

  if (role === "clinic_admin") {
    return "clinic" as const;
  }

  if (role === "super_admin") {
    return "super" as const;
  }

  if (role === "partner") {
    return "partner" as const;
  }

  return "patient" as const;
}

export default async function NotificationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfileWithSync(user);

  if (profile?.role === "patient" && !profile?.onboarding_complete) {
    redirect("/onboarding");
  }

  const data = await getNotificationsPageData();

  return (
    <DashboardShell title="Notifications" eyebrow="Activity center" section={getShellSection(profile?.role)}>
      <NotificationsFeed
        userId={data.userId}
        initialNotifications={data.items}
        initialUnreadCount={data.unreadCount}
      />
    </DashboardShell>
  );
}