import { cache } from "react";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const getFeatureFlagEnabled = cache(async (key: string, fallback = true) => {
  try {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from("feature_flags")
      .select("enabled")
      .eq("key", key)
      .maybeSingle();

    if (error) {
      return fallback;
    }

    return data?.enabled ?? fallback;
  } catch {
    return fallback;
  }
});