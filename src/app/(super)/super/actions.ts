"use server";

import { revalidatePath } from "next/cache";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { z } from "zod";
import { sanitizeText } from "@/lib/sanitize";
import { requireSuperAdminAccess } from "@/lib/super-admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const safeSuperPath = z.string().min(1).refine((value) => value.startsWith("/super"), "Invalid redirect path.");
const roleSchema = z.enum(["patient", "provider", "employer_admin", "clinic_admin", "super_admin", "partner"]);
const planSchema = z.enum(["standard", "premium", "enterprise", "trial"]);

const createEmployerSchema = z.object({
  companyName: z.string().min(2),
  domain: z.string().optional(),
  employeeCount: z.coerce.number().int().min(1),
  planType: planSchema,
  contractStart: z.string().min(1),
  contractEnd: z.string().min(1),
  adminEmail: z.string().email(),
  redirectTo: safeSuperPath.default("/super/employers"),
});

const updateEmployerSchema = z.object({
  employerId: z.string().uuid(),
  employeeCount: z.coerce.number().int().min(1),
  planType: planSchema,
  contractStart: z.string().min(1),
  contractEnd: z.string().min(1),
  redirectTo: safeSuperPath,
});

const suspendEmployerSchema = z.object({
  employerId: z.string().uuid(),
  redirectTo: safeSuperPath,
});

const providerInviteSchema = z.object({
  email: z.string().email(),
  specialty: z.string().min(2),
  redirectTo: safeSuperPath.default("/super/providers"),
});

const providerStatusSchema = z.object({
  providerId: z.string().uuid(),
  acceptingPatients: z.enum(["true", "false"]),
  suspendedReason: z.string().trim().optional(),
  redirectTo: safeSuperPath,
});

const userRoleSchema = z.object({
  userId: z.string().uuid(),
  role: roleSchema,
  redirectTo: safeSuperPath,
});

const userSuspensionSchema = z.object({
  userId: z.string().uuid(),
  suspended: z.enum(["true", "false"]),
  redirectTo: safeSuperPath,
});

const featureFlagSchema = z.object({
  key: z.string().min(2),
  enabled: z.enum(["true", "false"]),
  redirectTo: safeSuperPath.default("/super/system"),
});

const settingsSchema = z.object({
  platformName: z.string().min(2),
  supportEmail: z.string().email(),
  defaultTimezone: z.string().min(2),
  defaultLanguage: z.string().min(2),
  systemAlertEmail: z.string().email(),
  notifyNewEmployer: z.enum(["true", "false"]),
  notifyNewProvider: z.enum(["true", "false"]),
  dailyReportEmailEnabled: z.enum(["true", "false"]),
  dailyReportRecipient: z.string().email(),
  redirectTo: safeSuperPath.default("/super/settings"),
});

const clearDataSchema = z.object({
  confirmation: z.literal("DELETE"),
  redirectTo: safeSuperPath.default("/super/system"),
});

function toSuperRedirect(path: string, values: Record<string, string>): never {
  const params = new URLSearchParams(values);
  redirect(`${path}?${params.toString()}` as Route);
}

async function getMergedMetadata(userId: string, patch: Record<string, unknown>) {
  const admin = getSupabaseAdminClient();
  const userResult = await admin.auth.admin.getUserById(userId);
  const existing = userResult.data.user?.user_metadata ?? {};
  return { ...existing, ...patch };
}

function revalidateSuper() {
  [
    "/super/dashboard",
    "/super/employers",
    "/super/providers",
    "/super/users",
    "/super/financials",
    "/super/analytics",
    "/super/system",
    "/super/settings",
  ].forEach((path) => revalidatePath(path));
}

async function syncProviderAuthSuspension(admin: ReturnType<typeof getSupabaseAdminClient>, providerId: string, suspended: boolean) {
  const providerResult = await admin.from("providers").select("profile_id").eq("id", providerId).maybeSingle();
  const profileId = providerResult.data?.profile_id;

  if (!profileId) {
    return;
  }

  const metadata = await getMergedMetadata(profileId, { suspended });
  await admin.auth.admin.updateUserById(profileId, { user_metadata: metadata });
}

