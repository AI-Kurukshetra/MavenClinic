"use client";

import { useEffect } from "react";
import { ensureBrowserSessionIsHealthy } from "@/lib/supabase/client";

export function AuthSessionSanitizer() {
  useEffect(() => {
    void ensureBrowserSessionIsHealthy();
  }, []);

  return null;
}
