"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { BarChart3, Download, FileText, HeartPulse, ShieldCheck, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Toast } from "@/components/ui/Toast";
import { currencyFromCents, formatDate } from "@/lib/utils";

type ReportRow = {
  month: string;
  monthLabel: string;
  specialty: string;
  visitCount: number;
  completionRate: number;
};

type Props = {
  userEmail: string;
  employer: {
    companyName: string;
    employeeCount: number;
    planType: string;
    contractStart: string | null;
    contractEnd: string | null;
    monthlyCostCents: number;
  };
  summary: {
    totalVisitsThisMonth: number;
    totalVisitsThisYear: number;
    mostUsedSpecialty: string;
    averageSatisfaction: number;
  };
  reportRows: ReportRow[];
};

type ReportType = "utilization" | "outcomes" | "roi" | "engagement";
type ReportPeriod = "30d" | "90d" | "6m" | "12m" | "custom";

type ReportConfig = {
  period: ReportPeriod;
  customStart: string;
  customEnd: string;
};

type RecentDownload = {
  reportType: ReportType;
  reportLabel: string;
  period: ReportPeriod;
  customStart: string;
  customEnd: string;
  generatedAt: string;
};

type ScheduledPreference = {
  enabled: boolean;
  email: string;
};

type ToastState = {
  message: string;
  variant: "success" | "error" | "info";
};

const storageKeys = {
  recentDownloads: "maven-employer-recent-downloads",
  scheduledReports: "maven-employer-scheduled-reports",
} as const;

const periodOptions: Array<{ value: ReportPeriod; label: string }> = [
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "6m", label: "Last 6 months" },
  { value: "12m", label: "Last 12 months" },
  { value: "custom", label: "Custom range" },
];

const reportDefinitions: Array<{
  key: ReportType;
  title: string;
  description: string;
  icon: typeof BarChart3;
  accentClass: string;
}> = [
  {
    key: "utilization",
    title: "Utilization report",
    description: "Monthly breakdown of appointments, specialties used, and visit completion rates",
    icon: BarChart3,
    accentClass: "bg-[rgba(61,191,173,0.12)] text-[var(--teal-700)]",
  },
  {
    key: "outcomes",
    title: "Health outcomes report",
    description: "Aggregated health trends and care plan completion rates across your employee population",
    icon: HeartPulse,
    accentClass: "bg-[rgba(212,88,123,0.12)] text-[var(--rose-700)]",
  },
  {
    key: "roi",
    title: "ROI & cost savings report",
    description: "Estimated healthcare cost savings, ER deflection metrics, and benefit utilization ROI",
    icon: TrendingUp,
    accentClass: "bg-[rgba(61,191,173,0.12)] text-[var(--teal-700)]",
  },
  {
    key: "engagement",
    title: "Employee engagement report",
    description: "Platform adoption rates, active users trend, and feature usage breakdown",
    icon: Users,
    accentClass: "bg-[rgba(212,88,123,0.12)] text-[var(--rose-700)]",
  },
];

const defaultConfig: ReportConfig = {
  period: "30d",
  customStart: "",
  customEnd: "",
};

function subscribeToStorage(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handler = () => onStoreChange();
  window.addEventListener("storage", handler);

  return () => {
    window.removeEventListener("storage", handler);
  };
}

function getStorageSnapshot(key: string) {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(key) ?? "";
}

function parseRecentDownloads(value: string): RecentDownload[] {
  if (!value) {
    return [];
  }

  try {
    return (JSON.parse(value) as RecentDownload[]).slice(0, 5);
  } catch {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(storageKeys.recentDownloads);
    }
    return [];
  }
}

function parseScheduledPreference(value: string, userEmail: string): ScheduledPreference {
  if (!value) {
    return { enabled: false, email: userEmail };
  }

  try {
    const parsed = JSON.parse(value) as ScheduledPreference;
    return {
      enabled: Boolean(parsed.enabled),
      email: parsed.email || userEmail,
    };
  } catch {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(storageKeys.scheduledReports);
    }
    return { enabled: false, email: userEmail };
  }
}

function getPeriodStart(period: ReportPeriod) {
  const now = new Date();

  switch (period) {
    case "30d":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case "90d":
      return new Date(now.getFullYear(), now.getMonth() - 2, 1);
    case "6m":
      return new Date(now.getFullYear(), now.getMonth() - 5, 1);
    case "12m":
      return new Date(now.getFullYear(), now.getMonth() - 11, 1);
    default:
      return null;
  }
}

