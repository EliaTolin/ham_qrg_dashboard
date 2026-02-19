import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";

type SyncRun = {
  id: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  dry_run: boolean;
  total_messages: number;
  processed_messages: number;
  repeaters_processed: number;
  access_processed: number;
  fetch_errors: number;
  sync_errors: number;
  started_at: string;
  completed_at: string | null;
  created_at: string;
};

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  in_progress: "secondary",
  completed: "default",
  failed: "destructive",
};

function formatDuration(start: string, end: string | null): string {
  if (!end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

export default async function SyncPage() {
  const admin = await isAdmin();
  if (!admin) redirect("/");

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sync_runs" as never)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  console.log("[DEBUG sync_runs]", { count: data?.length, error });
  const runs = (data ?? []) as unknown as SyncRun[];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Sync Runs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Avviato</TableHead>
                <TableHead>Durata</TableHead>
                <TableHead className="text-right">Messaggi</TableHead>
                <TableHead className="text-right">Repeaters</TableHead>
                <TableHead className="text-right">Accessi</TableHead>
                <TableHead className="text-right">Errori</TableHead>
                <TableHead>Dry Run</TableHead>
                <TableHead>Run ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((run) => (
                <TableRow key={run.id}>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[run.status] ?? "outline"}>
                      {run.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {new Date(run.started_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDuration(run.started_at, run.completed_at)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {run.processed_messages}/{run.total_messages}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {run.repeaters_processed}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {run.access_processed}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {run.fetch_errors + run.sync_errors > 0 ? (
                      <span className="text-destructive">
                        {run.fetch_errors + run.sync_errors}
                      </span>
                    ) : (
                      "0"
                    )}
                  </TableCell>
                  <TableCell>
                    {run.dry_run ? (
                      <Badge variant="secondary">Yes</Badge>
                    ) : (
                      "No"
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {run.id.slice(0, 8)}
                  </TableCell>
                </TableRow>
              ))}
              {runs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    Nessun sync run trovato.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
