import { Contact2, FileText, ReceiptText } from "lucide-react";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getEmployerReportsPageData } from "@/lib/data";
import { currencyFromCents, formatDate } from "@/lib/utils";

function formatContractRange(start: string | null, end: string | null) {
  if (!start && !end) {
    return "No contract dates on file";
  }

  if (!start) {
    return `Renews ${formatDate(end ?? new Date().toISOString())}`;
  }

  if (!end) {
    return `Started ${formatDate(start)}`;
  }

  return `${formatDate(start)} - ${formatDate(end)}`;
}

export default async function EmployerBillingPage() {
  const data = await getEmployerReportsPageData();

  return (
    <DashboardShell title="Billing" eyebrow="Benefits administration" section="employer">
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-[var(--rose-700)]">Billing & subscription</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">Billing & subscription</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--foreground-muted)]">
                Review plan details, renewal timing, and invoicing status for your Maven Clinic employer contract.
              </p>
            </div>
            <Button type="button" className="h-11 rounded-xl px-5">
              <Contact2 className="mr-2 h-4 w-4" />
              Contact sales
            </Button>
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-[rgba(212,88,123,0.12)] p-3 text-[var(--rose-700)]">
                <ReceiptText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-[var(--foreground-muted)]">Current plan</p>
                <h3 className="mt-2 text-3xl font-semibold tracking-tight">{data.employer.planType || "Enterprise"}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--foreground-muted)]">
                  {data.employer.employeeCount.toLocaleString("en-US")} covered employees - {formatContractRange(data.employer.contractStart, data.employer.contractEnd)}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-[var(--slate-50)] px-4 py-4">
                <p className="text-sm text-[var(--foreground-muted)]">Monthly cost</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">{currencyFromCents(data.employer.monthlyCostCents)}</p>
              </div>
              <div className="rounded-2xl bg-[var(--slate-50)] px-4 py-4">
                <p className="text-sm text-[var(--foreground-muted)]">Contract end</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">{data.employer.contractEnd ? formatDate(data.employer.contractEnd) : "Not set"}</p>
              </div>
              <div className="rounded-2xl bg-[var(--slate-50)] px-4 py-4">
                <p className="text-sm text-[var(--foreground-muted)]">Billing contact</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">{data.userEmail}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-[rgba(61,191,173,0.12)] p-3 text-[var(--teal-700)]">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-[var(--foreground-muted)]">Invoice history</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight">Invoice history</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--foreground-muted)]">
                  No invoices are available yet. Once billing starts, invoice PDFs and payment status will appear here.
                </p>
              </div>
            </div>
            <div className="mt-6 rounded-2xl border border-dashed border-[var(--border)] px-5 py-12 text-center text-sm text-[var(--foreground-muted)]">
              No invoices yet.
            </div>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
