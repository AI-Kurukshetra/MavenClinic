function requireValue(name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY", value: string | undefined) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const nextPublicSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const nextPublicSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const env = {
  NEXT_PUBLIC_SUPABASE_URL: requireValue("NEXT_PUBLIC_SUPABASE_URL", nextPublicSupabaseUrl),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: requireValue("NEXT_PUBLIC_SUPABASE_ANON_KEY", nextPublicSupabaseAnonKey),
  NEXT_PUBLIC_AI_INSIGHTS_ENABLED: process.env.NEXT_PUBLIC_AI_INSIGHTS_ENABLED ?? "false",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  DAILY_API_KEY: process.env.DAILY_API_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
};
