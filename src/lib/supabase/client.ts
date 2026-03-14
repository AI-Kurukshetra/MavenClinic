import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

let supabaseClient: ReturnType<typeof createClient> | undefined;

export function getSupabaseBrowserClient() {
  if (!supabaseClient) {
    supabaseClient = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      },
    );
  }

  return supabaseClient;
}

