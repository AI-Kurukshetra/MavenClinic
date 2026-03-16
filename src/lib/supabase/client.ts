import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";

let supabaseClient: ReturnType<typeof createBrowserClient> | undefined;
let sessionRecoveryPromise: Promise<void> | null = null;

function isInvalidRefreshTokenError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const normalized = message.toLowerCase();
  return normalized.includes("invalid refresh token") || normalized.includes("refresh token not found");
}

function getAuthStorageKey(url: string) {
  try {
    const host = new URL(url).hostname;
    const projectRef = host.split(".")[0];
    return `sb-${projectRef}-auth-token`;
  } catch {
    return null;
  }
}

function clearStaleStoredSession() {
  if (typeof window === "undefined") {
    return;
  }

  const storageKey = getAuthStorageKey(publicEnv.NEXT_PUBLIC_SUPABASE_URL);
  if (!storageKey) {
    return;
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return;
    }

    const parsed = JSON.parse(raw) as { refresh_token?: unknown } | null;
    if (!parsed || typeof parsed.refresh_token !== "string" || parsed.refresh_token.length === 0) {
      console.warn("Removing stale Supabase auth storage before client init.");
      window.localStorage.removeItem(storageKey);
    }
  } catch {
    console.warn("Removing unreadable Supabase auth storage before client init.");
    window.localStorage.removeItem(storageKey);
  }
}

async function recoverBrowserSession(client: ReturnType<typeof createBrowserClient>) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const { error } = await client.auth.getSession();
    if (error && isInvalidRefreshTokenError(error)) {
      console.warn("Clearing stale browser auth session:", error.message);
      await client.auth.signOut({ scope: "local" });
    }
  } catch (error) {
    if (isInvalidRefreshTokenError(error)) {
      console.warn("Clearing stale browser auth session after refresh failure.");
      await client.auth.signOut({ scope: "local" });
      return;
    }

    console.error("Browser session recovery failed:", error);
  }
}

export function ensureBrowserSessionIsHealthy() {
  const client = getSupabaseBrowserClient();

  if (!sessionRecoveryPromise) {
    sessionRecoveryPromise = recoverBrowserSession(client).finally(() => {
      sessionRecoveryPromise = null;
    });
  }

  return sessionRecoveryPromise;
}

export function getSupabaseBrowserClient() {
  if (!supabaseClient) {
    clearStaleStoredSession();

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
