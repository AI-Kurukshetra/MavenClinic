"use client";

import type { Route } from "next";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CircleDot, Filter, Search } from "lucide-react";
import {
  clearTestDataAction,
  createEmployerAction,
  createProviderInvitationAction,
  savePlatformSettingsAction,
  setUserSuspendedAction,
  suspendEmployerAction,
  toggleFeatureFlagAction,
  updateEmployerContractAction,
  updateProviderStatusAction,
  updateUserRoleAction,
} from "@/app/(super)/super/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import type {
  SuperAnalyticsPageData,
  SuperDashboardData,
  SuperEmployerDetailData,
  SuperEmployersPageData,
  SuperFinancialsPageData,
  SuperProviderDetailData,
  SuperProvidersPageData,
  SuperSettingsPageData,
  SuperSystemPageData,
  SuperUsersPageData,
} from "@/lib/super-admin-data";
import { cn } from "@/lib/utils";
const roleBadgeClasses: Record<string, string> = {
  patient: "bg-slate-100 text-slate-700",
  provider: "bg-teal-100 text-teal-700",
  employer_admin: "bg-amber-100 text-amber-700",
  clinic_admin: "bg-rose-100 text-rose-700",
  super_admin: "bg-violet-100 text-violet-700",
  partner: "bg-sky-100 text-sky-700",
};

function InfoList({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <Card key={item.label} className="p-5">
          <p className="text-sm text-[var(--foreground-muted)]">{item.label}</p>
          <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">{item.value}</p>
        </Card>
      ))}
    </div>
  );
}

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="flex h-11 items-center gap-3 rounded-xl border border-[var(--border)] bg-white px-4 text-sm text-slate-500">
      <Search className="h-4 w-4" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-[var(--foreground)] outline-none"
      />
    </label>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <Card className="border-dashed p-8 text-center">
      <p className="text-lg font-semibold text-[var(--foreground)]">{title}</p>
      <p className="mt-2 text-sm leading-7 text-[var(--foreground-muted)]">{body}</p>
    </Card>
  );
}

function ModalShell({ open, title, subtitle, onClose, children }: { open: boolean; title: string; subtitle: string; onClose: () => void; children: React.ReactNode }) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4">
      <div className="w-full max-w-2xl rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-[var(--rose-700)]">Super admin</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h2>
            <p className="mt-2 text-sm leading-7 text-[var(--foreground-muted)]">{subtitle}</p>
          </div>
          <button type="button" className="rounded-full border border-[var(--border)] px-3 py-1 text-sm text-slate-600 hover:bg-slate-50" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

function StatusBadge({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "teal" | "rose" | "amber" | "violet" }) {
  const toneClass = {
    slate: "bg-slate-100 text-slate-700",
    teal: "bg-teal-100 text-teal-700",
    rose: "bg-rose-100 text-rose-700",
    amber: "bg-amber-100 text-amber-700",
    violet: "bg-violet-100 text-violet-700",
  }[tone];

  return <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-medium", toneClass)}>{children}</span>;
}

function SectionHeading({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 text-sm leading-7 text-[var(--foreground-muted)]">{body}</p>
      </div>
      {action}
    </div>
  );
}

function ProviderStatusActionForm({ providerId, redirectTo, status, buttonClassName }: {
  providerId: string;
  redirectTo: string;
  status: "Active and accepting" | "Inactive" | "Suspended";
  buttonClassName: string;
}) {
  const isSuspending = status === "Active and accepting" || status === "Inactive";

  return (
    <form
      action={updateProviderStatusAction}
      onSubmit={(event) => {
        if (!isSuspending) {
          if (!window.confirm("Reactivate this provider?")) {
            event.preventDefault();
          }
          return;
        }

        const reason = window.prompt("Enter a suspension reason for this provider:", "Suspended by super admin")?.trim();
        if (!reason) {
          event.preventDefault();
          return;
        }

        const form = event.currentTarget;
        const input = form.elements.namedItem("suspendedReason");
        if (input instanceof HTMLInputElement) {
          input.value = reason;
        }
      }}
    >
      <input type="hidden" name="providerId" value={providerId} />
      <input type="hidden" name="acceptingPatients" value={isSuspending ? "false" : "true"} />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <input type="hidden" name="suspendedReason" value="" />
      <button type="submit" className={buttonClassName}>
        {isSuspending ? "Suspend" : "Reactivate"}
      </button>
    </form>
  );
}

