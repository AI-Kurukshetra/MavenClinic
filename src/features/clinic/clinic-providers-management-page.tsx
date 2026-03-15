"use client";

import type { Route } from "next";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CheckCircle2, Filter, Search, ShieldAlert, UserRoundCheck, UserRoundMinus, XCircle } from "lucide-react";
import { approveProviderAction, reactivateProviderAction, rejectProviderAction, suspendProviderAction } from "@/app/(clinic)/clinic/actions";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { ClinicManagedProvider, ClinicPendingApproval } from "@/lib/clinic-provider-approvals";
import { cn } from "@/lib/utils";

type Props = {
  providers: ClinicManagedProvider[];
  pendingApprovals: ClinicPendingApproval[];
  pendingCount: number;
};

function getStatusVariant(status: ClinicManagedProvider["status"]) {
  if (status === "Active and accepting") return "success" as const;
  if (status === "Pending approval") return "warning" as const;
  if (status === "Rejected" || status === "Suspended") return "warning" as const;
  return "neutral" as const;
}

export function ClinicProvidersManagementPage({ providers, pendingApprovals, pendingCount }: Props) {
  const [tab, setTab] = useState<"all" | "pending">("all");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive" | "pending" | "suspended" | "rejected">("all");
  const [selectedProvider, setSelectedProvider] = useState<ClinicManagedProvider | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [rejectingProvider, setRejectingProvider] = useState<ClinicPendingApproval | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const filteredProviders = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return providers.filter((provider) => {
      const matchesQuery = !normalized || provider.name.toLowerCase().includes(normalized) || provider.specialty.toLowerCase().includes(normalized) || provider.email.toLowerCase().includes(normalized);
      const matchesFilter = filter === "all"
        || (filter === "active" && provider.status === "Active and accepting")
        || (filter === "inactive" && provider.status === "Inactive")
        || (filter === "pending" && provider.status === "Pending approval")
        || (filter === "suspended" && provider.status === "Suspended")
        || (filter === "rejected" && provider.status === "Rejected");
      return matchesQuery && matchesFilter;
    });
  }, [filter, providers, query]);

  const filteredPending = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return pendingApprovals.filter((provider) => !normalized || provider.name.toLowerCase().includes(normalized) || provider.specialty.toLowerCase().includes(normalized) || provider.email.toLowerCase().includes(normalized));
  }, [pendingApprovals, query]);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-[var(--rose-700)]">Providers</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Provider roster and approvals</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setTab("all")} className={cn("rounded-full px-4 py-2 text-sm font-medium transition", tab === "all" ? "bg-[var(--rose-500)] text-white" : "border border-[var(--border)] bg-white text-slate-600 hover:bg-slate-50")}>All providers</button>
            <button type="button" onClick={() => setTab("pending")} className={cn("inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition", tab === "pending" ? "bg-[var(--rose-500)] text-white" : "border border-[var(--border)] bg-white text-slate-600 hover:bg-slate-50")}>
              Pending approval
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", tab === "pending" ? "bg-white/20 text-white" : "bg-[rgba(248,191,91,0.18)] text-[var(--amber-700)]")}>{pendingCount}</span>
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={tab === "pending" ? "Search pending providers" : "Search by name, email, or specialty"} className="h-11 w-full rounded-xl border border-[var(--border)] bg-white pl-11 pr-4 text-sm outline-none transition focus:border-[var(--rose-300)]" />
          </label>
          {tab === "all" ? (
            <label className="flex h-11 items-center gap-3 rounded-xl border border-[var(--border)] bg-white px-4 text-sm text-[var(--foreground-muted)]">
              <Filter className="h-4 w-4" />
              <select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} className="bg-transparent text-[var(--foreground)] outline-none">
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
                <option value="rejected">Rejected</option>
              </select>
            </label>
          ) : null}
        </div>
      </Card>

      {tab === "pending" ? (
        filteredPending.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {filteredPending.map((provider) => (
              <Card key={provider.id} className="space-y-4 p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-[var(--amber-700)]">Pending approval</p>
                    <h3 className="mt-2 text-xl font-semibold tracking-tight">{provider.name}</h3>
                    <p className="mt-1 text-sm text-[var(--foreground-muted)]">{provider.email}</p>
                  </div>
                  <Badge variant="warning">Pending</Badge>
                </div>
                <div className="grid gap-3 text-sm text-[var(--foreground-muted)]">
                  <p><span className="font-medium text-[var(--foreground)]">Specialty:</span> {provider.specialty}</p>
                  <p><span className="font-medium text-[var(--foreground)]">License:</span> {provider.licenseNumber ?? "Not provided"}</p>
                  <p><span className="font-medium text-[var(--foreground)]">Applied:</span> {provider.appliedDate}</p>
                </div>
                <p className="rounded-[20px] bg-[var(--slate-50)] px-4 py-3 text-sm leading-7 text-[var(--foreground-muted)]">{provider.bio ?? "No bio submitted yet."}</p>
                <div className="flex flex-wrap gap-3">
                  <form action={approveProviderAction}>
                    <input type="hidden" name="providerId" value={provider.id} />
                    <input type="hidden" name="redirectTo" value="/clinic/providers" />
                    <button type="submit" className="inline-flex h-11 cursor-pointer items-center rounded-xl bg-[var(--teal-600)] px-5 text-sm font-medium text-white transition hover:bg-[var(--teal-700)]">
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Approve
                    </button>
                  </form>
                  <button type="button" onClick={() => { setRejectingProvider(provider); setRejectionReason(""); }} className="inline-flex h-11 cursor-pointer items-center rounded-xl border border-[rgba(212,88,123,0.22)] px-5 text-sm font-medium text-[var(--rose-700)] transition hover:bg-rose-50">
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <ShieldAlert className="mx-auto h-10 w-10 text-[var(--teal-700)]" />
            <h3 className="mt-4 text-xl font-semibold tracking-tight">No pending applications</h3>
            <p className="mt-2 text-sm text-[var(--foreground-muted)]">New provider applications waiting for review will appear here.</p>
          </Card>
        )
      ) : (
        <Card className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--border)] text-left text-sm">
              <thead className="bg-[var(--slate-50)] text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">
                <tr>
                  <th className="px-4 py-4 font-medium">Avatar</th>
                  <th className="px-4 py-4 font-medium">Name</th>
                  <th className="px-4 py-4 font-medium">Specialty</th>
                  <th className="px-4 py-4 font-medium">Status</th>
                  <th className="px-4 py-4 font-medium">Rating</th>
                  <th className="px-4 py-4 font-medium">Patients</th>
                  <th className="px-4 py-4 font-medium">Joined</th>
                  <th className="px-4 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[var(--foreground)]">
                {filteredProviders.map((provider) => (
                  <tr key={provider.id}>
                    <td className="px-4 py-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(232,125,155,0.14)] text-sm font-semibold text-[var(--rose-700)]">{provider.name.slice(0, 2).toUpperCase()}</div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium">{provider.name}</p>
                      <p className="text-xs text-[var(--foreground-muted)]">{provider.email}</p>
                      {provider.status === "Rejected" && provider.rejectionReason ? <p className="mt-1 text-xs text-[var(--rose-700)]">Reason: {provider.rejectionReason}</p> : null}
                      {provider.status === "Suspended" && provider.suspendedReason ? <p className="mt-1 text-xs text-[var(--rose-700)]">Reason: {provider.suspendedReason}</p> : null}
                    </td>
                    <td className="px-4 py-4 text-[var(--foreground-muted)]">{provider.specialty}</td>
                    <td className="px-4 py-4"><Badge variant={getStatusVariant(provider.status)}>{provider.status}</Badge></td>
                    <td className="px-4 py-4">{provider.rating ? provider.rating.toFixed(1) : "New"}</td>
                    <td className="px-4 py-4">{provider.patients}</td>
                    <td className="px-4 py-4 text-[var(--foreground-muted)]">{provider.joinedDate}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/clinic/providers/${provider.id}` as Route} className="inline-flex h-10 items-center rounded-xl border border-[var(--border)] px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50">View profile</Link>
                        {provider.status === "Pending approval" ? null : provider.status === "Suspended" ? (
                          <form action={reactivateProviderAction}>
                            <input type="hidden" name="providerId" value={provider.id} />
                            <input type="hidden" name="redirectTo" value="/clinic/providers" />
                            <button type="submit" className="inline-flex h-10 cursor-pointer items-center rounded-xl border border-[rgba(61,191,173,0.22)] px-4 text-sm font-medium text-[var(--teal-700)] transition hover:bg-[var(--teal-50)]">
                              <UserRoundCheck className="mr-2 h-4 w-4" />
                              Reactivate
                            </button>
                          </form>
                        ) : (
                          <button type="button" onClick={() => { setSelectedProvider(provider); setSuspendReason(provider.suspendedReason ?? ""); }} className="inline-flex h-10 cursor-pointer items-center rounded-xl border border-[rgba(212,88,123,0.22)] px-4 text-sm font-medium text-[var(--rose-700)] transition hover:bg-rose-50">
                            <UserRoundMinus className="mr-2 h-4 w-4" />
                            Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {selectedProvider ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-[var(--rose-700)]">Provider access</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight">Suspend {selectedProvider.name}</h3>
                <p className="mt-2 text-sm leading-7 text-[var(--foreground-muted)]">This immediately removes provider access across the platform and closes new booking availability.</p>
              </div>
              <button type="button" onClick={() => setSelectedProvider(null)} className="rounded-full border border-[var(--border)] px-3 py-1 text-sm text-slate-600 transition hover:bg-slate-50">Close</button>
            </div>
            <form action={suspendProviderAction} className="mt-6 space-y-4">
              <input type="hidden" name="providerId" value={selectedProvider.id} />
              <input type="hidden" name="redirectTo" value="/clinic/providers" />
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                <span>Suspension reason</span>
                <textarea name="suspendedReason" required minLength={5} value={suspendReason} onChange={(event) => setSuspendReason(event.target.value)} className="min-h-32 rounded-2xl border border-[var(--border)] px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--rose-300)]" placeholder="Document the reason for this suspension." />
              </label>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setSelectedProvider(null)} className="inline-flex h-11 items-center rounded-xl border border-[var(--border)] px-5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">Cancel</button>
                <button type="submit" className="inline-flex h-11 items-center rounded-xl bg-[var(--rose-500)] px-5 text-sm font-medium text-white transition hover:bg-[var(--rose-600)]">Confirm suspend</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {rejectingProvider ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-[var(--rose-700)]">Provider review</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight">Reject {rejectingProvider.name}</h3>
                <p className="mt-2 text-sm leading-7 text-[var(--foreground-muted)]">Add the reason that should be kept with this provider application.</p>
              </div>
              <button type="button" onClick={() => setRejectingProvider(null)} className="rounded-full border border-[var(--border)] px-3 py-1 text-sm text-slate-600 transition hover:bg-slate-50">Close</button>
            </div>
            <form action={rejectProviderAction} className="mt-6 space-y-4">
              <input type="hidden" name="providerId" value={rejectingProvider.id} />
              <input type="hidden" name="redirectTo" value="/clinic/providers" />
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                <span>Rejection reason</span>
                <textarea name="rejectionReason" required minLength={5} value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} className="min-h-32 rounded-2xl border border-[var(--border)] px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--rose-300)]" placeholder="Explain why this application was not approved." />
              </label>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setRejectingProvider(null)} className="inline-flex h-11 items-center rounded-xl border border-[var(--border)] px-5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">Cancel</button>
                <button type="submit" className="inline-flex h-11 items-center rounded-xl bg-[var(--rose-500)] px-5 text-sm font-medium text-white transition hover:bg-[var(--rose-600)]">Confirm rejection</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