function parseMonthKey(month: string) {
  const [year, monthValue] = month.split("-").map(Number);
  return new Date(year, (monthValue || 1) - 1, 1);
}

function filterRows(rows: ReportRow[], config: ReportConfig) {
  if (config.period === "custom" && config.customStart && config.customEnd) {
    const start = new Date(config.customStart);
    const end = new Date(config.customEnd);

    return rows.filter((row) => {
      const value = parseMonthKey(row.month);
      return value >= start && value <= end;
    });
  }

  const start = getPeriodStart(config.period);
  if (!start) {
    return rows;
  }

  return rows.filter((row) => parseMonthKey(row.month) >= start);
}

function buildCsv(rows: ReportRow[]) {
  const header = ["Month", "Specialty", "Visit count", "Completion rate"];
  const lines = rows.map((row) => [row.monthLabel, row.specialty, String(row.visitCount), `${row.completionRate}%`]);

  return [header, ...lines]
    .map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\n");
}

function formatPeriodLabel(config: ReportConfig) {
  const option = periodOptions.find((item) => item.value === config.period);

  if (config.period === "custom" && config.customStart && config.customEnd) {
    return `${formatDate(config.customStart)} to ${formatDate(config.customEnd)}`;
  }

  return option?.label ?? "Custom range";
}

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

