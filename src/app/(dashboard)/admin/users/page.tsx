import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/rbac";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RoleDialog } from "./role-dialog";

export default async function UsersPage() {
  const admin = await isAdmin();
  if (!admin) redirect("/");

  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const { data: userRoles } = await supabase.from("user_roles").select("*");

  const rolesMap = new Map<string, string>();
  userRoles?.forEach((ur) => {
    rolesMap.set(ur.user_id, ur.role);
  });

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email / Callsign</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles?.map((profile) => {
              const currentRole = rolesMap.get(profile.id) ?? "viewer";
              return (
                <TableRow key={profile.id}>
                  <TableCell>
                    <span className="font-mono">
                      {profile.callsign ?? profile.id.slice(0, 8)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {[profile.first_name, profile.last_name]
                      .filter(Boolean)
                      .join(" ") || "—"}
                  </TableCell>
                  <TableCell>
                    {profile.user_type ? (
                      <Badge variant="outline">{profile.user_type}</Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{currentRole}</Badge>
                  </TableCell>
                  <TableCell>
                    <RoleDialog
                      userId={profile.id}
                      currentRole={currentRole}
                      userName={
                        profile.callsign ??
                        [profile.first_name, profile.last_name]
                          .filter(Boolean)
                          .join(" ") ??
                        "User"
                      }
                    />
                  </TableCell>
                </TableRow>
              );
            })}
            {(!profiles || profiles.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
