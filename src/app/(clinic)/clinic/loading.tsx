export default function ClinicWorkspaceLoading() {
  return (
    <div className="space-y-6 px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-[28px] border border-[var(--border)] bg-white/70" />
          ))}
        </div>
        <div className="h-[420px] animate-pulse rounded-[28px] border border-[var(--border)] bg-white/70" />
      </div>
    </div>
  );
}