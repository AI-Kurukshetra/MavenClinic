import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function syncMetadata() {
  const { data: profiles, error } = await supabase.from("profiles").select("id, role, full_name, onboarding_complete");

  if (error) {
    throw error;
  }

  for (const profile of profiles ?? []) {
    const userResult = await supabase.auth.admin.getUserById(profile.id);

    if (userResult.error || !userResult.data.user) {
      console.error("Failed to load auth user:", profile.id, userResult.error?.message ?? "not found");
      continue;
    }

    const currentMetadata = userResult.data.user.user_metadata ?? {};
    const updateResult = await supabase.auth.admin.updateUserById(profile.id, {
      user_metadata: {
        ...currentMetadata,
        ...(profile.role ? { role: profile.role } : {}),
        ...(profile.full_name ? { full_name: profile.full_name } : {}),
        ...(profile.onboarding_complete !== null ? { onboardingComplete: profile.onboarding_complete } : {}),
      },
    });

    if (updateResult.error) {
      console.error("Failed to sync:", profile.id, updateResult.error.message);
      continue;
    }

    console.log("Synced:", profile.id, profile.role ?? "patient");
  }
}

syncMetadata().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
