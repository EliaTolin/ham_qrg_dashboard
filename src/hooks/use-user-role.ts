"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AppRole } from "@/lib/types";

export function useUserRole() {
  const [role, setRole] = useState<AppRole>("viewer");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function getRole() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        try {
          const payload = JSON.parse(
            atob(session.access_token.split(".")[1])
          );
          setRole((payload.user_role as AppRole) ?? "viewer");
        } catch {
          setRole("viewer");
        }
      }
      setLoading(false);
    }

    getRole();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        try {
          const payload = JSON.parse(
            atob(session.access_token.split(".")[1])
          );
          setRole((payload.user_role as AppRole) ?? "viewer");
        } catch {
          setRole("viewer");
        }
      } else {
        setRole("viewer");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { role, loading };
}
