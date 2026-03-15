"use server";

import { revalidatePath } from "next/cache";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireClinicAdminAccess } from "@/lib/clinic-admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const suspendProviderSchema = z.object({
  providerId: z.string().uuid(),
  suspendedReason: z.string().trim().min(5, "Add a short suspension reason."),
  redirectTo: z.string().min(1).default("/clinic/providers"),
});

const reactivateProviderSchema = z.object({
  providerId: z.string().uuid(),
  redirectTo: z.string().min(1).default("/clinic/providers"),
});

const approveProviderSchema = z.object({
  providerId: z.string().uuid(),
  redirectTo: z.string().min(1).default("/clinic/providers"),
});

const rejectProviderSchema = z.object({
  providerId: z.string().uuid(),
  rejectionReason: z.string().trim().min(5, "Add a short rejection reason."),
  redirectTo: z.string().min(1).default("/clinic/providers"),
});

const createInvitationSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  role: z.enum(["provider", "employer_admin", "clinic_admin"]),
  redirectTo: z.string().min(1).default("/clinic/invitations"),
});

const redirectSchema = z.object({
  redirectTo: z.string().min(1),
});

const contentSchema = z.object({
  title: z.string().min(3, "Title is required."),
  content: z.string().min(20, "Add more detail to the article."),
  category: z.string().min(2, "Choose a category."),
  lifeStage: z.string().min(2, "Choose a life stage."),
  published: z.enum(["true", "false"]).default("false"),
  redirectTo: z.string().min(1).default("/clinic/content"),
});

const toggleContentSchema = z.object({
  id: z.string().uuid(),
  published: z.enum(["true", "false"]),
  redirectTo: z.string().min(1).default("/clinic/content"),
});

const supportGroupSchema = z.object({
  name: z.string().min(3, "Group name is required."),
  description: z.string().min(10, "Add a short description."),
  category: z.string().min(2, "Choose a category."),
  moderatorId: z.string().optional(),
  redirectTo: z.string().min(1).default("/clinic/support-groups"),
});

const toggleSupportGroupSchema = z.object({
  id: z.string().uuid(),
  active: z.enum(["true", "false"]),
  redirectTo: z.string().min(1).default("/clinic/support-groups"),
});

const careTemplateSchema = z.object({
  name: z.string().min(3, "Template name is required."),
  specialty: z.string().min(2, "Choose a specialty."),
  description: z.string().min(10, "Add a template description."),
  milestones: z.string().min(2, "Add at least one milestone."),
  redirectTo: z.string().min(1).default("/clinic/care-templates"),
});

function toClinicRedirect(path: string, values: Record<string, string>): never {
  const search = new URLSearchParams(values);
  redirect(`${path}?${search.toString()}` as Route);
}

function isSafeClinicPath(path: string) {
  return path.startsWith("/clinic");
}

async function syncProviderAuthState(admin: ReturnType<typeof getSupabaseAdminClient>, providerId: string, state: { suspended?: boolean; approvalStatus?: string }) {
  const providerResult = await admin.from("providers").select("profile_id").eq("id", providerId).maybeSingle();
  const profileId = providerResult.data?.profile_id;

  if (!profileId) {
    return;
  }

  const userResult = await admin.auth.admin.getUserById(profileId);
  const currentMetadata = userResult.data.user?.user_metadata ?? {};
  await admin.auth.admin.updateUserById(profileId, {
    user_metadata: { ...currentMetadata, ...(typeof state.suspended === "boolean" ? { suspended: state.suspended } : {}), ...(state.approvalStatus ? { approvalStatus: state.approvalStatus } : {}) },
  });
}

