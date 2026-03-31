import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/rbac";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SubmissionFilters } from "./submission-filters";
import { formatFrequency } from "@/lib/format";

const STATUS_CLASSES: Record<string, string> = {
  pending:
    "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700",
  approved:
    "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700",
  rejected:
    "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700",
};

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const role = await getUserRole();
  if (role !== "admin" && role !== "bridge_manager") {
    redirect("/");
  }

  const params = await searchParams;
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("repeater_submissions")
    .select(
      "*, profiles!repeater_submissions_user_id_profile_fk(first_name, last_name, callsign)"
    )
    .order("created_at", { ascending: false });

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawSubmissions }: { data: any[] | null } = await query;

  const STATUS_ORDER: Record<string, number> = {
    pending: 0,
    approved: 1,
    rejected: 2,
  };

  const submissions = rawSubmissions?.slice().sort((a, b) => {
    const sa = STATUS_ORDER[a.status] ?? 9;
    const sb = STATUS_ORDER[b.status] ?? 9;
    if (sa !== sb) return sa - sb;
    return (
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  });

  return (
    <div className="space-y-4">
      <SubmissionFilters />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome/Callsign</TableHead>
              <TableHead>Frequenza</TableHead>
              <TableHead>Località</TableHead>
              <TableHead>Accessi</TableHead>
              <TableHead>Segnalato da</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions?.map((sub) => {
              const profile = sub.profiles as unknown as {
                first_name: string | null;
                last_name: string | null;
                callsign: string | null;
              } | null;
              const accesses = Array.isArray(sub.accesses)
                ? sub.accesses
                : [];
              return (
                <TableRow
                  key={sub.id}
                  className="group relative cursor-pointer"
                >
                  <TableCell className="font-mono font-medium">
                    <Link
                      href={`/submissions/${sub.id}`}
                      className="absolute inset-0"
                    >
                      <span className="sr-only">Vai alla segnalazione</span>
                    </Link>
                    {sub.callsign ?? sub.name ?? "—"}
                  </TableCell>
                  <TableCell>{formatFrequency(sub.frequency_hz)}</TableCell>
                  <TableCell>
                    {[sub.locality, sub.region].filter(Boolean).join(", ") ||
                      "—"}
                  </TableCell>
                  <TableCell>{accesses.length}</TableCell>
                  <TableCell>
                    {profile?.callsign ??
                      ([profile?.first_name, profile?.last_name]
                        .filter(Boolean)
                        .join(" ") ||
                      "Anonimo")}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={STATUS_CLASSES[sub.status]}
                    >
                      {sub.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(sub.created_at).toLocaleDateString("it-IT")}
                  </TableCell>
                </TableRow>
              );
            })}
            {(!submissions || submissions.length === 0) && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Nessuna segnalazione trovata.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
