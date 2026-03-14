import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const providerSpecialties = [
  "ob_gyn",
  "fertility",
  "mental_health",
  "nutrition",
  "lactation",
  "menopause",
] as const;

export type ProviderSpecialtyValue = (typeof providerSpecialties)[number];

export type ProviderInvitation = {
  id: string;
  email: string;
  role: "provider";
  token: string;
  accepted: boolean | null;
  expires_at: string | null;
};

export function normalizeInvitationToken(token: string | null | undefined) {
  return token?.trim() ?? "";
}

export function isProviderSpecialty(value: string): value is ProviderSpecialtyValue {
  return providerSpecialties.includes(value as ProviderSpecialtyValue);
}

export function getProviderSpecialtyLabel(value: ProviderSpecialtyValue) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getInvitationError(invitation: ProviderInvitation | null) {
  if (!invitation) {
    return "This provider invite is invalid.";
  }

  if (invitation.accepted) {
    return "This provider invite has already been used.";
  }

  if (invitation.expires_at && new Date(invitation.expires_at).getTime() <= Date.now()) {
    return "This provider invite has expired.";
  }

  return null;
}

export async function getProviderInvitationByToken(token: string) {
  if (!token) {
    return null;
  }

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("invitations")
    .select("id, email, role, token, accepted, expires_at")
    .eq("token", token)
    .eq("role", "provider")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as ProviderInvitation;
}

export async function getValidProviderInvitation(token: string) {
  const invitation = await getProviderInvitationByToken(token);
  const error = getInvitationError(invitation);

  return {
    invitation: error ? null : invitation,
    error,
  };
}