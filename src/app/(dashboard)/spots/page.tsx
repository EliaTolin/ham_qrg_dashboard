import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Activity, ChevronLeft, ChevronRight } from "lucide-react";
import type { RepeaterSpot } from "@/lib/types";

const PAGE_SIZE = 50;

function formatDuration(
  started: string,
  closed: string | null,
  duration: number | null,
): string {
  if (duration != null) return `${duration} min`;
  const end = closed ? new Date(closed).getTime() : Date.now();
  const ms = end - new Date(started).getTime();
  if (ms < 0) return "—";
  const totalSeconds = Math.floor(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) return `${minutes}m ${seconds}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

export default async function SpotsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  const { data, count } = await supabase
    .from("repeater_spots" as never)
    .select("*", { count: "exact" })
    .order("started_at", { ascending: false })
    .range(from, to);

  const spots = (data ?? []) as unknown as RepeaterSpot[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const repeaterIds = [...new Set(spots.map((s) => s.repeater_id))];
  const { data: repeaters } = repeaterIds.length
    ? await supabase
        .from("repeaters")
        .select("id, callsign, name")
        .in("id", repeaterIds)
    : { data: [] };

  const repeaterMap = new Map<
    string,
    { callsign: string | null; name: string | null }
  >();
  repeaters?.forEach((r) =>
    repeaterMap.set(r.id, { callsign: r.callsign, name: r.name }),
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Storico Spot
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Callsign</TableHead>
                  <TableHead>Ponte</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Inizio</TableHead>
                  <TableHead>Fine</TableHead>
                  <TableHead className="text-right">Durata</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {spots.map((spot) => {
                  const repeater = repeaterMap.get(spot.repeater_id);
                  const isSpotted = spot.spotted_callsign !== null;
                  const isActive = spot.closed_at === null;
                  return (
                    <TableRow key={spot.id}>
                      <TableCell className="font-mono font-medium">
                        {isSpotted
                          ? spot.spotted_callsign
                          : spot.callsign_snapshot}
                        {isSpotted && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            da {spot.callsign_snapshot}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/repeaters/${spot.repeater_id}`}
                          className="hover:underline"
                        >
                          <span className="font-mono font-medium">
                            {repeater?.callsign ??
                              repeater?.name ??
                              spot.repeater_id.slice(0, 8)}
                          </span>
                          {repeater?.callsign && repeater?.name && (
                            <span className="ml-2 text-sm text-muted-foreground">
                              {repeater.name}
                            </span>
                          )}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {isSpotted ? "Spotted" : "Self-spot"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {isActive ? (
                          <Badge>Attivo</Badge>
                        ) : (
                          <Badge variant="secondary">Chiuso</Badge>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {new Date(spot.started_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {spot.closed_at
                          ? new Date(spot.closed_at).toLocaleString()
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatDuration(
                          spot.started_at,
                          spot.closed_at,
                          spot.duration_minutes,
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {spots.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      Nessuno spot trovato.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {total} spot{total !== 1 ? "s" : ""} totali
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild disabled={page <= 1}>
                  <Link
                    href={`?page=${page - 1}`}
                    aria-disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Precedente
                  </Link>
                </Button>
                <span className="text-sm text-muted-foreground">
                  Pagina {page} di {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  disabled={page >= totalPages}
                >
                  <Link
                    href={`?page=${page + 1}`}
                    aria-disabled={page >= totalPages}
                  >
                    Successiva
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
