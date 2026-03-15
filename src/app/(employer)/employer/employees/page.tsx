import { DashboardShell } from "@/components/health/dashboard-shell";
import { EmployerEmployeesTable } from "@/components/health/employer-employees-table";
import { getEmployerEmployeesPageData } from "@/lib/data";

function normalizePage(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export default async function EmployerEmployeesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = normalizePage(params.page);
  const data = await getEmployerEmployeesPageData(page, 20);

  return (
    <DashboardShell title="Employees" eyebrow="Benefits administration" section="employer">
      <EmployerEmployeesTable
        employerName={data.employerName}
        employees={data.employees}
        page={data.page}
        totalPages={data.totalPages}
        totalEmployees={data.totalEmployees}
        message={typeof params.message === "string" ? params.message : undefined}
        error={typeof params.error === "string" ? params.error : undefined}
        warning={typeof params.warning === "string" ? params.warning : undefined}
      />
    </DashboardShell>
  );
}

