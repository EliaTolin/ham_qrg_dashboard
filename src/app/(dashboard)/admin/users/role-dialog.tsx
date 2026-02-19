"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { assignRole, removeRole } from "@/app/actions/roles";
import { toast } from "sonner";
import type { AppRole } from "@/lib/types";

const ROLES: AppRole[] = ["admin", "bridge_manager", "viewer"];

export function RoleDialog({
  userId,
  currentRole,
  userName,
}: {
  userId: string;
  currentRole: string;
  userName: string;
}) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<AppRole>(currentRole as AppRole);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSave() {
    setLoading(true);

    // Remove existing role if not viewer
    if (currentRole !== "viewer") {
      await removeRole(userId, currentRole as AppRole);
    }

    // Assign new role if not viewer
    if (role !== "viewer") {
      const result = await assignRole(userId, role);
      if (result?.error) {
        toast.error(result.error);
        setLoading(false);
        return;
      }
    }

    toast.success(`Role updated to ${role}`);
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Change Role
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Role</DialogTitle>
          <DialogDescription>
            Update role for {userName}
          </DialogDescription>
        </DialogHeader>
        <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
