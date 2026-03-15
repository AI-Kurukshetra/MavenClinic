"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth";
import { publicEnv } from "@/lib/env";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const inviteEmployeeSchema = z.object({
  email: z.string().email("Enter a valid work email."),
  page: z.coerce.number().int().min(1).default(1),
});

function toEmployeesRedirect(page: number, values: Record<string, string>): never {
  const search = new URLSearchParams({ page: String(page), ...values });
  redirect(`/employer/employees?${search.toString()}`);
}

export async function inviteEmployeeAction(formData: FormData) {
  const payload = inviteEmployeeSchema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    page: String(formData.get("page") ?? "1"),
  });

  if (!payload.success) {
    toEmployeesRedirect(1, { error: payload.error.issues[0]?.message ?? "Unable to process the invite." });
  }

  const { email, page } = payload.data;
  const [user, profile] = await Promise.all([getCurrentUser(), getCurrentProfile()]);

  if (!user || profile?.role !== "employer_admin") {
    toEmployeesRedirect(page, { error: "Only employer admins can invite employees." });
  }

  const admin = getSupabaseAdminClient();
  const { data: employer, error: employerError } = await admin
    .from("employers")
    .select("id, company_name")
    .eq("id", profile?.employer_id ?? "")
    .maybeSingle();

  if (employerError || !employer?.id) {
    toEmployeesRedirect(page, { error: employerError?.message ?? "Missing employer record for this admin." });
  }

  let invitationStored = false;
  let inviteSent = false;
  let warning: string | null = null;

  const inviteInsert = await admin
    .from("invitations")
    .insert({
      email,
      role: "patient",
      employer_id: employer.id,
    } as never);

  if (!inviteInsert.error) {
    invitationStored = true;
  } else {
    warning = "Employee invite tracking needs the latest invitation schema before records can be stored.";
  }

  const authInvite = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${publicEnv.NEXT_PUBLIC_APP_URL}/signup`,
    data: {
      role: "patient",
      employerId: employer.id,
      employerName: employer.company_name,
    },
  });

  if (!authInvite.error) {
    inviteSent = true;
  } else if (!warning) {
    warning = "The invite record was saved, but the email could not be sent automatically.";
  }

  if (!invitationStored && !inviteSent) {
    toEmployeesRedirect(page, { error: "Unable to create the employee invite right now." });
  }

  revalidatePath("/employer/employees");
  revalidatePath("/employer/dashboard");
  toEmployeesRedirect(page, {
    message: inviteSent ? `Invitation prepared for ${email}.` : `Invite record created for ${email}.`,
    ...(warning ? { warning } : {}),
  });
}

