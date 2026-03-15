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

  const { data: invitation, error: inviteError } = await admin
    .from("invitations")
    .insert({
      email,
      role: "patient",
      employer_id: employer.id,
      invited_by: user.id,
      metadata: {
        employer_id: employer.id,
        employer_name: employer.company_name,
      },
    })
    .select("token")
    .single();

  if (inviteError || !invitation?.token) {
    toEmployeesRedirect(page, { error: inviteError?.message ?? "Unable to create the employee invite right now." });
  }

  const inviteLink = `${publicEnv.NEXT_PUBLIC_APP_URL}/signup?token=${invitation.token}`;

  revalidatePath("/employer/employees");
  revalidatePath("/employer/dashboard");
  toEmployeesRedirect(page, {
    message: `Invitation prepared for ${email}.`,
    inviteLink,
  });
}
