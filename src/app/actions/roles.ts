"use server";

import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/rbac";
import type { AppRole } from "@/lib/types";

export async function assignRole(userId: string, role: AppRole) {
  const admin = await isAdmin();
  if (!admin) {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("user_roles")
    .upsert({ user_id: userId, role }, { onConflict: "user_id,role" });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function removeRole(userId: string, role: AppRole) {
  const admin = await isAdmin();
  if (!admin) {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("user_roles")
    .delete()
    .eq("user_id", userId)
    .eq("role", role);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
