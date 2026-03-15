"use server";

import { revalidatePath } from "next/cache";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireClinicAdminAccess } from "@/lib/clinic-admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const suspendProviderSchema = z.object({
  providerId: z.string().uuid(),
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

export async function suspendProviderAction(formData: FormData) {
  const payload = suspendProviderSchema.safeParse({
    providerId: String(formData.get("providerId") ?? ""),
    redirectTo: String(formData.get("redirectTo") ?? "/clinic/providers"),
  });

  if (!payload.success) {
    toClinicRedirect("/clinic/providers", { error: payload.error.issues[0]?.message ?? "Unable to suspend provider." });
  }

  const { providerId, redirectTo } = payload.data;
  const path = isSafeClinicPath(redirectTo) ? redirectTo : "/clinic/providers";
  await requireClinicAdminAccess();
  const admin = getSupabaseAdminClient();

  const { error } = await admin.from("providers").update({ accepting_patients: false }).eq("id", providerId);

  if (error) {
    toClinicRedirect(path, { error: "Unable to suspend this provider right now." });
  }

  revalidatePath("/clinic/dashboard");
  revalidatePath("/clinic/providers");
  revalidatePath(`/clinic/providers/${providerId}`);
  toClinicRedirect(path, { message: "Provider access updated." });
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
