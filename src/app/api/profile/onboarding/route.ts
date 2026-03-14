import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { onboardingSchema } from "@/lib/onboarding";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = onboardingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid onboarding data." }, { status: 400 });
  }

  const supabase = await getSupabaseServerClient();
  const data = parsed.data;

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    full_name: data.fullName,
    date_of_birth: data.dateOfBirth,
    pronouns: data.pronouns,
    language_preference: data.languagePreference,
    health_goals: data.healthGoals,
    existing_conditions: data.conditions,
    current_medications: data.medications,
    insurance_carrier: data.insuranceCarrier,
    insurance_member_id: data.memberId || null,
    specialty_needed: data.specialtyNeeded,
    preferred_language: data.preferredLanguage,
    provider_gender_preference: data.genderPreference,
    onboarding_complete: true,
    role: "patient",
  });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
