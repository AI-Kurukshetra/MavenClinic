"use client";

import Link from "next/link";
import { useState } from "react";
import { ShieldCheck, UserPlus, X } from "lucide-react";
import { useFormStatus } from "react-dom";
import { inviteEmployeeAction } from "@/app/(employer)/employer/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type EmployeeRow = {
  id: string;
  name: string;
  email: string;
  joinDate: string;
  lastActive: string;
  status: "active" | "inactive";
};

type Props = {
  employerName: string;
  employees: EmployeeRow[];
  page: number;
  totalPages: number;
  totalEmployees: number;
  message?: string;
  error?: string;
  warning?: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="h-11 rounded-xl px-5" disabled={pending}>
      {pending ? "Sending invite..." : "Send invite"}
    </Button>
  );
}

export function EmployerEmployeesTable({ employerName, employees, page, totalPages, totalEmployees, message, error, warning }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--rose-700)]">Employee roster</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">{employerName} employees</h2>
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">{totalEmployees} covered employees visible in this workspace.</p>
        </div>
        <Button type="button" className="h-11 gap-2 rounded-xl px-5" onClick={() => setIsModalOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Invite employee
        </Button>
      </div>

      {message ? <Card className="border-[rgba(46,168,152,0.18)] bg-[rgba(46,168,152,0.08)] p-4 text-sm text-[var(--foreground)]">{message}</Card> : null}
      {warning ? <Card className="border-[rgba(232,125,155,0.18)] bg-[rgba(232,125,155,0.08)] p-4 text-sm text-[var(--foreground)]">{warning}</Card> : null}
      {error ? <Card className="border-[rgba(190,68,100,0.22)] bg-[rgba(190,68,100,0.08)] p-4 text-sm text-[var(--foreground)]">{error}</Card> : null}

      <Card className="p-0 overflow-hidden">
        {employees.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--border)] text-left">
              <thead className="bg-[var(--slate-50)] text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">
                <tr>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Join date</th>
                  <th className="px-6 py-4 font-medium">Last active</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-sm text-[var(--foreground)]">
                {employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-[var(--slate-50)]">
                    <td className="px-6 py-4 font-medium">{employee.name}</td>
                    <td className="px-6 py-4 text-[var(--foreground-muted)]">{employee.email}</td>
                    <td className="px-6 py-4 text-[var(--foreground-muted)]">{employee.joinDate}</td>
                    <td className="px-6 py-4 text-[var(--foreground-muted)]">{employee.lastActive}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${employee.status === "active" ? "bg-[rgba(46,168,152,0.12)] text-[var(--teal-700)]" : "bg-[rgba(148,163,184,0.14)] text-slate-600"}`}>
                        {employee.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="rounded-2xl bg-[rgba(46,168,152,0.12)] p-3 text-[var(--teal-700)]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-2xl font-semibold tracking-tight">No employees yet — invite your team</h3>
            <p className="mt-2 max-w-xl text-sm leading-7 text-[var(--foreground-muted)]">
              Once employees are linked to this employer account, they will appear here with enrollment dates and recent activity.
            </p>
            <Button type="button" className="mt-6 h-11 gap-2 rounded-xl px-5" onClick={() => setIsModalOpen(true)}>
              <UserPlus className="h-4 w-4" />
              Invite employee
            </Button>
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between gap-4 text-sm text-[var(--foreground-muted)]">
        <p>Page {page} of {totalPages}</p>
        <div className="flex gap-3">
          <Link
            href={`/employer/employees?page=${Math.max(1, page - 1)}`}
            className={`rounded-full border px-4 py-2 transition ${page <= 1 ? "pointer-events-none border-[var(--border)] text-slate-300" : "border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--slate-50)]"}`}
          >
            Previous
          </Link>
          <Link
            href={`/employer/employees?page=${Math.min(totalPages, page + 1)}`}
            className={`rounded-full border px-4 py-2 transition ${page >= totalPages ? "pointer-events-none border-[var(--border)] text-slate-300" : "border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--slate-50)]"}`}
          >
            Next
          </Link>
        </div>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.42)] px-4">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-[var(--rose-700)]">Invite employee</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight">Add someone to your covered team</h3>
              </div>
              <button
                type="button"
                aria-label="Close invite modal"
                className="rounded-full p-2 text-[var(--foreground-muted)] transition hover:bg-[var(--slate-50)] hover:text-[var(--foreground)]"
                onClick={() => setIsModalOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--foreground-muted)]">
              Send a patient invite and attach employer metadata so the employee can join the right benefits cohort.
            </p>
            <form action={inviteEmployeeAction} className="mt-6 space-y-4">
              <input type="hidden" name="page" value={page} />
              <label className="block space-y-2 text-sm font-medium text-[var(--foreground)]">
                <span>Employee email</span>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="employee@company.com"
                  className="h-12 w-full rounded-xl border border-[var(--border)] px-4 text-sm outline-none transition focus:border-[var(--rose-300)] focus:ring-2 focus:ring-[rgba(232,125,155,0.2)]"
                />
              </label>
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" className="h-11 rounded-xl px-5" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <SubmitButton />
              </div>
            </form>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

