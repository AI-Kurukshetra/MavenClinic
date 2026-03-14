"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { Eye, EyeOff, LoaderCircle, Lock, Mail, User } from "lucide-react";
import { useFormStatus } from "react-dom";
import { AuthInputField } from "@/components/auth/AuthInputField";
import { getPasswordStrength, signupSchema } from "@/lib/auth-form-schemas";
import { cn } from "@/lib/utils";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  serverError?: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--rose-500)] text-base font-medium text-white transition hover:bg-[var(--rose-600)] disabled:cursor-not-allowed disabled:opacity-75"
    >
      {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
      {pending ? "Creating your account..." : "Create account ->"}
    </button>
  );
}

function getServerFieldErrors(serverError?: string) {
  const message = serverError?.toLowerCase() ?? "";

  if (message.includes("already") || message.includes("registered") || message.includes("taken")) {
    return { email: "An account with this email already exists." };
  }

  if (message.includes("password")) {
    return { password: serverError };
  }

  return {};
}

const strengthClasses = [
  "bg-slate-200",
  "bg-[rgba(245,163,183,0.3)]",
  "bg-[var(--rose-300)]",
  "bg-[var(--rose-500)]",
  "bg-[var(--teal-400)]",
];

export function SignupForm({ action, serverError }: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<"fullName" | "email" | "password", string>>>({});
  const serverFieldErrors = useMemo(() => getServerFieldErrors(serverError), [serverError]);
  const strength = getPasswordStrength(password);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const result = signupSchema.safeParse({ fullName, email, password });

    if (result.success) {
      setFieldErrors({});
      return;
    }

    event.preventDefault();
    const nextErrors: Partial<Record<"fullName" | "email" | "password", string>> = {};

    for (const issue of result.error.issues) {
      const field = issue.path[0];
      if (field === "fullName" || field === "email" || field === "password") {
        nextErrors[field] = issue.message;
      }
    }

    setFieldErrors(nextErrors);
  }

  return (
    <div className="space-y-7 auth-page-enter">
      <div className="space-y-4">
        <span className="inline-flex items-center rounded-full bg-[var(--rose-50)] px-3 py-1 text-xs font-medium text-[var(--rose-600)]">
          Join 50,000+ women
        </span>
        <div className="space-y-3">
          <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-slate-800">Start your health journey</h1>
          <p className="text-base text-slate-500">Create your free account in 60 seconds.</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-[var(--foreground-muted)]">
          <span>1 of 2 - Account details</span>
          <span>50%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--rose-100)]">
          <div className="h-full w-1/2 rounded-full bg-[var(--rose-500)]" />
        </div>
      </div>

      {serverError && !serverFieldErrors.email && !serverFieldErrors.password ? (
        <div className="rounded-2xl border border-[rgba(212,88,123,0.14)] bg-[var(--rose-50)] px-4 py-3 text-sm text-[var(--rose-700)]">{serverError}</div>
      ) : null}

      <form action={action} onSubmit={handleSubmit} className="space-y-5">
        <AuthInputField
          id="signup-full-name"
          name="fullName"
          autoComplete="name"
          label="Full name"
          placeholder="Sarah Johnson"
          value={fullName}
          onChange={(event) => {
            setFullName(event.target.value);
            setFieldErrors((current) => ({ ...current, fullName: undefined }));
          }}
          error={fieldErrors.fullName}
          leftIcon={<User className="h-4 w-4" />}
        />

        <AuthInputField
          id="signup-email"
          name="email"
          type="email"
          autoComplete="email"
          label="Email address"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setFieldErrors((current) => ({ ...current, email: undefined }));
          }}
          error={fieldErrors.email ?? serverFieldErrors.email}
          helperText="We will send your appointment confirmations here."
          leftIcon={<Mail className="h-4 w-4" />}
        />

        <div className="space-y-3">
          <AuthInputField
            id="signup-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            label="Create password"
            placeholder="Create a secure password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setFieldErrors((current) => ({ ...current, password: undefined }));
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

          {password ? (
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 4 }, (_, index) => (
                  <span
                    key={index}
                    className={cn(
                      "h-1.5 rounded-full transition",
                      index < strength.normalizedScore ? strengthClasses[strength.score] : "bg-slate-200",
                    )}
                  />
                ))}
              </div>
              <p className="text-sm text-[var(--foreground-muted)]">{strength.label}</p>
            </div>
          ) : null}
        </div>

        <SubmitButton />
      </form>

      <div className="space-y-4 text-center">
        <p className="text-center text-xs leading-6 text-slate-400">
          By creating an account you agree to our Terms of Service and Privacy Policy. HIPAA-compliant platform.
        </p>
        <p className="text-sm text-[var(--foreground-muted)]">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[var(--rose-500)] transition hover:text-[var(--rose-600)]">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}