export async function suspendProviderAction(formData: FormData) {
  const payload = suspendProviderSchema.safeParse({
    providerId: String(formData.get("providerId") ?? ""),
    suspendedReason: String(formData.get("suspendedReason") ?? ""),
    redirectTo: String(formData.get("redirectTo") ?? "/clinic/providers"),
  });

  if (!payload.success) {
    toClinicRedirect("/clinic/providers", { error: payload.error.issues[0]?.message ?? "Unable to suspend provider." });
  }

  const { providerId, redirectTo, suspendedReason } = payload.data;
  const path = isSafeClinicPath(redirectTo) ? redirectTo : "/clinic/providers";
  await requireClinicAdminAccess();
  const admin = getSupabaseAdminClient();
  const suspendedAt = new Date().toISOString();

  const { error } = await admin.from("providers").update({
    accepting_patients: false,
    suspended: true,
    suspended_at: suspendedAt,
    suspended_reason: suspendedReason,
  }).eq("id", providerId);

  if (error) {
    toClinicRedirect(path, { error: "Unable to suspend this provider right now." });
  }

  await syncProviderAuthState(admin, providerId, { suspended: true });

  revalidatePath("/clinic/dashboard");
  revalidatePath("/clinic/providers");
  revalidatePath(`/clinic/providers/${providerId}`);
  toClinicRedirect(path, { message: "Provider suspended." });
}

export async function reactivateProviderAction(formData: FormData) {
  const payload = reactivateProviderSchema.safeParse({
    providerId: String(formData.get("providerId") ?? ""),
    redirectTo: String(formData.get("redirectTo") ?? "/clinic/providers"),
  });

  if (!payload.success) {
    toClinicRedirect("/clinic/providers", { error: payload.error.issues[0]?.message ?? "Unable to reactivate provider." });
  }

  const { providerId, redirectTo } = payload.data;
  const path = isSafeClinicPath(redirectTo) ? redirectTo : "/clinic/providers";
  await requireClinicAdminAccess();
  const admin = getSupabaseAdminClient();

  const { error } = await admin.from("providers").update({
    accepting_patients: true,
    suspended: false,
    suspended_at: null,
    suspended_reason: null,
  }).eq("id", providerId);

  if (error) {
    toClinicRedirect(path, { error: "Unable to reactivate this provider right now." });
  }

  await syncProviderAuthState(admin, providerId, { suspended: false });

  revalidatePath("/clinic/dashboard");
  revalidatePath("/clinic/providers");
  revalidatePath(`/clinic/providers/${providerId}`);
  toClinicRedirect(path, { message: "Provider reactivated." });
}

export async function createClinicInvitationAction(formData: FormData) {
  const payload = createInvitationSchema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    role: String(formData.get("role") ?? "provider"),
    redirectTo: String(formData.get("redirectTo") ?? "/clinic/invitations"),
  });

  if (!payload.success) {
    toClinicRedirect("/clinic/invitations", { error: payload.error.issues[0]?.message ?? "Unable to send invitation." });
  }

  const { email, role, redirectTo } = payload.data;
  const path = isSafeClinicPath(redirectTo) ? redirectTo : "/clinic/invitations";
  await requireClinicAdminAccess();
  const admin = getSupabaseAdminClient();

  const { error } = await admin.from("invitations").insert({
    email,
    role,
  });

  if (error) {
    toClinicRedirect(path, { error: "Unable to create invitation right now." });
  }

  revalidatePath("/clinic/dashboard");
  revalidatePath("/clinic/invitations");
  toClinicRedirect(path, { message: `Invitation sent to ${email}.` });
}

export async function markAllClinicNotificationsReadAction(formData: FormData) {
  const payload = redirectSchema.safeParse({
    redirectTo: String(formData.get("redirectTo") ?? "/clinic/dashboard"),
  });

  const path = payload.success && isSafeClinicPath(payload.data.redirectTo) ? payload.data.redirectTo : "/clinic/dashboard";
  await requireClinicAdminAccess();
  const admin = getSupabaseAdminClient();

  const { error } = await admin.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null);

  if (error) {
    toClinicRedirect(path, { error: "Unable to update notifications right now." });
  }

  revalidatePath("/clinic/dashboard");
  revalidatePath("/clinic/analytics");
  toClinicRedirect(path, { message: "All notifications marked as read." });
}

