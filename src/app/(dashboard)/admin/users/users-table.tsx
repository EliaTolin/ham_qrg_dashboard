"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RoleDialog } from "./role-dialog";

export interface UserRow {
  id: string;
  callsign: string | null;
  first_name: string | null;
  last_name: string | null;
  user_type: string | null;
  email: string | null;
  role: string;
}

export function UsersTable({ users }: { users: UserRow[] }) {
  const [query, setQuery] = useState("");

  const q = query.toLowerCase().trim();
  const filtered = q
    ? users.filter((u) => {
        return (
          u.id.toLowerCase().includes(q) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.callsign && u.callsign.toLowerCase().includes(q)) ||
          (u.first_name && u.first_name.toLowerCase().includes(q)) ||
          (u.last_name && u.last_name.toLowerCase().includes(q))
        );
      })
    : users;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca per email, ID, callsign, nome..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <p className="text-sm text-muted-foreground whitespace-nowrap">
          {filtered.length} {filtered.length === 1 ? "utente" : "utenti"}
          {q && filtered.length !== users.length && ` su ${users.length}`}
        </p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email / Callsign</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Ruolo</TableHead>
              <TableHead>Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="space-y-0.5">
                    {user.email && (
                      <div className="text-sm">{user.email}</div>
                    )}
                    <div className="font-mono text-xs text-muted-foreground">
                      {user.callsign ?? user.id.slice(0, 8)}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {[user.first_name, user.last_name]
                    .filter(Boolean)
                    .join(" ") || "—"}
                </TableCell>
                <TableCell>
                  {user.user_type ? (
                    <Badge variant="outline">{user.user_type}</Badge>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{user.role}</Badge>
                </TableCell>
                <TableCell>
                  <RoleDialog
                    userId={user.id}
                    currentRole={user.role}
                    userName={
                      user.callsign ??
                      [user.first_name, user.last_name]
                        .filter(Boolean)
                        .join(" ") ??
                      "User"
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  {q ? "Nessun risultato trovato." : "Nessun utente trovato."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