export async function createEmployerAction(formData: FormData) {
  const payload = createEmployerSchema.safeParse({
    companyName: sanitizeText(String(formData.get("companyName") ?? "")),
    domain: sanitizeText(String(formData.get("domain") ?? "")) || undefined,
    employeeCount: formData.get("employeeCount"),
    planType: String(formData.get("planType") ?? "standard"),
    contractStart: String(formData.get("contractStart") ?? ""),
    contractEnd: String(formData.get("contractEnd") ?? ""),
    adminEmail: String(formData.get("adminEmail") ?? "").trim().toLowerCase(),
    redirectTo: String(formData.get("redirectTo") ?? "/super/employers"),
  });

  if (!payload.success) {
    toSuperRedirect("/super/employers", { error: payload.error.issues[0]?.message ?? "Unable to create employer." });
  }

  await requireSuperAdminAccess();
  const admin = getSupabaseAdminClient();
  const { companyName, domain, employeeCount, planType, contractStart, contractEnd, adminEmail, redirectTo } = payload.data;
  const employerResult = await admin
    .from("employers")
    .insert({ company_name: companyName, domain: domain ?? null, employee_count: employeeCount, plan_type: planType, contract_start: contractStart, contract_end: contractEnd })
    .select("id")
    .single();

  if (employerResult.error || !employerResult.data) {
    toSuperRedirect(redirectTo, { error: "Unable to create employer right now." });
  }

  const inviteResult = await admin.from("invitations").insert({ email: adminEmail, role: "employer_admin", employer_id: employerResult.data.id });
  if (inviteResult.error) {
    toSuperRedirect(redirectTo, { error: "Employer created, but the admin invitation could not be sent." });
  }

  revalidateSuper();
  revalidatePath(`/super/employers/${employerResult.data.id}`);
  toSuperRedirect(redirectTo, { message: `${companyName} is ready for launch.` });
}

export async function updateEmployerContractAction(formData: FormData) {
  const payload = updateEmployerSchema.safeParse({
    employerId: String(formData.get("employerId") ?? ""),
    employeeCount: formData.get("employeeCount"),
    planType: String(formData.get("planType") ?? "standard"),
    contractStart: String(formData.get("contractStart") ?? ""),
    contractEnd: String(formData.get("contractEnd") ?? ""),
    redirectTo: String(formData.get("redirectTo") ?? "/super/employers"),
  });

  if (!payload.success) {
    toSuperRedirect("/super/employers", { error: payload.error.issues[0]?.message ?? "Unable to update contract." });
  }

  await requireSuperAdminAccess();
  const admin = getSupabaseAdminClient();
  const { employerId, employeeCount, planType, contractStart, contractEnd, redirectTo } = payload.data;
  const result = await admin
    .from("employers")
    .update({ employee_count: employeeCount, plan_type: planType, contract_start: contractStart, contract_end: contractEnd })
    .eq("id", employerId);

  if (result.error) {
    toSuperRedirect(redirectTo, { error: "Unable to update contract right now." });
  }

  revalidateSuper();
  revalidatePath(`/super/employers/${employerId}`);
  toSuperRedirect(redirectTo, { message: "Employer contract updated." });
}

export async function suspendEmployerAction(formData: FormData) {
  const payload = suspendEmployerSchema.safeParse({
    employerId: String(formData.get("employerId") ?? ""),
    redirectTo: String(formData.get("redirectTo") ?? "/super/employers"),
  });

  if (!payload.success) {
    toSuperRedirect("/super/employers", { error: payload.error.issues[0]?.message ?? "Unable to suspend employer." });
  }

  await requireSuperAdminAccess();
  const admin = getSupabaseAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const result = await admin.from("employers").update({ contract_end: today }).eq("id", payload.data.employerId);

  if (result.error) {
    toSuperRedirect(payload.data.redirectTo, { error: "Unable to suspend employer right now." });
  }

  revalidateSuper();
  toSuperRedirect(payload.data.redirectTo, { message: "Employer contract moved to expired." });
}

export async function createProviderInvitationAction(formData: FormData) {
  const payload = providerInviteSchema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    specialty: sanitizeText(String(formData.get("specialty") ?? "")),
    redirectTo: String(formData.get("redirectTo") ?? "/super/providers"),
  });

  if (!payload.success) {
    toSuperRedirect("/super/providers", { error: payload.error.issues[0]?.message ?? "Unable to send invitation." });
  }

  await requireSuperAdminAccess();
  const admin = getSupabaseAdminClient();
  const result = await admin.from("invitations").insert({ email: payload.data.email, role: "provider" });

  if (result.error) {
    toSuperRedirect(payload.data.redirectTo, { error: "Unable to send provider invitation right now." });
  }

  revalidateSuper();
  toSuperRedirect(payload.data.redirectTo, { message: `Invitation sent to ${payload.data.email}.` });
}

