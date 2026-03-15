export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[var(--rose-500)] border-t-transparent" />
        <p className="text-sm text-[var(--foreground-muted)]">Loading your dashboard...</p>
      </div>
    </div>
  );
}
