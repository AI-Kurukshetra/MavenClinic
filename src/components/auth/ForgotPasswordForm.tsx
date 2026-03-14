"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowLeft, CircleCheckBig, LoaderCircle, Mail } from "lucide-react";
import { AuthInputField } from "@/components/auth/AuthInputField";
import { forgotPasswordSchema } from "@/lib/auth-form-schemas";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = forgotPasswordSchema.safeParse({ email });

    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Enter a valid email address.");
      return;
    }

    setIsPending(true);
    setError(null);

    const supabase = getSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}/login?message=${encodeURIComponent("Your password has been updated. Sign in with your new password.")}`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(result.data.email, { redirectTo });

    setIsPending(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSuccessEmail(result.data.email);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-10 sm:px-8">
      <div className="w-full max-w-[420px] space-y-8 auth-page-enter">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--foreground-muted)] transition hover:text-[var(--foreground)]">
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>

        <div className="space-y-3">
          <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-slate-800">Reset your password</h1>
          <p className="text-base leading-7 text-slate-500">Enter your email and we will send a reset link within 2 minutes.</p>
        </div>

        {successEmail ? (
          <div className="rounded-[28px] border border-[rgba(61,191,173,0.22)] bg-[var(--teal-50)] px-6 py-6 text-center">
            <CircleCheckBig className="mx-auto h-10 w-10 text-[var(--teal-500)]" />
            <p className="mt-4 text-lg font-semibold text-[var(--foreground)]">Check your email</p>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">Link sent to {successEmail}.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <AuthInputField
              id="forgot-password-email"
              name="email"
              type="email"
              autoComplete="email"
              label="Email address"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError(null);
              }}
              error={error ?? undefined}
              leftIcon={<Mail className="h-4 w-4" />}
            />

            <button
              type="submit"
              disabled={isPending}
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--rose-500)] text-base font-medium text-white transition hover:bg-[var(--rose-600)] disabled:cursor-not-allowed disabled:opacity-75"
            >
              {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              {isPending ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}