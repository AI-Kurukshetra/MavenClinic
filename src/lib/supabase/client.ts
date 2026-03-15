import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";

let supabaseClient: ReturnType<typeof createBrowserClient> | undefined;

export function getSupabaseBrowserClient() {
  if (!supabaseClient) {
    supabaseClient = createBrowserClient(
      publicEnv.NEXT_PUBLIC_SUPABASE_URL,
      publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