export async function updateProviderStatusAction(formData: FormData) {
  const payload = providerStatusSchema.safeParse({
    providerId: String(formData.get("providerId") ?? ""),
    acceptingPatients: String(formData.get("acceptingPatients") ?? "false"),
    suspendedReason: sanitizeText(String(formData.get("suspendedReason") ?? "")) || undefined,
    redirectTo: String(formData.get("redirectTo") ?? "/super/providers"),
  });

  if (!payload.success) {
    toSuperRedirect("/super/providers", { error: payload.error.issues[0]?.message ?? "Unable to update provider." });
  }

  await requireSuperAdminAccess();
  const admin = getSupabaseAdminClient();
  const acceptingPatients = payload.data.acceptingPatients === "true";
  const update = acceptingPatients
    ? {
        accepting_patients: true,
        suspended: false,
        suspended_at: null,
        suspended_reason: null,
      }
    : {
        accepting_patients: false,
        suspended: true,
        suspended_at: new Date().toISOString(),
        suspended_reason: payload.data.suspendedReason ?? "Suspended by super admin",
      };
  const result = await admin.from("providers").update(update).eq("id", payload.data.providerId);

  if (result.error) {
    toSuperRedirect(payload.data.redirectTo, { error: "Unable to update provider status right now." });
  }

  await syncProviderAuthSuspension(admin, payload.data.providerId, !acceptingPatients);

  revalidateSuper();
  revalidatePath(`/super/providers/${payload.data.providerId}`);
  toSuperRedirect(payload.data.redirectTo, { message: acceptingPatients ? "Provider reactivated." : "Provider suspended." });
}

export async function updateUserRoleAction(formData: FormData) {
  const payload = userRoleSchema.safeParse({
    userId: String(formData.get("userId") ?? ""),
    role: String(formData.get("role") ?? "patient"),
    redirectTo: String(formData.get("redirectTo") ?? "/super/users"),
  });

  if (!payload.success) {
    toSuperRedirect("/super/users", { error: payload.error.issues[0]?.message ?? "Unable to update user role." });
  }

  await requireSuperAdminAccess();
  const admin = getSupabaseAdminClient();
  const metadata = await getMergedMetadata(payload.data.userId, { role: payload.data.role });
  const [profileResult, authResult] = await Promise.all([
    admin.from("profiles").update({ role: payload.data.role }).eq("id", payload.data.userId),
    admin.auth.admin.updateUserById(payload.data.userId, { user_metadata: metadata }),
  ]);

  if (profileResult.error || authResult.error) {
    toSuperRedirect(payload.data.redirectTo, { error: "Unable to update this user right now." });
  }

  revalidateSuper();
  toSuperRedirect(payload.data.redirectTo, { message: "User role updated." });
}

export async function setUserSuspendedAction(formData: FormData) {
  const payload = userSuspensionSchema.safeParse({
    userId: String(formData.get("userId") ?? ""),
    suspended: String(formData.get("suspended") ?? "false"),
    redirectTo: String(formData.get("redirectTo") ?? "/super/users"),
  });

  if (!payload.success) {
    toSuperRedirect("/super/users", { error: payload.error.issues[0]?.message ?? "Unable to update user status." });
  }

  await requireSuperAdminAccess();
  const admin = getSupabaseAdminClient();
  const suspended = payload.data.suspended === "true";
  const metadata = await getMergedMetadata(payload.data.userId, { suspended });
  const result = await admin.auth.admin.updateUserById(payload.data.userId, { user_metadata: metadata });

  if (result.error) {
    toSuperRedirect(payload.data.redirectTo, { error: "Unable to update user status right now." });
  }

  revalidateSuper();
  toSuperRedirect(payload.data.redirectTo, { message: suspended ? "User access suspended." : "User access restored." });
}

