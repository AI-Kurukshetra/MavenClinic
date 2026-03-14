export default function ConsultationLoading() {
  return (
    <div className="min-h-screen animate-pulse bg-[var(--slate-900,#0f172a)] p-4 sm:p-6">
      <div className="h-20 rounded-[28px] bg-white/10" />
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="h-[70vh] rounded-[32px] bg-white/10" />
        <div className="h-[70vh] rounded-[32px] bg-white/10" />
      </div>
    </div>
  );
}