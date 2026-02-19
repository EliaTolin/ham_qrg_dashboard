import { createClient } from "@/lib/supabase/server";
import type { AppPermission, AppRole } from "./types";

const PERMISSION_MAP: Record<string, AppPermission[]> = {
  admin: [
    "repeaters.write",
    "repeaters.delete",
    "networks.write",
    "networks.delete",
    "reports.manage",
    "users.manage",
    "sync.trigger",
  ],
  bridge_manager: ["repeaters.write", "networks.write", "reports.manage"],
  viewer: [],
};

export async function getUserRole(): Promise<AppRole> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    console.log("[DEBUG getUserRole] no session found");
    return "viewer";
  }
  const payload = session.access_token
    ? JSON.parse(atob(session.access_token.split(".")[1]))
    : {};
  console.log("[DEBUG getUserRole] JWT payload user_role:", payload?.user_role);
  const role = payload?.user_role;
  return (role as AppRole) ?? "viewer";
}

export async function hasRole(role: AppRole): Promise<boolean> {
  const userRole = await getUserRole();
  return userRole === role;
}

export async function isAdmin(): Promise<boolean> {
  return hasRole("admin");
}

export async function hasPermission(
  permission: AppPermission
): Promise<boolean> {
  const userRole = await getUserRole();
  const permissions = PERMISSION_MAP[userRole] ?? [];
  return permissions.includes(permission);
}