export function SuperDashboardPanel({ data }: { data: SuperDashboardData }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.stats.platformHealth.map((card) => (
          card.href ? (
            <Link key={card.title} href={card.href as Route}>
              <StatCard title={card.title} value={card.value} delta={card.detail} />
            </Link>
          ) : (
            <StatCard key={card.title} title={card.title} value={card.value} delta={card.detail} />
          )
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.stats.thisMonth.map((card) => (
          card.href ? (
            <Link key={card.title} href={card.href as Route}>
              <StatCard title={card.title} value={card.value} delta={card.detail} />
            </Link>
          ) : (
            <StatCard key={card.title} title={card.title} value={card.value} delta={card.detail} />
          )
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <SectionHeading title="Monthly signups trend" body="Profiles created across the platform over the last 12 months." />
          <div className="mt-6 h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.signupsTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="label" tick={{ fill: "#64748B", fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fill: "#64748B", fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#3DBFAD" strokeWidth={3} dot={{ r: 4, fill: "#3DBFAD" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeading title="Appointments by specialty" body="Visit volume across the highest-traffic specialties." />
          <div className="mt-6 h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.specialtyVolume} layout="vertical" margin={{ left: 12, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis type="number" allowDecimals={false} tick={{ fill: "#64748B", fontSize: 12 }} />
                <YAxis type="category" dataKey="label" tick={{ fill: "#64748B", fontSize: 12 }} width={96} />
                <Tooltip />
                <Bar dataKey="value" radius={[10, 10, 10, 10]} fill="#D4587B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card className="p-6">
          <SectionHeading title="Recent activity" body="A cross-platform timeline of the latest platform events." />
          <div className="mt-6 space-y-4">
            {data.activity.map((item) => (
              <div key={item.id} className="flex items-start gap-4 rounded-2xl border border-[var(--border)] px-4 py-4">
                <div className="mt-1 rounded-full bg-[rgba(61,191,173,0.12)] p-2 text-[var(--teal-700)]">
                  <CircleDot className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[var(--foreground)]">{item.title}</p>
                  <p className="mt-1 text-sm leading-7 text-[var(--foreground-muted)]">{item.detail}</p>
                </div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{item.time}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeading title="System health" body="Phase 4 operational status overview." />
          <div className="mt-6 space-y-4">
            {data.stats.systemHealth.map((item) => (
              <div key={item.label} className="rounded-2xl border border-[var(--border)] px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-medium text-[var(--foreground)]">{item.label}</p>
                  <StatusBadge tone="teal">{item.status}</StatusBadge>
                </div>
                <p className="mt-2 text-sm leading-7 text-[var(--foreground-muted)]">{item.detail}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export function SuperEmployersPanel({ data }: { data: SuperEmployersPageData }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return data.employers.filter((employer) => !normalized || employer.companyName.toLowerCase().includes(normalized) || employer.plan.toLowerCase().includes(normalized));
  }, [data.employers, query]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.stats.map((card) => <StatCard key={card.title} title={card.title} value={card.value} delta={card.detail} />)}
      </div>

      <Card className="p-6">
        <SectionHeading
          title="Employer management"
          body="Review contracts, account health, and sponsor utilization across the employer portfolio."
          action={<Button className="h-11 rounded-xl" onClick={() => setOpen(true)}>Add employer</Button>}
        />
        <div className="mt-4 max-w-sm">
          <SearchInput value={query} onChange={setQuery} placeholder="Search by company or plan" />
        </div>
        {filtered.length ? (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--border)] text-left text-sm">
              <thead className="bg-[var(--slate-50)] text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">
                <tr>
                  <th className="px-4 py-4 font-medium">Company</th>
                  <th className="px-4 py-4 font-medium">Plan</th>
                  <th className="px-4 py-4 font-medium">Employees</th>
                  <th className="px-4 py-4 font-medium">Contract dates</th>
                  <th className="px-4 py-4 font-medium">Status</th>
                  <th className="px-4 py-4 font-medium">MAU</th>
                  <th className="px-4 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filtered.map((employer) => (
                  <tr key={employer.id}>
                    <td className="px-4 py-4">
                      <p className="font-medium text-[var(--foreground)]">{employer.companyName}</p>
                      <p className="text-xs text-[var(--foreground-muted)]">{employer.domain}</p>
                    </td>
                    <td className="px-4 py-4 text-[var(--foreground-muted)]">{employer.plan}</td>
                    <td className="px-4 py-4">{employer.employees}</td>
                    <td className="px-4 py-4 text-[var(--foreground-muted)]">{employer.contractDates}</td>
                    <td className="px-4 py-4"><StatusBadge tone={employer.status === "Active" ? "teal" : employer.status === "Trial" ? "amber" : "rose"}>{employer.status}</StatusBadge></td>
                    <td className="px-4 py-4">{employer.mau}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/super/employers/${employer.id}` as Route} className="inline-flex h-10 items-center rounded-xl border border-[var(--border)] px-4 text-sm font-medium text-slate-600 hover:bg-slate-50">
                          View details
                        </Link>
                        <Link href={`/super/employers/${employer.id}#contract` as Route} className="inline-flex h-10 items-center rounded-xl border border-[var(--border)] px-4 text-sm font-medium text-slate-600 hover:bg-slate-50">
                          Edit contract
                        </Link>
                        <form action={suspendEmployerAction} onSubmit={(event) => { if (!window.confirm(`Expire ${employer.companyName}'s contract now?`)) event.preventDefault(); }}>
                          <input type="hidden" name="employerId" value={employer.id} />
                          <input type="hidden" name="redirectTo" value="/super/employers" />
                          <button type="submit" className="inline-flex h-10 cursor-pointer items-center rounded-xl border border-[rgba(212,88,123,0.22)] px-4 text-sm font-medium text-[var(--rose-700)] hover:bg-rose-50">
                            Suspend
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="mt-6"><EmptyState title="No employers found" body="Try a different search term to find another employer account." /></div>}
      </Card>

      <ModalShell open={open} onClose={() => setOpen(false)} title="Add employer" subtitle="Create a new employer record and immediately invite the first admin.">
        <form action={createEmployerAction} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="redirectTo" value="/super/employers" />
          <label className="grid gap-2 text-sm font-medium text-slate-700"><span>Company name</span><input name="companyName" required className="h-11 rounded-xl border border-[var(--border)] px-4" /></label>
          <label className="grid gap-2 text-sm font-medium text-slate-700"><span>Domain</span><input name="domain" className="h-11 rounded-xl border border-[var(--border)] px-4" placeholder="company.com" /></label>
          <label className="grid gap-2 text-sm font-medium text-slate-700"><span>Employee count</span><input name="employeeCount" type="number" min={1} defaultValue={2500} className="h-11 rounded-xl border border-[var(--border)] px-4" /></label>
          <label className="grid gap-2 text-sm font-medium text-slate-700"><span>Plan type</span><select name="planType" className="h-11 rounded-xl border border-[var(--border)] px-4"><option value="standard">Standard</option><option value="premium">Premium</option><option value="enterprise">Enterprise</option><option value="trial">Trial</option></select></label>
          <label className="grid gap-2 text-sm font-medium text-slate-700"><span>Contract start</span><input name="contractStart" type="date" required className="h-11 rounded-xl border border-[var(--border)] px-4" /></label>
          <label className="grid gap-2 text-sm font-medium text-slate-700"><span>Contract end</span><input name="contractEnd" type="date" required className="h-11 rounded-xl border border-[var(--border)] px-4" /></label>
          <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2"><span>Admin email</span><input name="adminEmail" type="email" required className="h-11 rounded-xl border border-[var(--border)] px-4" /></label>
          <div className="md:col-span-2 flex justify-end"><Button type="submit" className="h-11 rounded-xl">Create employer</Button></div>
        </form>
      </ModalShell>
    </div>
  );
}

export function SuperProvidersPanel({ data }: { data: SuperProvidersPageData }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return data.providers.filter((provider) => !normalized || provider.name.toLowerCase().includes(normalized) || provider.specialty.toLowerCase().includes(normalized));
  }, [data.providers, query]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.stats.map((card) => <StatCard key={card.title} title={card.title} value={card.value} delta={card.detail} />)}
      </div>

      <Card className="p-6">
        <SectionHeading
          title="Provider network"
          body="Manage the platform-wide provider roster, invitation pipeline, and network health."
          action={<Button className="h-11 rounded-xl" onClick={() => setOpen(true)}>Add provider</Button>}
        />
        <div className="mt-4 max-w-sm">
          <SearchInput value={query} onChange={setQuery} placeholder="Search by provider or specialty" />
        </div>
        {filtered.length ? (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--border)] text-left text-sm">
              <thead className="bg-[var(--slate-50)] text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">
                <tr>
                  <th className="px-4 py-4 font-medium">Name</th>
                  <th className="px-4 py-4 font-medium">Specialty</th>
                  <th className="px-4 py-4 font-medium">Status</th>
                  <th className="px-4 py-4 font-medium">Rating</th>
                  <th className="px-4 py-4 font-medium">Patients seen</th>
                  <th className="px-4 py-4 font-medium">Joined</th>
                  <th className="px-4 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filtered.map((provider) => (
                  <tr key={provider.id}>
                    <td className="px-4 py-4 font-medium text-[var(--foreground)]">{provider.name}</td>
                    <td className="px-4 py-4 text-[var(--foreground-muted)]">{provider.specialty}</td>
                    <td className="px-4 py-4"><StatusBadge tone={provider.status === "Active and accepting" ? "teal" : provider.status === "Suspended" ? "rose" : "slate"}>{provider.status}</StatusBadge></td>
                    <td className="px-4 py-4">{provider.rating}</td>
                    <td className="px-4 py-4">{provider.patientsSeen}</td>
                    <td className="px-4 py-4 text-[var(--foreground-muted)]">{provider.joinedDate}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/super/providers/${provider.id}` as Route} className="inline-flex h-10 items-center rounded-xl border border-[var(--border)] px-4 text-sm font-medium text-slate-600 hover:bg-slate-50">
                          View profile
                        </Link>
                        <ProviderStatusActionForm
                          providerId={provider.id}
                          redirectTo="/super/providers"
                          status={provider.status}
                          buttonClassName="inline-flex h-10 cursor-pointer items-center rounded-xl border border-[rgba(212,88,123,0.22)] px-4 text-sm font-medium text-[var(--rose-700)] hover:bg-rose-50"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="mt-6"><EmptyState title="No providers found" body="Try a different search term to find another provider." /></div>}
      </Card>

      <ModalShell open={open} onClose={() => setOpen(false)} title="Invite provider" subtitle="Send a provider invitation and reserve their specialty lane in the network.">
        <form action={createProviderInvitationAction} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="redirectTo" value="/super/providers" />
          <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2"><span>Email</span><input name="email" type="email" required className="h-11 rounded-xl border border-[var(--border)] px-4" /></label>
          <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2"><span>Specialty</span><input name="specialty" required className="h-11 rounded-xl border border-[var(--border)] px-4" placeholder="Fertility" /></label>
          <div className="md:col-span-2 flex justify-end"><Button type="submit" className="h-11 rounded-xl">Send invitation</Button></div>
        </form>
      </ModalShell>
    </div>
  );
}

export function SuperUsersPanel({ data }: { data: SuperUsersPageData }) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return data.users.filter((user) => {
      const matchesQuery = !normalized || user.name.toLowerCase().includes(normalized) || user.email.toLowerCase().includes(normalized);
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus = statusFilter === "all" || user.status === statusFilter;
      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [data.users, query, roleFilter, statusFilter]);

  const selectedUser = data.users.find((user) => user.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {data.stats.map((card) => <StatCard key={card.title} title={card.title} value={card.value} delta={card.detail} />)}
      </div>

      <Card className="p-6">
        <SectionHeading title="Platform users" body="Search, filter, and update user access across every role on the platform." />
        <div className="mt-4 flex flex-col gap-3 lg:flex-row">
          <div className="lg:max-w-sm lg:flex-1"><SearchInput value={query} onChange={setQuery} placeholder="Search by name or email" /></div>
          <label className="flex h-11 items-center gap-3 rounded-xl border border-[var(--border)] bg-white px-4 text-sm text-slate-500">
            <Filter className="h-4 w-4" />
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="bg-transparent text-[var(--foreground)] outline-none">
              <option value="all">All roles</option>
              <option value="patient">Patient</option>
              <option value="provider">Provider</option>
              <option value="employer_admin">Employer admin</option>
              <option value="clinic_admin">Clinic admin</option>
              <option value="super_admin">Super admin</option>
              <option value="partner">Partner</option>
            </select>
          </label>
          <label className="flex h-11 items-center gap-3 rounded-xl border border-[var(--border)] bg-white px-4 text-sm text-slate-500">
            <Filter className="h-4 w-4" />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="bg-transparent text-[var(--foreground)] outline-none">
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </label>
        </div>
        {filtered.length ? (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--border)] text-left text-sm">
              <thead className="bg-[var(--slate-50)] text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">
                <tr>
                  <th className="px-4 py-4 font-medium">Name</th>
                  <th className="px-4 py-4 font-medium">Email</th>
                  <th className="px-4 py-4 font-medium">Role</th>
                  <th className="px-4 py-4 font-medium">Joined</th>
                  <th className="px-4 py-4 font-medium">Last active</th>
                  <th className="px-4 py-4 font-medium">Status</th>
                  <th className="px-4 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filtered.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-4 font-medium text-[var(--foreground)]">{user.name}</td>
                    <td className="px-4 py-4 text-[var(--foreground-muted)]">{user.email}</td>
                    <td className="px-4 py-4"><span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-medium", roleBadgeClasses[user.role] ?? "bg-slate-100 text-slate-700")}>{user.role}</span></td>
                    <td className="px-4 py-4 text-[var(--foreground-muted)]">{user.joinedDate}</td>
                    <td className="px-4 py-4 text-[var(--foreground-muted)]">{user.lastActive}</td>
                    <td className="px-4 py-4"><StatusBadge tone={user.status === "active" ? "teal" : user.status === "suspended" ? "rose" : "slate"}>{user.status}</StatusBadge></td>
                    <td className="px-4 py-4">
                      <button type="button" onClick={() => setSelectedId(user.id)} className="inline-flex h-10 items-center rounded-xl border border-[var(--border)] px-4 text-sm font-medium text-slate-600 hover:bg-slate-50">
                        View profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="mt-6"><EmptyState title="No users found" body="Try a different search or filter combination." /></div>}
      </Card>

      <ModalShell open={Boolean(selectedUser)} onClose={() => setSelectedId(null)} title={selectedUser?.name ?? "User profile"} subtitle="Review profile information, change role access, or suspend the account.">
        {selectedUser ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="p-5"><p className="text-sm text-[var(--foreground-muted)]">Email</p><p className="mt-2 font-medium">{selectedUser.email}</p></Card>
              <Card className="p-5"><p className="text-sm text-[var(--foreground-muted)]">Current role</p><p className="mt-2 font-medium">{selectedUser.role}</p></Card>
              <Card className="p-5"><p className="text-sm text-[var(--foreground-muted)]">Joined</p><p className="mt-2 font-medium">{selectedUser.joinedDate}</p></Card>
              <Card className="p-5"><p className="text-sm text-[var(--foreground-muted)]">Last active</p><p className="mt-2 font-medium">{selectedUser.lastActive}</p></Card>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <form action={updateUserRoleAction} className="rounded-2xl border border-[var(--border)] p-4">
                <input type="hidden" name="userId" value={selectedUser.id} />
                <input type="hidden" name="redirectTo" value="/super/users" />
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  <span>Change role</span>
                  <select name="role" defaultValue={selectedUser.role} className="h-11 rounded-xl border border-[var(--border)] px-4">
                    <option value="patient">Patient</option>
                    <option value="provider">Provider</option>
                    <option value="employer_admin">Employer admin</option>
                    <option value="clinic_admin">Clinic admin</option>
                    <option value="super_admin">Super admin</option>
                    <option value="partner">Partner</option>
                  </select>
                </label>
                <Button type="submit" className="mt-4 h-11 rounded-xl">Save role</Button>
              </form>
              <form action={setUserSuspendedAction} className="rounded-2xl border border-[var(--border)] p-4">
                <input type="hidden" name="userId" value={selectedUser.id} />
                <input type="hidden" name="redirectTo" value="/super/users" />
                <input type="hidden" name="suspended" value={selectedUser.status === "suspended" ? "false" : "true"} />
                <p className="text-sm font-medium text-slate-700">Account controls</p>
                <p className="mt-2 text-sm leading-7 text-[var(--foreground-muted)]">Use this to temporarily suspend or restore access for this user.</p>
                <button type="submit" className="mt-4 inline-flex h-11 cursor-pointer items-center rounded-xl border border-[rgba(212,88,123,0.22)] px-5 text-sm font-medium text-[var(--rose-700)] hover:bg-rose-50">
                  {selectedUser.status === "suspended" ? "Reactivate account" : "Suspend account"}
                </button>
              </form>
            </div>
          </div>
        ) : null}
      </ModalShell>
    </div>
  );
}

export function SuperFinancialsPanel({ data }: { data: SuperFinancialsPageData }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.stats.map((card) => <StatCard key={card.title} title={card.title} value={card.value} delta={card.detail} />)}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-6">
          <SectionHeading title="Revenue trend" body="Estimated recurring revenue versus completed consultation revenue over the last year." />
          <div className="mt-6 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="label" tick={{ fill: "#64748B", fontSize: 12 }} />
                <YAxis tick={{ fill: "#64748B", fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#D4587B" fill="#F4C2D0" name="Subscription revenue" />
                <Area type="monotone" dataKey="secondaryValue" stroke="#3DBFAD" fill="#BEEBE4" name="Consultation revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeading title="Recent transactions" body="The latest completed consultations with estimated fee values." />
          <div className="mt-6 space-y-3">
            {data.transactions.map((transaction) => (
              <div key={transaction.id} className="rounded-2xl border border-[var(--border)] px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-medium text-[var(--foreground)]">{transaction.patientLabel}</p>
                  <p className="text-sm font-medium text-[var(--rose-700)]">{transaction.fee}</p>
                </div>
                <p className="mt-1 text-sm text-[var(--foreground-muted)]">{transaction.providerName} · {transaction.specialty}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{transaction.date}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <SectionHeading title="Employer billing" body="Estimated billing posture for each contracted employer." />
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border)] text-left text-sm">
            <thead className="bg-[var(--slate-50)] text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">
              <tr>
                <th className="px-4 py-4 font-medium">Company</th>
                <th className="px-4 py-4 font-medium">Plan</th>
                <th className="px-4 py-4 font-medium">Employees</th>
                <th className="px-4 py-4 font-medium">Monthly fee</th>
                <th className="px-4 py-4 font-medium">Contract end</th>
                <th className="px-4 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {data.billingRows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-4 font-medium text-[var(--foreground)]">{row.companyName}</td>
                  <td className="px-4 py-4 text-[var(--foreground-muted)]">{row.plan}</td>
                  <td className="px-4 py-4">{row.employees}</td>
                  <td className="px-4 py-4">{row.monthlyFee}</td>
                  <td className="px-4 py-4 text-[var(--foreground-muted)]">{row.contractEnd}</td>
                  <td className="px-4 py-4"><StatusBadge tone={row.status === "Active" ? "teal" : row.status === "Trial" ? "amber" : "rose"}>{row.status}</StatusBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export function SuperAnalyticsPanel({ data }: { data: SuperAnalyticsPageData }) {
  const [tab, setTab] = useState<"overview" | "growth" | "clinical" | "engagement">("overview");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        {(["overview", "growth", "clinical", "engagement"] as const).map((item) => (
          <button key={item} type="button" onClick={() => setTab(item)} className={tab === item ? "rounded-full bg-[var(--rose-500)] px-4 py-2 text-sm font-medium text-white" : "rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"}>
            {item.charAt(0).toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <SectionHeading title="MAU trend" body={`DAU/MAU ratio: ${data.overview.dauMauRatio}`} />
            <div className="mt-6 h-[300px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={data.overview.mauTrend}><CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" /><XAxis dataKey="label" tick={{ fill: "#64748B", fontSize: 12 }} /><YAxis allowDecimals={false} tick={{ fill: "#64748B", fontSize: 12 }} /><Tooltip /><Line type="monotone" dataKey="value" stroke="#3DBFAD" strokeWidth={3} dot={{ r: 4, fill: "#3DBFAD" }} /></LineChart></ResponsiveContainer></div>
          </Card>
          <Card className="p-6">
            <SectionHeading title="Appointment completion" body="Completion rate across the last 12 months." />
            <div className="mt-6 h-[300px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.overview.completionRate}><CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" /><XAxis dataKey="label" tick={{ fill: "#64748B", fontSize: 12 }} /><YAxis allowDecimals={false} tick={{ fill: "#64748B", fontSize: 12 }} /><Tooltip /><Bar dataKey="value" fill="#D4587B" radius={[10, 10, 0, 0]} /></BarChart></ResponsiveContainer></div>
          </Card>
          <Card className="p-6 lg:col-span-2">
            <SectionHeading title="Top specialties by volume" body="Current platform leaders by appointment demand." />
            <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {data.overview.topSpecialties.map((item) => (
                <Card key={item.name} className="p-5"><p className="text-sm text-[var(--foreground-muted)]">{item.name}</p><p className="mt-2 text-2xl font-semibold">{item.value}</p></Card>
              ))}
            </div>
          </Card>
        </div>
      ) : null}

      {tab === "growth" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <SectionHeading title="New users by role" body="Monthly signup distribution across major platform roles." />
            <div className="mt-6 h-[320px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.growth.userGrowth}><CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" /><XAxis dataKey="label" tick={{ fill: "#64748B", fontSize: 12 }} /><YAxis allowDecimals={false} tick={{ fill: "#64748B", fontSize: 12 }} /><Tooltip /><Bar dataKey="patients" stackId="growth" fill="#CBD5E1" /><Bar dataKey="providers" stackId="growth" fill="#3DBFAD" /><Bar dataKey="employers" stackId="growth" fill="#F59E0B" /><Bar dataKey="clinicAdmins" stackId="growth" fill="#D4587B" /><Bar dataKey="partners" stackId="growth" fill="#60A5FA" /></BarChart></ResponsiveContainer></div>
          </Card>
          <Card className="p-6">
            <SectionHeading title="Employer and provider growth" body="Account expansion across employers and provider network." />
            <div className="mt-6 h-[320px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={data.growth.employerGrowth.map((row, index) => ({ ...row, providers: data.growth.providerGrowth[index]?.value ?? 0 }))}><CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" /><XAxis dataKey="label" tick={{ fill: "#64748B", fontSize: 12 }} /><YAxis allowDecimals={false} tick={{ fill: "#64748B", fontSize: 12 }} /><Tooltip /><Line type="monotone" dataKey="value" stroke="#D4587B" strokeWidth={3} name="Employers" /><Line type="monotone" dataKey="providers" stroke="#3DBFAD" strokeWidth={3} name="Providers" /></LineChart></ResponsiveContainer></div>
          </Card>
          <Card className="p-6 lg:col-span-2">
            <SectionHeading title="Top email domains" body="Location data is not captured yet, so domain distribution is used as the current growth proxy." />
            <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {data.growth.domainDistribution.map((item) => (
                <Card key={item.label} className="p-5"><p className="text-sm text-[var(--foreground-muted)]">{item.label}</p><p className="mt-2 text-2xl font-semibold">{item.value}</p></Card>
              ))}
            </div>
          </Card>
        </div>
      ) : null}

      {tab === "clinical" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <SectionHeading title="Appointments by specialty" body="Platform-wide specialty demand across clinical workflows." />
            <div className="mt-6 h-[300px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.clinical.specialtyVolume}><CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" /><XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 12 }} /><YAxis allowDecimals={false} tick={{ fill: "#64748B", fontSize: 12 }} /><Tooltip /><Bar dataKey="value" fill="#D4587B" radius={[10, 10, 0, 0]} /></BarChart></ResponsiveContainer></div>
          </Card>
          <div className="space-y-4">
            <StatCard title="Average appointment duration" value={data.clinical.averageDuration} delta="Estimated from current scheduling defaults" />
            <StatCard title="Care plan completion" value={data.clinical.carePlanCompletionRate} delta="Care plans marked completed" />
          </div>
          <Card className="p-6 lg:col-span-2">
            <SectionHeading title="Most common chief complaints" body="Keyword frequency derived from care plan titles and summaries." />
            <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {data.clinical.chiefComplaints.map((item) => (
                <Card key={item.label} className="p-5"><p className="text-sm text-[var(--foreground-muted)]">{item.label}</p><p className="mt-2 text-2xl font-semibold">{item.value}</p></Card>
              ))}
            </div>
          </Card>
        </div>
      ) : null}

      {tab === "engagement" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <SectionHeading title="Messages sent per month" body={`Average messages per conversation: ${data.engagement.averageMessagesPerConversation}`} />
            <div className="mt-6 h-[300px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={data.engagement.messagesTrend}><CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" /><XAxis dataKey="label" tick={{ fill: "#64748B", fontSize: 12 }} /><YAxis allowDecimals={false} tick={{ fill: "#64748B", fontSize: 12 }} /><Tooltip /><Line type="monotone" dataKey="value" stroke="#3DBFAD" strokeWidth={3} dot={{ r: 4, fill: "#3DBFAD" }} /></LineChart></ResponsiveContainer></div>
          </Card>
          <div className="space-y-4">
            <StatCard title="Symptom log frequency" value={data.engagement.symptomLogFrequency} delta="Across patient accounts with available data" />
            <StatCard title="Cycle tracking adoption" value={data.engagement.cycleTrackingAdoption} delta="Patients with at least one cycle log" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function SuperSystemPanel({ data }: { data: SuperSystemPageData }) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <SectionHeading title="Feature flags" body="Toggle major platform capabilities without touching the deployment pipeline." />
        <div className="mt-6 space-y-4">
          {data.featureFlags.map((flag) => (
            <form key={flag.key} action={toggleFeatureFlagAction} className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
              <input type="hidden" name="key" value={flag.key} />
              <input type="hidden" name="enabled" value={flag.enabled ? "false" : "true"} />
              <input type="hidden" name="redirectTo" value="/super/system" />
              <div>
                <p className="font-medium text-[var(--foreground)]">{flag.label}</p>
                <p className="mt-1 text-sm leading-7 text-[var(--foreground-muted)]">{flag.description}</p>
              </div>
              <button type="submit" className={flag.enabled ? "inline-flex h-11 cursor-pointer items-center rounded-xl bg-[var(--rose-500)] px-5 text-sm font-medium text-white" : "inline-flex h-11 cursor-pointer items-center rounded-xl border border-[var(--border)] px-5 text-sm font-medium text-slate-600 hover:bg-slate-50"}>
                {flag.enabled ? "On" : "Off"}
              </button>
            </form>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <SectionHeading title="Platform configuration" body="Read-only environment details for operational review." />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {data.environmentCards.map((item) => <Card key={item.label} className="p-5"><p className="text-sm text-[var(--foreground-muted)]">{item.label}</p><p className="mt-2 break-all text-lg font-semibold text-[var(--foreground)]">{item.value}</p></Card>)}
        </div>
      </Card>

      {data.isDevelopment ? (
        <Card className="border-[rgba(212,88,123,0.22)] p-6">
          <SectionHeading title="Danger zone" body="These controls are only available in development environments." />
          <form action={clearTestDataAction} className="mt-6 max-w-xl space-y-4">
            <input type="hidden" name="redirectTo" value="/super/system" />
            <label className="grid gap-2 text-sm font-medium text-slate-700"><span>Type DELETE to confirm</span><input name="confirmation" required className="h-11 rounded-xl border border-[rgba(212,88,123,0.22)] px-4" /></label>
            <button type="submit" className="inline-flex h-11 cursor-pointer items-center rounded-xl border border-[rgba(212,88,123,0.22)] px-5 text-sm font-medium text-[var(--rose-700)] hover:bg-rose-50">Clear all test data</button>
          </form>
        </Card>
      ) : null}
    </div>
  );
}

export function SuperSettingsPanel({ data }: { data: SuperSettingsPageData }) {
  return (
    <div className="space-y-6">
      <form action={savePlatformSettingsAction} className="space-y-6">
        <input type="hidden" name="redirectTo" value="/super/settings" />
        <Card className="p-6">
          <SectionHeading title="General settings" body="Core defaults for the platform experience and operational support." />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-slate-700"><span>Platform name</span><input name="platformName" defaultValue={data.general.platformName} className="h-11 rounded-xl border border-[var(--border)] px-4" /></label>
            <label className="grid gap-2 text-sm font-medium text-slate-700"><span>Support email</span><input name="supportEmail" type="email" defaultValue={data.general.supportEmail} className="h-11 rounded-xl border border-[var(--border)] px-4" /></label>
            <label className="grid gap-2 text-sm font-medium text-slate-700"><span>Default timezone</span><input name="defaultTimezone" defaultValue={data.general.defaultTimezone} className="h-11 rounded-xl border border-[var(--border)] px-4" /></label>
            <label className="grid gap-2 text-sm font-medium text-slate-700"><span>Default language</span><input name="defaultLanguage" defaultValue={data.general.defaultLanguage} className="h-11 rounded-xl border border-[var(--border)] px-4" /></label>
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeading title="Notification settings" body="Configure where system alerts and daily operational digests are sent." />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-slate-700"><span>System alert email</span><input name="systemAlertEmail" type="email" defaultValue={data.notifications.systemAlertEmail} className="h-11 rounded-xl border border-[var(--border)] px-4" /></label>
            <label className="grid gap-2 text-sm font-medium text-slate-700"><span>Daily report recipient</span><input name="dailyReportRecipient" type="email" defaultValue={data.notifications.dailyReportRecipient} className="h-11 rounded-xl border border-[var(--border)] px-4" /></label>
            <label className="flex items-center justify-between rounded-2xl border border-[var(--border)] px-4 py-3 text-sm font-medium text-slate-700"><span>New employer notification</span><input type="hidden" name="notifyNewEmployer" value="false" /><input type="checkbox" name="notifyNewEmployer" value="true" defaultChecked={data.notifications.notifyNewEmployer} className="h-4 w-4" /></label>
            <label className="flex items-center justify-between rounded-2xl border border-[var(--border)] px-4 py-3 text-sm font-medium text-slate-700"><span>New provider notification</span><input type="hidden" name="notifyNewProvider" value="false" /><input type="checkbox" name="notifyNewProvider" value="true" defaultChecked={data.notifications.notifyNewProvider} className="h-4 w-4" /></label>
            <label className="flex items-center justify-between rounded-2xl border border-[var(--border)] px-4 py-3 text-sm font-medium text-slate-700 md:col-span-2"><span>Daily report email</span><input type="hidden" name="dailyReportEmailEnabled" value="false" /><input type="checkbox" name="dailyReportEmailEnabled" value="true" defaultChecked={data.notifications.dailyReportEmailEnabled} className="h-4 w-4" /></label>
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeading title="Security settings" body="Read-only security posture aligned to the current production architecture." />
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {data.security.map((item) => <Card key={item.label} className="p-5"><p className="text-sm text-[var(--foreground-muted)]">{item.label}</p><p className="mt-2 text-lg font-semibold text-[var(--foreground)]">{item.value}</p></Card>)}
          </div>
        </Card>

        <div className="flex justify-end"><Button type="submit" className="h-11 rounded-xl">Save settings</Button></div>
      </form>
    </div>
  );
}

export function SuperEmployerDetailPanel({ data }: { data: SuperEmployerDetailData }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Covered employees" value={String(data.employer.coveredEmployees)} delta="Seats included under contract" />
        <StatCard title="Monthly active employees" value={String(data.employer.mau)} delta={`Utilization rate ${data.employer.utilizationRate}`} />
        <StatCard title="Total visits" value={String(data.employer.totalVisits)} delta="Appointments used by this employer" />
        <StatCard title="Estimated monthly fee" value={data.employer.monthlyFee} delta={data.employer.plan} />
      </div>

      <Card id="contract" className="p-6">
        <SectionHeading title={data.employer.companyName} body="Contract overview, sponsor contacts, and current utilization posture." />
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-4">
            <Card className="p-5"><p className="text-sm text-[var(--foreground-muted)]">Domain</p><p className="mt-2 text-lg font-semibold">{data.employer.domain}</p></Card>
            <Card className="p-5"><p className="text-sm text-[var(--foreground-muted)]">Status</p><p className="mt-2"><StatusBadge tone={data.employer.status === "Active" ? "teal" : data.employer.status === "Trial" ? "amber" : "rose"}>{data.employer.status}</StatusBadge></p></Card>
            <Card className="p-5"><p className="text-sm text-[var(--foreground-muted)]">Contract dates</p><p className="mt-2 text-lg font-semibold">{data.employer.contractDates}</p></Card>
          </div>
          <form action={updateEmployerContractAction} className="grid gap-4 rounded-[28px] border border-[var(--border)] p-5">
            <input type="hidden" name="employerId" value={data.employer.id} />
            <input type="hidden" name="redirectTo" value={`/super/employers/${data.employer.id}`} />
            <label className="grid gap-2 text-sm font-medium text-slate-700"><span>Employee count</span><input name="employeeCount" type="number" min={1} defaultValue={data.employer.coveredEmployees} className="h-11 rounded-xl border border-[var(--border)] px-4" /></label>
            <label className="grid gap-2 text-sm font-medium text-slate-700"><span>Plan type</span><select name="planType" defaultValue={data.employer.plan.toLowerCase()} className="h-11 rounded-xl border border-[var(--border)] px-4"><option value="standard">Standard</option><option value="premium">Premium</option><option value="enterprise">Enterprise</option><option value="trial">Trial</option></select></label>
            <label className="grid gap-2 text-sm font-medium text-slate-700"><span>Contract start</span><input name="contractStart" type="date" defaultValue={data.employer.contractStart ?? ""} className="h-11 rounded-xl border border-[var(--border)] px-4" /></label>
            <label className="grid gap-2 text-sm font-medium text-slate-700"><span>Contract end</span><input name="contractEnd" type="date" defaultValue={data.employer.contractEnd ?? ""} className="h-11 rounded-xl border border-[var(--border)] px-4" /></label>
            <Button type="submit" className="h-11 rounded-xl">Save contract</Button>
          </form>
        </div>
      </Card>

      <InfoList items={data.utilization} />
      <InfoList items={data.billing} />

      <Card className="p-6">
        <SectionHeading title="Employer admins" body="Administrators currently mapped to this employer account." />
        <div className="mt-6 space-y-3">
          {data.admins.length ? data.admins.map((admin) => (
            <div key={admin.id} className="rounded-2xl border border-[var(--border)] px-4 py-4">
              <p className="font-medium text-[var(--foreground)]">{admin.name}</p>
              <p className="mt-1 text-sm text-[var(--foreground-muted)]">{admin.email}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">Joined {admin.joined}</p>
            </div>
          )) : <EmptyState title="No employer admins yet" body="Invite an employer admin from the main employers page to assign ownership." />}
        </div>
      </Card>
    </div>
  );
}

export function SuperProviderDetailPanel({ data }: { data: SuperProviderDetailData }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Rating" value={data.provider.rating} delta={`${data.provider.reviews} reviews`} />
        <StatCard title="Consultations" value={String(data.provider.consultations)} delta="Appointments completed or scheduled" />
        <StatCard title="Patients seen" value={String(data.provider.patientsSeen)} delta="Unique patients linked to this provider" />
        <StatCard title="Status" value={data.provider.status} delta={`Joined ${data.provider.joinedDate}`} />
      </div>
      <Card className="p-6">
        <SectionHeading title={data.provider.name} body={data.provider.bio} action={<ProviderStatusActionForm providerId={data.provider.id} redirectTo={`/super/providers/${data.provider.id}`} status={data.provider.status as "Active and accepting" | "Inactive" | "Suspended"} buttonClassName="inline-flex h-11 cursor-pointer items-center rounded-xl border border-[rgba(212,88,123,0.22)] px-5 text-sm font-medium text-[var(--rose-700)] hover:bg-rose-50" />} />
        {data.provider.suspendedReason ? <p className="mt-3 text-sm text-[var(--rose-700)]">Suspension reason: {data.provider.suspendedReason}</p> : null}
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6"><SectionHeading title="Availability" body="Current open availability blocks for this provider." /><div className="mt-6 space-y-3">{data.availability.length ? data.availability.map((item) => <div key={item.id} className="rounded-2xl border border-[var(--border)] px-4 py-4"><p className="font-medium text-[var(--foreground)]">{item.label}</p><p className="mt-1 text-sm text-[var(--foreground-muted)]">{item.detail}</p></div>) : <EmptyState title="No availability yet" body="This provider has not opened any recurring availability windows." />}</div></Card>
        <Card className="p-6"><SectionHeading title="Patients" body="Patients who have had at least one appointment with this provider." /><div className="mt-6 space-y-3">{data.patients.length ? data.patients.map((item) => <div key={item.id} className="rounded-2xl border border-[var(--border)] px-4 py-4 font-medium text-[var(--foreground)]">{item.name}</div>) : <EmptyState title="No patients yet" body="This provider does not have linked patients yet." />}</div></Card>
      </div>
      <Card className="p-6"><SectionHeading title="Appointment history" body="Recent appointment activity for this provider." /><div className="mt-6 overflow-x-auto"><table className="min-w-full divide-y divide-[var(--border)] text-left text-sm"><thead className="bg-[var(--slate-50)] text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]"><tr><th className="px-4 py-4 font-medium">Patient</th><th className="px-4 py-4 font-medium">Scheduled at</th><th className="px-4 py-4 font-medium">Status</th><th className="px-4 py-4 font-medium">Type</th></tr></thead><tbody className="divide-y divide-[var(--border)]">{data.appointments.map((item) => <tr key={item.id}><td className="px-4 py-4 font-medium text-[var(--foreground)]">{item.patientName}</td><td className="px-4 py-4 text-[var(--foreground-muted)]">{item.scheduledAt}</td><td className="px-4 py-4">{item.status}</td><td className="px-4 py-4 text-[var(--foreground-muted)]">{item.type}</td></tr>)}</tbody></table></div></Card>
    </div>
  );
}





