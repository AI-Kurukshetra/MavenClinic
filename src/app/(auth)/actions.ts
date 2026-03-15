"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureProfileForUser, getAuthenticatedRedirectPath, getCurrentProfileWithSync } from "@/lib/auth";
import { publicEnv } from "@/lib/env";
import { loginSchema, signupSchema } from "@/lib/auth-form-schemas";
import {
  getValidProviderInvitation,
  isProviderSpecialty,
  normalizeInvitationToken,
} from "@/lib/provider-invitations";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const employerPlanTypes = ["standard", "premium", "enterprise"] as const;

type EmployerPlanType = (typeof employerPlanTypes)[number];

function toRedirect(path: Route, params: Record<string, string>): never {
  const search = new URLSearchParams(params);
  redirect(`${path}?${search.toString()}` as Route);
}

function normalizeCompanyDomain(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*/, "");
}

function getEmailDomain(email: string) {
  return email.trim().toLowerCase().split("@")[1] ?? "";
}

function isEmployerPlanType(value: string): value is EmployerPlanType {
  return employerPlanTypes.includes(value as EmployerPlanType);
}

function getSafeNextPath(value: string | undefined) {
  return value && value.startsWith("/") && !value.startsWith("//") ? (value as Route) : null;
}

export async function loginAction(formData: FormData) {
  const payload = loginSchema.safeParse({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
    next: String(formData.get("next") ?? "").trim() || undefined,
  });

  if (!payload.success) {
    toRedirect("/login", { error: payload.error.issues[0]?.message ?? "Enter a valid email and password." });
  }

  const { email, password, next } = payload.data;
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    toRedirect("/login", { error: error?.message ?? "Unable to sign in." });
  }

  const profile = await getCurrentProfileWithSync(data.user);
  revalidatePath("/");
  redirect((getSafeNextPath(next) ?? getAuthenticatedRedirectPath(profile)) as Route);
}

