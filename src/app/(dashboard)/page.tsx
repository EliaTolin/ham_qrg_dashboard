import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Radio, Signal, Flag, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default async function DashboardPage() {
  const supabase = await createClient();
  const role = await getUserRole();

  const [
    { count: repeaterCount },
    { data: accessModes },
    { count: pendingReports },
    { data: recentFeedback },
  ] = await Promise.all([
    supabase.from("repeaters").select("*", { count: "exact", head: true }),
    supabase
      .from("repeater_access")
      .select("mode"),
    supabase
      .from("repeater_reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("repeater_feedback")
      .select("id, type, comment, created_at, repeater_id")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  // Count modes
  const modeCounts: Record<string, number> = {};
  accessModes?.forEach((a) => {
    modeCounts[a.mode] = (modeCounts[a.mode] ?? 0) + 1;
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Repeaters
            </CardTitle>
            <Radio className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{repeaterCount ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Access Modes
            </CardTitle>
            <Signal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {Object.entries(modeCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([mode, count]) => (
                  <Badge key={mode} variant="secondary">
                    {mode}: {count}
                  </Badge>
                ))}
            </div>
          </CardContent>
        </Card>

        {(role === "admin" || role === "report_manager") && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Reports
              </CardTitle>
              <Flag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {pendingReports ?? 0}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Recent Feedback
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentFeedback?.map((fb) => (
                <div
                  key={fb.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="truncate">
                    {fb.type === "like" ? "+" : "-"}{" "}
                    {fb.comment || "No comment"}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(fb.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              ))}
              {(!recentFeedback || recentFeedback.length === 0) && (
                <p className="text-sm text-muted-foreground">
                  No recent feedback
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