export async function toggleFeatureFlagAction(formData: FormData) {
  const payload = featureFlagSchema.safeParse({
    key: String(formData.get("key") ?? ""),
    enabled: String(formData.get("enabled") ?? "false"),
    redirectTo: String(formData.get("redirectTo") ?? "/super/system"),
  });

  if (!payload.success) {
    toSuperRedirect("/super/system", { error: payload.error.issues[0]?.message ?? "Unable to update feature flag." });
  }

  const { user } = await requireSuperAdminAccess();
  const admin = getSupabaseAdminClient();
  const result = await admin.from("feature_flags").upsert({ key: payload.data.key, enabled: payload.data.enabled === "true", updated_by: user.id });

  if (result.error) {
    toSuperRedirect(payload.data.redirectTo, { error: "Unable to save feature flag right now." });
  }

  revalidateSuper();
  toSuperRedirect(payload.data.redirectTo, { message: "Feature flag updated." });
}

export async function savePlatformSettingsAction(formData: FormData) {
  const payload = settingsSchema.safeParse({
    platformName: sanitizeText(String(formData.get("platformName") ?? "")),
    supportEmail: String(formData.get("supportEmail") ?? "").trim().toLowerCase(),
    defaultTimezone: sanitizeText(String(formData.get("defaultTimezone") ?? "")),
    defaultLanguage: sanitizeText(String(formData.get("defaultLanguage") ?? "")),
    systemAlertEmail: String(formData.get("systemAlertEmail") ?? "").trim().toLowerCase(),
    notifyNewEmployer: String(formData.get("notifyNewEmployer") ?? "false"),
    notifyNewProvider: String(formData.get("notifyNewProvider") ?? "false"),
    dailyReportEmailEnabled: String(formData.get("dailyReportEmailEnabled") ?? "false"),
    dailyReportRecipient: String(formData.get("dailyReportRecipient") ?? "").trim().toLowerCase(),
    redirectTo: String(formData.get("redirectTo") ?? "/super/settings"),
  });

  if (!payload.success) {
    toSuperRedirect("/super/settings", { error: payload.error.issues[0]?.message ?? "Unable to save platform settings." });
  }

  const { user } = await requireSuperAdminAccess();
  const admin = getSupabaseAdminClient();
  const settingsRows = [
    ["platform_name", payload.data.platformName],
    ["support_email", payload.data.supportEmail],
    ["default_timezone", payload.data.defaultTimezone],
    ["default_language", payload.data.defaultLanguage],
    ["system_alert_email", payload.data.systemAlertEmail],
    ["notify_new_employer", payload.data.notifyNewEmployer],
    ["notify_new_provider", payload.data.notifyNewProvider],
    ["daily_report_email_enabled", payload.data.dailyReportEmailEnabled],
    ["daily_report_recipient", payload.data.dailyReportRecipient],
  ].map(([key, value]) => ({ key, value, updated_by: user.id }));

  const result = await admin.from("platform_settings").upsert(settingsRows);
  if (result.error) {
    toSuperRedirect(payload.data.redirectTo, { error: "Unable to save platform settings right now." });
  }

  revalidateSuper();
  toSuperRedirect(payload.data.redirectTo, { message: "Platform settings saved." });
}

export async function clearTestDataAction(formData: FormData) {
  const payload = clearDataSchema.safeParse({
    confirmation: String(formData.get("confirmation") ?? ""),
    redirectTo: String(formData.get("redirectTo") ?? "/super/system"),
  });

  if (!payload.success) {
    toSuperRedirect("/super/system", { error: payload.error.issues[0]?.message ?? "Unable to clear test data." });
  }

  if (process.env.NODE_ENV === "production") {
    toSuperRedirect(payload.data.redirectTo, { error: "Test data can only be cleared in development." });
  }

  await requireSuperAdminAccess();
  const admin = getSupabaseAdminClient();
  await admin.from("messages").delete().not("id", "is", null);
  await admin.from("notifications").delete().not("id", "is", null);
  await admin.from("appointments").delete().not("id", "is", null);
  await admin.from("conversations").delete().not("id", "is", null);
  await admin.from("care_plans").delete().not("id", "is", null);
  await admin.from("invitations").delete().not("id", "is", null);
  await admin.from("provider_availability").delete().not("id", "is", null);
  await admin.from("feature_flags").delete().not("key", "is", null);
  await admin.from("platform_settings").delete().not("key", "is", null);

  revalidateSuper();
  toSuperRedirect(payload.data.redirectTo, { message: "Development test data cleared." });
}