export function EmployerReportsPageClient({ userEmail, employer, summary, reportRows }: Props) {
  const [configs, setConfigs] = useState<Record<ReportType, ReportConfig>>({
    utilization: defaultConfig,
    outcomes: defaultConfig,
    roi: defaultConfig,
    engagement: defaultConfig,
  });
  const [recentDownloadsOverride, setRecentDownloadsOverride] = useState<string | null>(null);
  const [scheduledPreferenceDraft, setScheduledPreferenceDraft] = useState<ScheduledPreference | null>(null);
  const [pdfNoticeFor, setPdfNoticeFor] = useState<ReportType | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const recentDownloadsSnapshot = useSyncExternalStore(
    subscribeToStorage,
    () => getStorageSnapshot(storageKeys.recentDownloads),
    () => "",
  );
  const scheduledPreferenceSnapshot = useSyncExternalStore(
    subscribeToStorage,
    () => getStorageSnapshot(storageKeys.scheduledReports),
    () => "",
  );

  const visibleRecentDownloads = useMemo(
    () => parseRecentDownloads(recentDownloadsOverride ?? recentDownloadsSnapshot),
    [recentDownloadsOverride, recentDownloadsSnapshot],
  );
  const activeScheduledPreference = useMemo(
    () => scheduledPreferenceDraft ?? parseScheduledPreference(scheduledPreferenceSnapshot, userEmail),
    [scheduledPreferenceDraft, scheduledPreferenceSnapshot, userEmail],
  );
  const filteredData = useMemo(() => {
    return {
      utilization: filterRows(reportRows, configs.utilization),
      outcomes: filterRows(reportRows, configs.outcomes),
      roi: filterRows(reportRows, configs.roi),
      engagement: filterRows(reportRows, configs.engagement),
    };
  }, [configs, reportRows]);

  function persistDownloads(next: RecentDownload[]) {
    const serialized = JSON.stringify(next);
    setRecentDownloadsOverride(serialized);
    window.localStorage.setItem(storageKeys.recentDownloads, serialized);
  }

  function updateConfig(key: ReportType, patch: Partial<ReportConfig>) {
    setConfigs((current) => ({
      ...current,
      [key]: {
        ...current[key],
        ...patch,
      },
    }));
  }

  function downloadCsv(reportType: ReportType, configOverride?: ReportConfig) {
    const config = configOverride ?? configs[reportType];
    const rows = filterRows(reportRows, config);
    const csv = buildCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const filename = `maven-clinic-${reportType}-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);

    const reportLabel = reportDefinitions.find((definition) => definition.key === reportType)?.title ?? reportType;
    const nextDownloads = [
      {
        reportType,
        reportLabel,
        period: config.period,
        customStart: config.customStart,
        customEnd: config.customEnd,
        generatedAt: new Date().toISOString(),
      },
      ...visibleRecentDownloads,
    ].slice(0, 5);

    persistDownloads(nextDownloads);
    setToast({ message: `${reportLabel} downloaded as CSV.`, variant: "success" });
  }

  function handlePdf(reportType: ReportType) {
    const reportLabel = reportDefinitions.find((definition) => definition.key === reportType)?.title ?? reportType;
    setPdfNoticeFor(reportType);
    setToast({ message: `${reportLabel}: PDF generation coming soon.`, variant: "info" });
  }

  function saveScheduledReports() {
    const serialized = JSON.stringify(activeScheduledPreference);
    setScheduledPreferenceDraft(activeScheduledPreference);
    window.localStorage.setItem(storageKeys.scheduledReports, serialized);
    setToast({ message: "Scheduled report preferences saved.", variant: "success" });
  }

  return (
    <div className="space-y-6">
      {toast ? <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} /> : null}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="max-w-2xl text-sm leading-7 text-[var(--foreground-muted)]">
            Download and review utilization reports for your covered employees.
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs font-medium text-[var(--foreground-muted)]">
            <span className="rounded-full bg-[var(--slate-50)] px-3 py-1.5">{employer.companyName}</span>
            <span className="rounded-full bg-[var(--slate-50)] px-3 py-1.5">{employer.planType}</span>
            <span className="rounded-full bg-[var(--slate-50)] px-3 py-1.5">{formatContractRange(employer.contractStart, employer.contractEnd)}</span>
          </div>
        </div>
        <Button type="button" className="h-11 rounded-xl px-5" onClick={() => downloadCsv("utilization")}>
          <Download className="mr-2 h-4 w-4" />
          Generate report
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5">
          <p className="text-sm text-[var(--foreground-muted)]">Total visits this month</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{summary.totalVisitsThisMonth}</p>
          <p className="mt-2 text-sm text-[var(--teal-700)]">Completed and scheduled employee visits this month</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-[var(--foreground-muted)]">Total visits this year</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{summary.totalVisitsThisYear}</p>
          <p className="mt-2 text-sm text-[var(--teal-700)]">All employee appointments booked in the current year</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-[var(--foreground-muted)]">Most used specialty</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{summary.mostUsedSpecialty}</p>
          <p className="mt-2 text-sm text-[var(--teal-700)]">Based on the highest appointment volume across covered employees</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-[var(--foreground-muted)]">Average satisfaction</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {summary.averageSatisfaction.toFixed(1)} <span className="text-amber-400">{"\u2605"}</span>
          </p>
          <p className="mt-2 text-sm text-[var(--teal-700)]">Based on post-visit surveys</p>
        </Card>
      </div>

      <section className="space-y-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--rose-700)]">Available reports</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Available reports</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {reportDefinitions.map((report) => {
            const Icon = report.icon;
            const config = configs[report.key];
            const activeRows = filteredData[report.key];
            return (
              <Card key={report.key} className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`rounded-2xl p-3 ${report.accentClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold tracking-tight">{report.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-[var(--foreground-muted)]">{report.description}</p>
                  </div>
                </div>
                <div className="mt-6 space-y-4">
                  <label className="block space-y-2 text-sm font-medium text-[var(--foreground)]">
                    <span>Reporting period</span>
                    <select
                      value={config.period}
                      onChange={(event) => updateConfig(report.key, { period: event.target.value as ReportPeriod })}
                      className="h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm outline-none transition focus:border-[var(--rose-300)] focus:ring-2 focus:ring-[rgba(232,125,155,0.2)]"
                    >
                      {periodOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  {config.period === "custom" ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block space-y-2 text-sm font-medium text-[var(--foreground)]">
                        <span>Start date</span>
                        <input
                          type="date"
                          value={config.customStart}
                          onChange={(event) => updateConfig(report.key, { customStart: event.target.value })}
                          className="h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm outline-none transition focus:border-[var(--rose-300)] focus:ring-2 focus:ring-[rgba(232,125,155,0.2)]"
                        />
                      </label>
                      <label className="block space-y-2 text-sm font-medium text-[var(--foreground)]">
                        <span>End date</span>
                        <input
                          type="date"
                          value={config.customEnd}
                          onChange={(event) => updateConfig(report.key, { customEnd: event.target.value })}
                          className="h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm outline-none transition focus:border-[var(--rose-300)] focus:ring-2 focus:ring-[rgba(232,125,155,0.2)]"
                        />
                      </label>
                    </div>
                  ) : null}

                  <div className="rounded-2xl bg-[var(--slate-50)] px-4 py-3 text-sm text-[var(--foreground-muted)]">
                    {activeRows.length ? `${activeRows.length} monthly data rows ready for export.` : "No report rows found for the selected period."}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button type="button" className="h-11 rounded-xl px-5" onClick={() => downloadCsv(report.key)}>
                      <Download className="mr-2 h-4 w-4" />
                      Download CSV
                    </Button>
                    <Button type="button" variant="secondary" className="h-11 rounded-xl px-5" onClick={() => handlePdf(report.key)}>
                      <FileText className="mr-2 h-4 w-4" />
                      Download PDF
                    </Button>
                  </div>

                  {pdfNoticeFor === report.key ? (
                    <div className="rounded-2xl border border-[rgba(61,191,173,0.18)] bg-[rgba(61,191,173,0.08)] px-4 py-3 text-sm text-[var(--foreground)]">
                      PDF generation is coming soon. Use CSV for exports today.
                    </div>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Card className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-[var(--rose-700)]">Recent downloads</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Recent downloads</h2>
            </div>
            <div className="rounded-full bg-[var(--slate-50)] px-3 py-1 text-sm text-[var(--foreground-muted)]">
              {visibleRecentDownloads.length} saved
            </div>
          </div>

          {visibleRecentDownloads.length ? (
            <div className="mt-6 space-y-3">
              {visibleRecentDownloads.map((item) => (
                <div key={`${item.reportType}-${item.generatedAt}`} className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-[var(--foreground)]">{item.reportLabel}</p>
                    <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                      {formatPeriodLabel({ period: item.period, customStart: item.customStart, customEnd: item.customEnd })}
                      <span className="mx-1">{"\u00B7"}</span>
                      {formatDate(item.generatedAt, "MMM d, yyyy h:mm a")}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-10 rounded-xl px-4"
                    onClick={() =>
                      downloadCsv(item.reportType, {
                        period: item.period,
                        customStart: item.customStart,
                        customEnd: item.customEnd,
                      })
                    }
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download again
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-[var(--border)] px-5 py-10 text-center">
              <p className="text-lg font-semibold tracking-tight">No downloads yet</p>
              <p className="mt-2 text-sm leading-7 text-[var(--foreground-muted)]">
                Generate a CSV report to keep a quick-access history here.
              </p>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--rose-700)]">Scheduled reports</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Scheduled reports</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--foreground-muted)]">
            Turn on monthly utilization summaries for your benefits team.
          </p>

          <div className="mt-6 space-y-4">
            <label className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--border)] px-4 py-4">
              <div>
                <p className="font-medium text-[var(--foreground)]">Send monthly utilization report</p>
                <p className="mt-1 text-sm text-[var(--foreground-muted)]">Email a summary at the start of each month.</p>
              </div>
              <input
                type="checkbox"
                checked={activeScheduledPreference.enabled}
                onChange={(event) => {
                  setScheduledPreferenceDraft({
                    ...activeScheduledPreference,
                    enabled: event.target.checked,
                  });
                }}
                className="h-5 w-5 rounded border-[var(--border)] text-[var(--rose-500)] focus:ring-[rgba(232,125,155,0.2)]"
              />
            </label>

            <label className="block space-y-2 text-sm font-medium text-[var(--foreground)]">
              <span>Delivery email</span>
              <input
                type="email"
                value={activeScheduledPreference.email}
                onChange={(event) => {
                  setScheduledPreferenceDraft({
                    ...activeScheduledPreference,
                    email: event.target.value,
                  });
                }}
                className="h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm outline-none transition focus:border-[var(--rose-300)] focus:ring-2 focus:ring-[rgba(232,125,155,0.2)]"
              />
            </label>

            <Button type="button" className="h-11 rounded-xl px-5" onClick={saveScheduledReports}>
              Save preferences
            </Button>
          </div>
        </Card>
      </div>

      <Card className="border-[rgba(46,168,152,0.18)] bg-[rgba(46,168,152,0.08)] p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-white/80 p-3 text-[var(--teal-700)]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--foreground)]">Current plan spend</p>
            <p className="mt-1 text-sm leading-6 text-[var(--foreground-muted)]">
              {currencyFromCents(employer.monthlyCostCents)} / month for {employer.employeeCount.toLocaleString("en-US")} covered employees.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
