import { onboardingSchema } from "@/lib/onboarding";
import { apiError, apiSuccess } from "@/lib/api-response";
import { sanitizeNullableText, sanitizeText } from "@/lib/sanitize";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function isMissingColumnError(error: { message?: string } | null) {
  return Boolean(error?.message?.includes("Could not find the '") && error?.message?.includes("column"));
}

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return apiError(401, "unauthorized", "Unauthorized");
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
    const admin = getSupabaseAdminClient();
    const fullPayload = {
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
      role: "patient",
    };

    let profileError = (await admin.from("profiles").upsert(fullPayload)).error;

    if (profileError && isMissingColumnError(profileError)) {
      profileError = (
        await admin.from("profiles").upsert({
          id: user.id,
          full_name: data.fullName,
          date_of_birth: data.dateOfBirth,
          onboarding_complete: true,
          role: "patient",
        })
      ).error;
    }

    if (profileError) {
      return apiError(500, "profile_update_failed", "Unable to save onboarding details.");
    }

    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...(user.user_metadata ?? {}),
        full_name: data.fullName,
        onboardingComplete: true,
      },
    });

    return apiSuccess({ ok: true });
  } catch {
    return apiError(500, "onboarding_save_failed", "Unable to save onboarding details.");
  }
}

