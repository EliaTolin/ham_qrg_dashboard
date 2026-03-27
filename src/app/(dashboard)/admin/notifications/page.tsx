import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import { SendNotificationForm } from "./send-notification-form";
import type { Profile } from "@/lib/types";

export default async function NotificationsPage() {
  const admin = await isAdmin();
  if (!admin) redirect("/");

  const supabase = await createClient();

  const { data: broadcasts } = await supabase
    .from("broadcast_notifications")
    .select(
      "*, sender:profiles!broadcast_notifications_sent_by_fkey(first_name, last_name, callsign)"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  const history = (broadcasts ?? []) as unknown as {
    id: string;
    headings: { it?: string; en?: string };
    contents: { it?: string; en?: string };
    recipient_count: number;
    created_at: string;
    sender: Pick<Profile, "first_name" | "last_name" | "callsign"> | null;
  }[];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Invia notifica broadcast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SendNotificationForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Storico notifiche</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nessuna notifica inviata.
            </p>
          ) : (
            <div className="space-y-4">
              {history.map((notif) => {
                const senderName = notif.sender
                  ? (notif.sender.callsign ??
                    ([notif.sender.first_name, notif.sender.last_name]
                      .filter(Boolean)
                      .join(" ") || "—"))
                  : "—";
                const langs = Object.keys(notif.headings).sort((a, b) =>
                  a === "it" ? -1 : b === "it" ? 1 : a.localeCompare(b)
                );
                return (
                  <div key={notif.id} className="rounded-md border p-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground">
                          {new Date(notif.created_at).toLocaleString("it-IT")}
                        </span>
                        <span className="text-muted-foreground">
                          da <span className="font-medium text-foreground">{senderName}</span>
                        </span>
                      </div>
                      <Badge variant="outline">
                        {notif.recipient_count} destinatari
                      </Badge>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {langs.map((lang) => (
                        <div
                          key={lang}
                          className="rounded-md bg-muted/50 p-3 space-y-1"
                        >
                          <p className="text-xs font-medium text-muted-foreground uppercase">
                            {lang}
                          </p>
                          <p className="font-semibold text-sm">
                            {(notif.headings as Record<string, string>)[lang] ?? "—"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {(notif.contents as Record<string, string>)[lang] ?? "—"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
