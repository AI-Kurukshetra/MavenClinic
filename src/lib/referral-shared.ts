import type { Route } from "next";
import { z } from "zod";

export const referralSpecialties = [
  "ob_gyn",
  "fertility",
  "mental_health",
  "nutrition",
  "menopause",
  "lactation",
  "general",
  "imaging",
  "lab",
  "specialist",
] as const;

export const referralStatusValues = ["pending", "accepted", "completed", "cancelled"] as const;
export const referralUrgencyValues = ["routine", "urgent", "emergency"] as const;

export const referralPayloadSchema = z.object({
  patientId: z.string().uuid("Select a valid patient."),
  referredToSpecialty: z.enum(referralSpecialties, { message: "Choose the referral specialty." }),
  referredToProviderId: z.string().uuid().optional().nullable(),
  reason: z.string().min(20, "Add at least 20 characters for the referral reason."),
  urgency: z.enum(referralUrgencyValues, { message: "Choose the referral urgency." }),
  clinicalNotes: z.string().max(2000).optional().nullable(),
});

export type ReferralPayload = z.infer<typeof referralPayloadSchema>;

export type ProviderReferralListItem = {
  id: string;
  patientId: string;
  patientName: string;
  patientAvatarUrl: string | null;
  referredToSpecialty: string;
  referredToSpecialtyKey: string;
  referredToProviderId: string | null;
  referredToProviderName: string | null;
  reason: string;
  urgency: (typeof referralUrgencyValues)[number];
  status: (typeof referralStatusValues)[number];
  clinicalNotes: string | null;
  createdAt: string;
};

export type ProviderReferralPatientOption = {
  id: string;
  name: string;
  avatarUrl: string | null;
  lastVisit: string;
};

export type ProviderReferralProviderOption = {
  id: string;
  name: string;
  specialty: string;
  specialtyKey: string;
};

export type ProviderReferralsPageData = {
  providerName: string;
  referrals: ProviderReferralListItem[];
  patients: ProviderReferralPatientOption[];
  providers: ProviderReferralProviderOption[];
};

export type PatientReferralListItem = {
  id: string;
  referringProviderName: string;
  referringProviderSpecialty: string;
  referredToSpecialty: string;
  referredToSpecialtyKey: string;
  referredToProviderName: string | null;
  reason: string;
  urgency: (typeof referralUrgencyValues)[number];
  status: (typeof referralStatusValues)[number];
  createdAt: string;
};

export type PatientReferralsPageData = {
  referrals: PatientReferralListItem[];
};

export function formatReferralSpecialty(value: string | null | undefined) {
  return value ? value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase()) : "General";
}

export function buildReferralBookingHref(specialty: string): Route {
  return `/appointments?specialty=${encodeURIComponent(specialty)}` as Route;
}
