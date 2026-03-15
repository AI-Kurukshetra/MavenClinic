import { notFound } from "next/navigation";
import { Toast } from "@/components/ui/Toast";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { SuperProviderDetailPanel } from "@/features/super/super-admin-panels";
import { getSuperProviderDetailData } from "@/lib/super-admin-data";

function getParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : null;
}

export default async function SuperProviderDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const data = await getSuperProviderDetailData(id);
  if (!data) {
    notFound();
  }
  const message = getParam(query.message);
  const error = getParam(query.error);

  return (
    <DashboardShell title={data.provider.name} eyebrow="Provider detail" section="super">
      <div className="space-y-6">
        {message ? <Toast message={message} variant="success" /> : null}
        {error ? <Toast message={error} variant="error" /> : null}
        <SuperProviderDetailPanel data={data} />
      </div>
    </DashboardShell>
  );
}
