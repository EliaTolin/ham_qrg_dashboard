import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/rbac";
import { UsersTable, type UserRow } from "./users-table";

export default async function UsersPage() {
  const admin = await isAdmin();
  if (!admin) redirect("/");

  const supabase = await createClient();

  const [{ data: profiles }, { data: userRoles }] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase.from("user_roles").select("*"),
  ]);

  const rolesMap = new Map<string, string>();
  userRoles?.forEach((ur) => {
    rolesMap.set(ur.user_id, ur.role);
  });

  // Fetch emails from auth.users via admin client
  const emailMap = new Map<string, string>();
  try {
    const adminClient = createAdminClient();
    const { data } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    data?.users?.forEach((u) => {
      if (u.email) emailMap.set(u.id, u.email);
    });
  } catch {
    // Service role key not available — emails won't be shown
  }

  const users: UserRow[] = (profiles ?? []).map((profile) => ({
    id: profile.id,
    callsign: profile.callsign,
    first_name: profile.first_name,
    last_name: profile.last_name,
    user_type: profile.user_type,
    email: emailMap.get(profile.id) ?? null,
    role: rolesMap.get(profile.id) ?? "viewer",
  }));

  return <UsersTable users={users} />;
}