export async function signupAction(formData: FormData) {
  const payload = signupSchema.safeParse({
    fullName: String(formData.get("fullName") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });

  if (!payload.success) {
    toRedirect("/signup", { error: payload.error.issues[0]?.message ?? "Complete all required fields." });
  }

  const { fullName, email, password } = payload.data;
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${publicEnv.NEXT_PUBLIC_APP_URL}/dashboard`,
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    toRedirect("/signup", { error: error.message });
  }

  if (data.user) {
    await ensureProfileForUser(data.user);
  }

  revalidatePath("/dashboard");
  redirect((data.session ? "/onboarding" : "/login?message=Check your email to confirm your account before signing in.") as Route);
}

export async function registerProviderAction(formData: FormData) {
  const token = normalizeInvitationToken(String(formData.get("token") ?? ""));
  const fullName = String(formData.get("fullName") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const specialty = String(formData.get("specialty") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const licenseNumber = String(formData.get("licenseNumber") ?? "").trim();
  const languages = String(formData.get("languages") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const feeValue = Number.parseFloat(String(formData.get("consultationFee") ?? ""));

  if (!token) {
    toRedirect("/register/provider", { error: "Missing invite token." });
  }

  const { invitation, error: invitationError } = await getValidProviderInvitation(token);

  if (!invitation) {
    toRedirect("/register/provider", { token, error: invitationError ?? "This provider invite is invalid." });
  }

  if (!fullName || !password || !bio || !licenseNumber) {
    toRedirect("/register/provider", { token, error: "Complete all required fields before creating the provider account." });
  }

  if (!isProviderSpecialty(specialty)) {
    toRedirect("/register/provider", { token, error: "Choose a valid specialty." });
  }

  if (!languages.length) {
    toRedirect("/register/provider", { token, error: "Add at least one language." });
  }

  if (!Number.isFinite(feeValue) || feeValue < 0) {
    toRedirect("/register/provider", { token, error: "Enter a valid consultation fee." });
  }

  const consultationFeeCents = Math.round(feeValue * 100);
  const admin = getSupabaseAdminClient();
  const supabase = await getSupabaseServerClient();

  const { data: createdAuth, error: createAuthError } = await admin.auth.admin.createUser({
    email: invitation.email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      onboardingComplete: true,
    },
  });

  if (createAuthError || !createdAuth.user) {
    toRedirect("/register/provider", { token, error: createAuthError?.message ?? "Unable to create the provider account." });
  }

  const user = createdAuth.user;

  try {
    const { error: profileError } = await admin.from("profiles").upsert({
      id: user.id,
      full_name: fullName,
      onboarding_complete: true,
      role: "provider",
    });

    if (profileError) {
      throw new Error(profileError.message);
    }

    const { error: providerError } = await admin.from("providers").insert({
      profile_id: user.id,
      specialty,
      bio,
      license_number: licenseNumber,
      languages,
      accepting_patients: true,
      consultation_fee_cents: consultationFeeCents,
    });

    if (providerError) {
      throw new Error(providerError.message);
    }

    const { error: invitationUpdateError } = await admin
      .from("invitations")
      .update({
        accepted: true,
      })
      .eq("id", invitation.id);

    if (invitationUpdateError) {
      throw new Error(invitationUpdateError.message);
    }
  } catch (error) {
    await admin.auth.admin.deleteUser(user.id);
    const message = error instanceof Error ? error.message : "Unable to finish provider registration.";
    toRedirect("/register/provider", { token, error: message });
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: invitation.email,
    password,
  });

  if (signInError) {
    toRedirect("/login", { message: "Provider account created. Sign in to continue." });
  }

  revalidatePath("/");
  revalidatePath("/provider/dashboard");
  redirect("/provider/dashboard");
}

export async function registerEmployerAction(formData: FormData) {
  const companyName = String(formData.get("companyName") ?? "").trim();
  const domain = normalizeCompanyDomain(String(formData.get("domain") ?? ""));
  const employeeCount = Number.parseInt(String(formData.get("employeeCount") ?? ""), 10);
  const planType = String(formData.get("planType") ?? "").trim().toLowerCase();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!companyName || !domain || !fullName || !email || !password) {
    toRedirect("/register/employer", { error: "Complete all required fields before creating the employer account." });
  }

  if (!domain.includes(".")) {
    toRedirect("/register/employer", { error: "Enter a valid company domain." });
  }

  if (getEmailDomain(email) !== domain) {
    toRedirect("/register/employer", { error: "Use a work email that matches the company domain." });
  }

  if (!Number.isInteger(employeeCount) || employeeCount <= 0) {
    toRedirect("/register/employer", { error: "Employee count must be a positive whole number." });
  }

  if (!isEmployerPlanType(planType)) {
    toRedirect("/register/employer", { error: "Choose a valid plan type." });
  }

  const admin = getSupabaseAdminClient();
  const supabase = await getSupabaseServerClient();

  const { data: existingEmployer } = await admin
    .from("employers")
    .select("id")
    .eq("domain", domain)
    .maybeSingle();

  if (existingEmployer?.id) {
    toRedirect("/register/employer", { error: "An employer account for this domain already exists." });
  }

  const { data: createdAuth, error: createAuthError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      onboardingComplete: true,
    },
  });

  if (createAuthError || !createdAuth.user) {
    toRedirect("/register/employer", { error: createAuthError?.message ?? "Unable to create the employer admin account." });
  }

  const user = createdAuth.user;

  try {
    const { data: employer, error: employerError } = await admin
      .from("employers")
      .insert({
        company_name: companyName,
        domain,
        employee_count: employeeCount,
        plan_type: planType,
      })
      .select("id")
      .single();

    if (employerError || !employer) {
      throw new Error(employerError?.message ?? "Unable to create employer record.");
    }

    const { error: profileError } = await admin.from("profiles").upsert({
      id: user.id,
      full_name: fullName,
      onboarding_complete: true,
      role: "employer_admin",
      employer_id: employer.id,
    });

    if (profileError) {
      throw new Error(profileError.message);
    }
  } catch (error) {
    await admin.auth.admin.deleteUser(user.id);
    const message = error instanceof Error ? error.message : "Unable to finish employer registration.";
    toRedirect("/register/employer", { error: message });
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

  if (signInError) {
    toRedirect("/login", { message: "Employer account created. Sign in to continue." });
  }

  revalidatePath("/");
  revalidatePath("/employer/dashboard");
  redirect("/employer/dashboard");
}

export async function logoutAction() {
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login?message=You have been signed out." as Route);
}

