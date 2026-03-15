import { NotificationBell } from "@/components/health/notification-bell";
import { DashboardSidebar, type DashboardSection } from "@/components/health/dashboard-sidebar";
import { getNotificationShellData } from "@/lib/data";

export async function DashboardShell({
  title,
  eyebrow,
  children,
  section = "patient",
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
  section?: DashboardSection;
}) {
  const notificationShellData = await getNotificationShellData();

  return (
    <div className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-[30px] border border-[var(--border)] bg-white/80 p-5 shadow-[0_16px_40px_rgba(25,22,17,0.05)] backdrop-blur">
          <DashboardSidebar section={section} />
        </aside>
        <div className="rounded-[30px] border border-[var(--border)] bg-white/72 p-5 shadow-[0_16px_40px_rgba(25,22,17,0.05)] backdrop-blur sm:p-8">
          <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-[var(--rose-700)]">{eyebrow}</p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight">{title}</h1>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell
                userId={notificationShellData.userId}
                initialUnreadCount={notificationShellData.unreadCount}
              />
            </div>
          </header>
          {children}
        </div>
      </div>
    </div>
  );
}
