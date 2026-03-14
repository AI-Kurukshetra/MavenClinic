import { onboardingSchema } from "@/lib/onboarding";
import { requireApiUser } from "@/lib/api-auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { sanitizeNullableText, sanitizeText } from "@/lib/sanitize";

export async function POST(request: Request) {
  try {
    const authResult = await requireApiUser();

    if ("error" in authResult) {
      return authResult.error;
    }

    const { user, supabase, profile } = authResult.context;

    if (profile?.role && profile.role !== "patient") {
      return apiError(403, "forbidden", "Forbidden");
    }

    const body = await request.json();
    const parsed = onboardingSchema.safeParse({
      ...body,
      fullName: sanitizeText(typeof body?.fullName === "string" ? body.fullName : ""),
      pronouns: sanitizeText(typeof body?.pronouns === "string" ? body.pronouns : ""),
      languagePreference: sanitizeText(typeof body?.languagePreference === "string" ? body.languagePreference : ""),
      medications: sanitizeText(typeof body?.medications === "string" ? body.medications : ""),
      memberId: sanitizeText(typeof body?.memberId === "string" ? body.memberId : ""),
      preferredLanguage: sanitizeText(typeof body?.preferredLanguage === "string" ? body.preferredLanguage : ""),
      genderPreference: sanitizeText(typeof body?.genderPreference === "string" ? body.genderPreference : ""),
    });

    if (!parsed.success) {
      return apiError(400, "invalid_onboarding_data", parsed.error.issues[0]?.message ?? "Invalid onboarding data.");
    }

    const data = parsed.data;

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: data.fullName,
      date_of_birth: data.dateOfBirth,
      pronouns: sanitizeNullableText(data.pronouns),
      language_preference: sanitizeNullableText(data.languagePreference),
      health_goals: data.healthGoals,
      existing_conditions: data.conditions,
      current_medications: sanitizeNullableText(data.medications),
      insurance_carrier: data.insuranceCarrier,
      insurance_member_id: sanitizeNullableText(data.memberId),
      specialty_needed: data.specialtyNeeded,
      preferred_language: sanitizeNullableText(data.preferredLanguage),
      provider_gender_preference: sanitizeNullableText(data.genderPreference),
      onboarding_complete: true,
      role: profile?.role ?? "patient",
    });

    if (profileError) {
      return apiError(500, "profile_update_failed", "Unable to save onboarding details.");
    }

    return apiSuccess({ ok: true });
  } catch {
    return apiError(500, "onboarding_save_failed", "Unable to save onboarding details.");
  }
}