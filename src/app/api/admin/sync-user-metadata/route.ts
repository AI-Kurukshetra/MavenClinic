import { apiError, apiSuccess } from "@/lib/api-response";
import { serverEnv } from "@/lib/env";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const expectedToken = `Bearer ${serverEnv.SUPABASE_SERVICE_ROLE_KEY}`;

  if (authHeader !== expectedToken) {
    return apiError(401, "unauthorized", "Unauthorized");
  }

  const admin = getSupabaseAdminClient();
  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, role, full_name, onboarding_complete");

  if (profilesError) {
    return apiError(500, "profile_lookup_failed", "Unable to load profiles for metadata sync.");
  }

  let synced = 0;
  const failures: Array<{ userId: string; message: string }> = [];

  for (const profile of profiles ?? []) {
    const userResult = await admin.auth.admin.getUserById(profile.id);

    if (userResult.error || !userResult.data.user) {
      failures.push({ userId: profile.id, message: userResult.error?.message ?? "User not found." });
      continue;
    }

    const currentMetadata = userResult.data.user.user_metadata ?? {};
    const updateResult = await admin.auth.admin.updateUserById(profile.id, {
      user_metadata: {
        ...currentMetadata,
        ...(profile.full_name ? { full_name: profile.full_name } : {}),
        ...(profile.role ? { role: profile.role } : {}),
        ...(profile.onboarding_complete !== null ? { onboardingComplete: profile.onboarding_complete } : {}),
      },
    });

    if (updateResult.error) {
      failures.push({ userId: profile.id, message: updateResult.error.message });
      continue;
    }

    synced += 1;
  }

  return apiSuccess({ synced, failed: failures.length, failures });
}
