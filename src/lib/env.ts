function resolveAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined) ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ??
    "https://maven-clinic.vercel.app"
  );
}

export const publicEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  NEXT_PUBLIC_APP_URL: resolveAppUrl(),
  NEXT_PUBLIC_AI_INSIGHTS_ENABLED: process.env.NEXT_PUBLIC_AI_INSIGHTS_ENABLED ?? "false",
};

export const serverEnv = {
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? "",
  DAILY_API_KEY: process.env.DAILY_API_KEY ?? "",
};

if (process.env.NODE_ENV === "development") {
  console.log("APP_URL:", publicEnv.NEXT_PUBLIC_APP_URL);
}
