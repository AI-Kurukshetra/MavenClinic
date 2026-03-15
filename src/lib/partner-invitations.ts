import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getPartnerAccessPortalLabel, isPartnerAccessLevel, type PartnerAccessLevel } from "@/lib/partner-access";

export type PartnerInvitation = {
  id: string;
  email: string;
  role: "partner";
  token: string;
  accepted: boolean | null;
  expires_at: string | null;
  metadata: {
    patient_id?: string;
    access_level?: PartnerAccessLevel;
    patient_name?: string;
    partner_name?: string;
    message?: string;
  } | null;
};

export function normalizePartnerInvitationToken(token: string | null | undefined) {
  return token?.trim() ?? "";
}

export function getPartnerInvitationError(invitation: PartnerInvitation | null) {
  if (!invitation) {
    return "This partner invite is invalid.";
  }

  if (invitation.accepted) {
    return "This partner invite has already been used.";
  }

  if (invitation.expires_at && new Date(invitation.expires_at).getTime() <= Date.now()) {
    return "This partner invite has expired.";
  }

  if (!invitation.metadata?.patient_id || !invitation.metadata?.access_level || !isPartnerAccessLevel(invitation.metadata.access_level)) {
    return "This partner invite is missing the required access details.";
  }

  return null;
}

export async function getPartnerInvitationByToken(token: string) {
  if (!token) {
    return null;
  }

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("invitations")
    .select("id, email, role, token, accepted, expires_at, metadata")
    .eq("token", token)
    .eq("role", "partner")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as PartnerInvitation;
}

export async function getValidPartnerInvitation(token: string) {
  const invitation = await getPartnerInvitationByToken(token);
  const error = getPartnerInvitationError(invitation);

  return {
    invitation: error ? null : invitation,
    error,
  };
}

export function getPartnerInvitationAccessLabel(invitation: PartnerInvitation | null) {
  if (!invitation?.metadata?.access_level || !isPartnerAccessLevel(invitation.metadata.access_level)) {
    return "No access selected";
  }

  return getPartnerAccessPortalLabel(invitation.metadata.access_level);
}