export async function createEducationalContentAction(formData: FormData) {
  const payload = contentSchema.safeParse({
    title: String(formData.get("title") ?? "").trim(),
    content: String(formData.get("content") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
    lifeStage: String(formData.get("lifeStage") ?? "").trim(),
    published: String(formData.get("published") ?? "false"),
    redirectTo: String(formData.get("redirectTo") ?? "/clinic/content"),
  });

  if (!payload.success) {
    toClinicRedirect("/clinic/content", { error: payload.error.issues[0]?.message ?? "Unable to save content." });
  }

  const { user } = await requireClinicAdminAccess();
  const admin = getSupabaseAdminClient();
  const { title, content, category, lifeStage, published, redirectTo } = payload.data;
  const path = isSafeClinicPath(redirectTo) ? redirectTo : "/clinic/content";

  const { error } = await admin.from("educational_content").insert({
    title,
    content,
    category,
    life_stage: lifeStage,
    published: published === "true",
    author_id: user.id,
  });

  if (error) {
    toClinicRedirect(path, { error: "Unable to create article right now." });
  }

  revalidatePath("/clinic/content");
  toClinicRedirect(path, { message: "Article saved." });
}

export async function toggleEducationalContentPublishAction(formData: FormData) {
  const payload = toggleContentSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    published: String(formData.get("published") ?? "false"),
    redirectTo: String(formData.get("redirectTo") ?? "/clinic/content"),
  });

  if (!payload.success) {
    toClinicRedirect("/clinic/content", { error: payload.error.issues[0]?.message ?? "Unable to update article." });
  }

  const admin = getSupabaseAdminClient();
  const { id, published, redirectTo } = payload.data;
  const path = isSafeClinicPath(redirectTo) ? redirectTo : "/clinic/content";
  await requireClinicAdminAccess();

  const { error } = await admin.from("educational_content").update({ published: published === "true" }).eq("id", id);

  if (error) {
    toClinicRedirect(path, { error: "Unable to update article status." });
  }

  revalidatePath("/clinic/content");
  toClinicRedirect(path, { message: "Article updated." });
}

export async function createSupportGroupAction(formData: FormData) {
  const payload = supportGroupSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
    moderatorId: String(formData.get("moderatorId") ?? "").trim() || undefined,
    redirectTo: String(formData.get("redirectTo") ?? "/clinic/support-groups"),
  });

  if (!payload.success) {
    toClinicRedirect("/clinic/support-groups", { error: payload.error.issues[0]?.message ?? "Unable to create group." });
  }

  const { name, description, category, moderatorId, redirectTo } = payload.data;
  const path = isSafeClinicPath(redirectTo) ? redirectTo : "/clinic/support-groups";
  await requireClinicAdminAccess();
  const admin = getSupabaseAdminClient();

  const { error } = await admin.from("support_groups").insert({
    name,
    description,
    category,
    moderator_id: moderatorId ?? null,
    active: true,
  });

  if (error) {
    toClinicRedirect(path, { error: "Unable to create support group right now." });
  }

  revalidatePath("/clinic/support-groups");
  toClinicRedirect(path, { message: "Support group created." });
}

export async function toggleSupportGroupAction(formData: FormData) {
  const payload = toggleSupportGroupSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    active: String(formData.get("active") ?? "false"),
    redirectTo: String(formData.get("redirectTo") ?? "/clinic/support-groups"),
  });

  if (!payload.success) {
    toClinicRedirect("/clinic/support-groups", { error: payload.error.issues[0]?.message ?? "Unable to update group." });
  }

  const { id, active, redirectTo } = payload.data;
  const path = isSafeClinicPath(redirectTo) ? redirectTo : "/clinic/support-groups";
  await requireClinicAdminAccess();
  const admin = getSupabaseAdminClient();

  const { error } = await admin.from("support_groups").update({ active: active === "true" }).eq("id", id);

  if (error) {
    toClinicRedirect(path, { error: "Unable to update support group right now." });
  }

  revalidatePath("/clinic/support-groups");
  toClinicRedirect(path, { message: "Support group updated." });
}

