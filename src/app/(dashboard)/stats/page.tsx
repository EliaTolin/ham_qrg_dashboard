import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  UserX,
  Heart,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Radio,
  Activity,
} from "lucide-react";

function Stat({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`rounded-md p-1.5 ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

export default async function StatsPage() {
  const supabase = await createClient();

  const [
    { count: profileCount },
    { data: profiles },
    { count: feedbackCount },
    { data: feedbackDetailed },
    { count: favoriteCount },
    { count: reportCount },
    { count: repeaterCount },
    { count: spotCount },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null),
    supabase
      .from("profiles")
      .select("callsign")
      .is("deleted_at", null),
    supabase
      .from("repeater_feedback")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("repeater_feedback")
      .select("user_id, repeater_id, type"),
    supabase
      .from("user_favorite_repeaters")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("repeater_reports")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("repeaters")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("repeater_spots" as never)
      .select("*", { count: "exact", head: true }),
  ]);

  const totalUsers = profileCount ?? 0;
  const withCallsign = profiles?.filter((p) => p.callsign).length ?? 0;
  const anonymousUsers = totalUsers - withCallsign;

  let totalLikes = 0;
  let totalDowns = 0;
  const feedbackPerRepeater: Record<string, { likes: number; downs: number }> = {};

  feedbackDetailed?.forEach((fb) => {
    if (fb.type === "like") totalLikes++;
    else totalDowns++;

    if (!feedbackPerRepeater[fb.repeater_id]) {
      feedbackPerRepeater[fb.repeater_id] = { likes: 0, downs: 0 };
    }
    if (fb.type === "like") feedbackPerRepeater[fb.repeater_id].likes++;
    else feedbackPerRepeater[fb.repeater_id].downs++;
  });

  // Get top 15 repeater IDs by feedback count, then fetch their details
  const top15Ids = Object.entries(feedbackPerRepeater)
    .sort(([, a], [, b]) => (b.likes + b.downs) - (a.likes + a.downs))
    .slice(0, 15)
    .map(([id]) => id);

  const { data: topRepeaters } = top15Ids.length > 0
    ? await supabase
        .from("repeaters")
        .select("id, callsign, name")
        .in("id", top15Ids)
    : { data: [] };

  const repeaterMap = new Map<string, { callsign: string | null; name: string | null }>();
  topRepeaters?.forEach((r) => repeaterMap.set(r.id, { callsign: r.callsign, name: r.name }));

  const ranking = top15Ids.map((id) => ({
    id,
    callsign: repeaterMap.get(id)?.callsign ?? null,
    name: repeaterMap.get(id)?.name ?? null,
    total: feedbackPerRepeater[id].likes + feedbackPerRepeater[id].downs,
    likes: feedbackPerRepeater[id].likes,
    downs: feedbackPerRepeater[id].downs,
  }));

  return (
    <div className="space-y-6">
      {/* Utenti */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Stat title="Utenti" value={totalUsers} icon={Users} color="bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400" />
        <Stat title="Anonimi" value={anonymousUsers} icon={UserX} color="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" />
        <Stat title="Ponti" value={repeaterCount ?? 0} icon={Radio} color="bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400" />
        <Stat title="Preferiti salvati" value={favoriteCount ?? 0} icon={Heart} color="bg-pink-100 text-pink-600 dark:bg-pink-950 dark:text-pink-400" />
      </div>

      {/* Attivita' */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Stat title="Feedback" value={feedbackCount ?? 0} icon={MessageSquare} color="bg-cyan-100 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400" />
        <Stat title="Like" value={totalLikes} icon={ThumbsUp} color="bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400" />
        <Stat title="Down" value={totalDowns} icon={ThumbsDown} color="bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400" />
        <Stat title="Segnalazioni" value={reportCount ?? 0} icon={Flag} color="bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400" />
      </div>

      {/* Spot */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Stat title="Spot totali" value={spotCount ?? 0} icon={Activity} color="bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400" />
      </div>

      <Separator />

      {/* Classifica ponti */}
      {ranking.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Radio className="h-5 w-5" />
            Ponti con piu' feedback
          </h2>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Ponte</TableHead>
                    <TableHead className="text-right">Like</TableHead>
                    <TableHead className="text-right">Down</TableHead>
                    <TableHead className="text-right">Totale</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ranking.map((r, i) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium text-muted-foreground">
                        {i + 1}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/repeaters/${r.id}`}
                          className="hover:underline"
                        >
                          <span className="font-mono font-medium">
                            {r.callsign ?? r.name ?? r.id.slice(0, 8)}
                          </span>
                          {r.callsign && r.name && (
                            <span className="ml-2 text-muted-foreground text-sm">
                              {r.name}
                            </span>
                          )}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600 dark:text-green-400">
                        {r.likes}
                      </TableCell>
                      <TableCell className="text-right font-medium text-red-600 dark:text-red-400">
                        {r.downs}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {r.total}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
