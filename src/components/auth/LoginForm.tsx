"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { Eye, EyeOff, LoaderCircle, Lock, Mail } from "lucide-react";
import { AuthInputField } from "@/components/auth/AuthInputField";
import { loginSchema } from "@/lib/auth-form-schemas";
import { getAuthenticatedRedirectPath, type RoleAwareProfile } from "@/lib/roles";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Props = {
  action?: (formData: FormData) => void | Promise<void>;
  serverError?: string;
  serverMessage?: string;
  next?: string;
};

function getServerFieldErrors(serverError?: string) {
  const message = serverError?.toLowerCase() ?? "";

  if (message.includes("invalid login credentials") || message.includes("wrong password")) {
    return { password: "Wrong email or password." };
  }

  if (message.includes("email") && message.includes("valid")) {
    return { email: serverError };
  }

  return {};
}

function getSafeNextPath(value: string | undefined) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : null;
}

export function LoginForm(props: Props) {
  const { serverError, serverMessage, next } = props;
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<"email" | "password", string>>>({});
  const serverFieldErrors = useMemo(() => getServerFieldErrors(serverError), [serverError]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = loginSchema.safeParse({ email, password, next });

    if (!result.success) {
      const nextErrors: Partial<Record<"email" | "password", string>> = {};

      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (field === "email" || field === "password") {
          nextErrors[field] = issue.message;
        }
      }

      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: result.data.email,
        password: result.data.password,
      });

      if (error || !data.user) {
        setFieldErrors({ password: "Wrong email or password." });
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("role, onboarding_complete")
        .eq("id", data.user.id)
        .maybeSingle();

      const profile: RoleAwareProfile = {
        role: profileData?.role ?? (typeof data.user.user_metadata?.role === "string" ? data.user.user_metadata.role : null),
        onboarding_complete: profileData?.onboarding_complete ?? Boolean(data.user.user_metadata?.onboardingComplete),
      };

      const destination = getSafeNextPath(result.data.next) ?? getAuthenticatedRedirectPath(profile);

      router.replace(destination as Route);
      router.refresh();
    } catch {
      setSubmitError("Unable to sign in right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const genericError = submitError ?? (serverError && !serverFieldErrors.email && !serverFieldErrors.password ? serverError : null);

  return (
    <div className="space-y-8 auth-page-enter">
      <div className="hidden md:block">
        <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-[var(--foreground-muted)]">
          Secure patient access
        </span>
      </div>

      <div className="space-y-3">
        <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-slate-800">Welcome back</h1>
        <p className="text-base text-slate-500">Sign in to continue your health journey.</p>
      </div>

      {serverMessage ? <div className="rounded-2xl border border-[rgba(61,191,173,0.24)] bg-[var(--teal-50)] px-4 py-3 text-sm text-[var(--teal-700)]">{serverMessage}</div> : null}
      {genericError ? (
        <div className="rounded-2xl border border-[rgba(212,88,123,0.14)] bg-[var(--rose-50)] px-4 py-3 text-sm text-[var(--rose-700)]">{genericError}</div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthInputField
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          label="Email address"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setFieldErrors((current) => ({ ...current, email: undefined }));
            setSubmitError(null);
          }}
          error={fieldErrors.email ?? serverFieldErrors.email}
          leftIcon={<Mail className="h-4 w-4" />}
        />

        <div className="space-y-2.5">
          <AuthInputField
            id="login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setFieldErrors((current) => ({ ...current, password: undefined }));
              setSubmitError(null);
            }}
            error={fieldErrors.password ?? serverFieldErrors.password}
            leftIcon={<Lock className="h-4 w-4" />}
            rightSlot={
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />
          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-sm font-medium text-[var(--rose-500)] transition hover:text-[var(--rose-600)]">
              Forgot password?
            </Link>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--rose-500)] text-base font-medium text-white transition hover:bg-[var(--rose-600)] disabled:cursor-not-allowed disabled:opacity-75"
        >
          {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="space-y-4 text-center">
        <p className="text-sm text-[var(--foreground-muted)]">
          New to Maven Clinic?{" "}
          <Link href="/signup" className="font-medium text-[var(--rose-500)] transition hover:text-[var(--rose-600)]">
            Create your account
          </Link>
        </p>
        <p className="text-xs tracking-[0.14em] text-slate-400">HIPAA Compliant · SOC 2 · Your data is never sold</p>
      </div>
    </div>
  );
}