export async function createCareTemplateAction(formData: FormData) {
  const payload = careTemplateSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    specialty: String(formData.get("specialty") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    milestones: String(formData.get("milestones") ?? "").trim(),
    redirectTo: String(formData.get("redirectTo") ?? "/clinic/care-templates"),
  });

  if (!payload.success) {
    toClinicRedirect("/clinic/care-templates", { error: payload.error.issues[0]?.message ?? "Unable to save template." });
  }

  const { name, specialty, description, milestones, redirectTo } = payload.data;
  const path = isSafeClinicPath(redirectTo) ? redirectTo : "/clinic/care-templates";
  await requireClinicAdminAccess();
  const admin = getSupabaseAdminClient();

  let parsedMilestones: Array<{ title: string; description: string }> = [];

  try {
    parsedMilestones = JSON.parse(milestones);
  } catch {
    toClinicRedirect(path, { error: "Unable to parse milestones." });
  }

  const { error } = await admin.from("care_plans").insert({
    patient_id: null,
    provider_id: null,
    title: `${name} (${specialty})`,
    description,
    milestones: parsedMilestones,
    status: "template",
  });

  if (error) {
    toClinicRedirect(path, { error: "Unable to save care template right now." });
  }

  revalidatePath("/clinic/care-templates");
  toClinicRedirect(path, { message: "Care template saved." });
}


export async function approveProviderAction(formData: FormData) {
  const payload = approveProviderSchema.safeParse({
    providerId: String(formData.get("providerId") ?? ""),
    redirectTo: String(formData.get("redirectTo") ?? "/clinic/providers"),
  });

  if (!payload.success) {
    toClinicRedirect("/clinic/providers", { error: payload.error.issues[0]?.message ?? "Unable to approve provider." });
  }

  const { providerId, redirectTo } = payload.data;
  const path = isSafeClinicPath(redirectTo) ? redirectTo : "/clinic/providers";
  const { user } = await requireClinicAdminAccess();
  const admin = getSupabaseAdminClient();

  const providerResult = await admin.from("providers").select("profile_id").eq("id", providerId).maybeSingle();
  const providerProfileId = providerResult.data?.profile_id;

  const { error } = await admin.from("providers").update({
    approval_status: "approved",
    accepting_patients: true,
    approved_at: new Date().toISOString(),
    approved_by: user.id,
    rejection_reason: null,
  }).eq("id", providerId);

  if (error) {
    toClinicRedirect(path, { error: "Unable to approve this provider right now." });
  }

  await syncProviderAuthState(admin, providerId, { approvalStatus: "approved", suspended: false });

  if (providerProfileId) {
    await admin.from("notifications").insert({
      recipient_id: providerProfileId,
      actor_id: user.id,
      type: "provider_application_approved",
      title: "Application approved",
      body: "Welcome to Maven Clinic! You can now start seeing patients.",
      link: "/provider/dashboard",
    });
  }

  revalidatePath("/clinic/providers");
  revalidatePath("/clinic/dashboard");
  revalidatePath("/register/provider/pending");
  toClinicRedirect(path, { message: "Provider approved." });
}

export async function rejectProviderAction(formData: FormData) {
  const payload = rejectProviderSchema.safeParse({
    providerId: String(formData.get("providerId") ?? ""),
    rejectionReason: String(formData.get("rejectionReason") ?? ""),
    redirectTo: String(formData.get("redirectTo") ?? "/clinic/providers"),
  });

  if (!payload.success) {
    toClinicRedirect("/clinic/providers", { error: payload.error.issues[0]?.message ?? "Unable to reject provider." });
  }

  const { providerId, redirectTo, rejectionReason } = payload.data;
  const path = isSafeClinicPath(redirectTo) ? redirectTo : "/clinic/providers";
  const { user } = await requireClinicAdminAccess();
  const admin = getSupabaseAdminClient();

  const providerResult = await admin.from("providers").select("profile_id").eq("id", providerId).maybeSingle();
  const providerProfileId = providerResult.data?.profile_id;

  const { error } = await admin.from("providers").update({
    approval_status: "rejected",
    accepting_patients: false,
    approved_at: null,
    approved_by: null,
    rejection_reason: rejectionReason,
  }).eq("id", providerId);

  if (error) {
    toClinicRedirect(path, { error: "Unable to reject this provider right now." });
  }

  await syncProviderAuthState(admin, providerId, { approvalStatus: "rejected", suspended: false });

  if (providerProfileId) {
    await admin.from("notifications").insert({
      recipient_id: providerProfileId,
      actor_id: user.id,
      type: "provider_application_rejected",
      title: "Application update",
      body: "Please contact support for more information.",
      link: "/login",
    });
  }

  revalidatePath("/clinic/providers");
  revalidatePath("/clinic/dashboard");
  revalidatePath("/register/provider/pending");
  toClinicRedirect(path, { message: "Provider application updated." });
}