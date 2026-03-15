"use client";

import type { Route } from "next";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Filter, UserRoundCheck, UserRoundMinus } from "lucide-react";
import { reactivateProviderAction, suspendProviderAction } from "@/app/(clinic)/clinic/actions";
import type { ClinicProviderListItem } from "@/lib/clinic-admin-data";
import { Card } from "@/components/ui/card";
import { ClinicEmptyState, ProviderStatusBadge, SearchInput } from "@/features/clinic/clinic-ui";

export function ClinicProvidersPanel({ providers, redirectTo }: { providers: ClinicProviderListItem[]; redirectTo: string }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive" | "pending" | "suspended">("all");
  const [selectedProvider, setSelectedProvider] = useState<ClinicProviderListItem | null>(null);
  const [reason, setReason] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return providers.filter((provider) => {
      const matchesQuery = !normalized || provider.name.toLowerCase().includes(normalized) || provider.specialty.toLowerCase().includes(normalized);
      const matchesFilter = filter === "all"
        || (filter === "active" && provider.status === "Active and accepting")
        || (filter === "inactive" && provider.status === "Inactive")
        || (filter === "pending" && provider.status === "Pending approval")
        || (filter === "suspended" && provider.status === "Suspended");
      return matchesQuery && matchesFilter;
    });
  }, [filter, providers, query]);

  function closeModal() {
    setSelectedProvider(null);
    setReason("");
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-[var(--rose-700)]">Providers</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Provider roster</h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <SearchInput value={query} onChange={setQuery} placeholder="Search by name or specialty" />
            <label className="flex h-11 items-center gap-3 rounded-xl border border-[var(--border)] bg-white px-4 text-sm text-[var(--foreground-muted)]">
              <Filter className="h-4 w-4" />
              <select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} className="bg-transparent text-[var(--foreground)] outline-none">
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            </label>
          </div>
        </div>

        {filtered.length ? (
          <div className="mt-6 overflow-x-auto">
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
                {filtered.map((provider) => (
                  <tr key={provider.id}>
                    <td className="px-4 py-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(232,125,155,0.14)] text-sm font-semibold text-[var(--rose-700)]">
                        {provider.name.slice(0, 2).toUpperCase()}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium">{provider.name}</p>
                      <p className="text-xs text-[var(--foreground-muted)]">{provider.totalReviews} reviews</p>
                      {provider.status === "Suspended" && provider.suspendedReason ? (
                        <p className="mt-1 text-xs text-[var(--rose-700)]">Reason: {provider.suspendedReason}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 text-[var(--foreground-muted)]">{provider.specialty}</td>
                    <td className="px-4 py-4"><ProviderStatusBadge status={provider.status} /></td>
                    <td className="px-4 py-4">{provider.rating ? provider.rating.toFixed(1) : "New"} {provider.rating ? <span className="text-amber-400">{"\u2605"}</span> : null}</td>
                    <td className="px-4 py-4">{provider.patients}</td>
                    <td className="px-4 py-4 text-[var(--foreground-muted)]">{provider.joinedDate}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/clinic/providers/${provider.id}` as Route} className="inline-flex h-10 items-center rounded-xl border border-[var(--border)] px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
                          View profile
                        </Link>
                        {provider.status === "Suspended" ? (
                          <form
                            action={reactivateProviderAction}
                            onSubmit={(event) => {
                              if (!window.confirm(`Reactivate ${provider.name}?`)) {
                                event.preventDefault();
                              }
                            }}
                          >
                            <input type="hidden" name="providerId" value={provider.id} />
                            <input type="hidden" name="redirectTo" value={redirectTo} />
                            <button type="submit" className="inline-flex h-10 cursor-pointer items-center rounded-xl border border-[rgba(61,191,173,0.22)] px-4 text-sm font-medium text-[var(--teal-700)] transition hover:bg-[var(--teal-50)]">
                              <UserRoundCheck className="mr-2 h-4 w-4" />
                              Reactivate
                            </button>
                          </form>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProvider(provider);
                              setReason(provider.suspendedReason ?? "");
                            }}
                            className="inline-flex h-10 cursor-pointer items-center rounded-xl border border-[rgba(212,88,123,0.22)] px-4 text-sm font-medium text-[var(--rose-700)] transition hover:bg-rose-50"
                          >
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
        ) : (
          <div className="mt-6">
            <ClinicEmptyState title="No providers found" body="Adjust your search or filter to see more provider records." />
          </div>
        )}
      </Card>

      {selectedProvider ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-[var(--rose-700)]">Provider access</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight">Suspend {selectedProvider.name}</h3>
                <p className="mt-2 text-sm leading-7 text-[var(--foreground-muted)]">This immediately removes provider access across the platform and closes new booking availability.</p>
              </div>
              <button type="button" onClick={closeModal} className="rounded-full border border-[var(--border)] px-3 py-1 text-sm text-slate-600 transition hover:bg-slate-50">
                Close
              </button>
            </div>
            <form action={suspendProviderAction} className="mt-6 space-y-4">
              <input type="hidden" name="providerId" value={selectedProvider.id} />
              <input type="hidden" name="redirectTo" value={redirectTo} />
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                <span>Suspension reason</span>
                <textarea
                  name="suspendedReason"
                  required
                  minLength={5}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className="min-h-32 rounded-2xl border border-[var(--border)] px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--rose-300)] focus:ring-2 focus:ring-[rgba(232,125,155,0.22)]"
                  placeholder="Document the reason for this suspension."
                />
              </label>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="inline-flex h-11 items-center rounded-xl border border-[var(--border)] px-5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" className="inline-flex h-11 items-center rounded-xl bg-[var(--rose-500)] px-5 text-sm font-medium text-white transition hover:bg-[var(--rose-600)]">
                  Confirm suspend
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
