import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type PatientInvitation = {
  id: string;
  email: string;
  role: "patient";
  token: string;
  accepted: boolean | null;
  expires_at: string | null;
  employer_id: string | null;
  metadata: {
    employer_id?: string;
    employer_name?: string;
  } | null;
};

export function normalizePatientInvitationToken(token: string | null | undefined) {
  return token?.trim() ?? "";
}

export function getPatientInvitationError(invitation: PatientInvitation | null) {
  if (!invitation) {
    return "This employee invite is invalid.";
  }

  if (invitation.accepted) {
    return "This employee invite has already been used.";
  }

  if (invitation.expires_at && new Date(invitation.expires_at).getTime() <= Date.now()) {
    return "This employee invite has expired.";
  }

  const employerId = invitation.metadata?.employer_id ?? invitation.employer_id;
  if (!employerId) {
    return "This employee invite is missing employer details.";
  }

  return null;
}

export async function getPatientInvitationByToken(token: string) {
  if (!token) {
    return null;
  }

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("invitations")
    .select("id, email, role, token, accepted, expires_at, employer_id, metadata")
    .eq("token", token)
    .eq("role", "patient")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as PatientInvitation;
}

export async function getValidPatientInvitation(token: string) {
  const invitation = await getPatientInvitationByToken(token);
  const error = getPatientInvitationError(invitation);

  return {
    invitation: error ? null : invitation,
    error,
  };
}
