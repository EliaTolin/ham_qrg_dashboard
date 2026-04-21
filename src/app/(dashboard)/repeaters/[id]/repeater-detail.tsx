"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  Radio,
  MessageSquare,
  Info,
  Plus,
  Pencil,
  Trash2,
  Power,
  ClipboardCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCtcss } from "@/lib/format";
import { getModeColor } from "@/lib/mode-colors";
import { toast } from "sonner";
import { RepeaterAlerts } from "./repeater-alerts";
import { RepeaterEditForm } from "./repeater-edit-form";
import { AccessDialog } from "./access-dialog";
import { RepeaterPendingChanges } from "./repeater-pending-changes";
import { deleteAccess, updateRepeater } from "@/app/actions/repeaters";
import type {
  Repeater,
  RepeaterAccessWithNetwork,
  FeedbackStats,
  RepeaterFeedbackWithRelations,
  RepeaterReportWithProfile,
  Network,
  SyncPendingChange,
} from "@/lib/types";

const STATION_LABELS: Record<string, string> = {
  portable: "Portable",
  mobile: "Mobile",
  fixed: "Fixed",
};

function formatUserName(
  profile: { first_name: string | null; last_name: string | null; callsign: string | null } | null
): string {
  if (!profile) return "Sconosciuto";
  if (profile.callsign) return profile.callsign;
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ");
  return name || "Sconosciuto";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface RepeaterDetailProps {
  repeater: Repeater;
  accesses: RepeaterAccessWithNetwork[];
  feedbackStats: FeedbackStats | null;
  feedback: RepeaterFeedbackWithRelations[];
  reports: RepeaterReportWithProfile[];
  canEdit: boolean;
  canManageReports: boolean;
  canReviewSync: boolean;
  networks: Network[];
  pendingChanges: SyncPendingChange[];
}

export function RepeaterDetail({
  repeater,
  accesses,
  feedbackStats,
  feedback,
  reports,
  canEdit,
  canManageReports,
  canReviewSync,
  networks,
  pendingChanges,
}: RepeaterDetailProps) {
  const router = useRouter();
  const [togglingActive, setTogglingActive] = useState(false);

  async function handleToggleActive() {
    setTogglingActive(true);
    const result = await updateRepeater(repeater.id, {
      is_active: !repeater.is_active,
    });
    setTogglingActive(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(
        repeater.is_active ? "Ripetitore disattivato" : "Ripetitore riattivato"
      );
      router.refresh();
    }
  }

  // Group feedback by access ID
  const feedbackByAccess = new Map<string, RepeaterFeedbackWithRelations[]>();
  for (const fb of feedback) {
    const list = feedbackByAccess.get(fb.repeater_access_id) ?? [];
    list.push(fb);
    feedbackByAccess.set(fb.repeater_access_id, list);
  }

  const isActive = repeater.is_active !== false;
  const pendingCount = pendingChanges.filter((c) => c.status === "pending").length;
  const showSyncTab = canReviewSync && pendingChanges.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/repeaters">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">
              {repeater.callsign ?? "Unknown"}
            </h2>
            {!isActive && (
              <Badge variant="secondary">Inattivo</Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            {repeater.name ?? repeater.locality ?? ""}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-4">
          {canEdit && (
            <Button
              variant={isActive ? "outline" : "default"}
              size="sm"
              onClick={handleToggleActive}
              disabled={togglingActive}
            >
              <Power className="mr-2 h-3.5 w-3.5" />
              {togglingActive
                ? "..."
                : isActive
                  ? "Disattiva"
                  : "Riattiva"}
            </Button>
          )}
          {feedbackStats && (
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1 text-green-600">
                <ThumbsUp className="h-4 w-4" />
                {feedbackStats.likes_total ?? 0}
              </span>
              <span className="flex items-center gap-1 text-red-600">
                <ThumbsDown className="h-4 w-4" />
                {feedbackStats.down_total ?? 0}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Report alerts banner */}
      <RepeaterAlerts reports={reports} canManage={canManageReports} />

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general" className="gap-1.5">
            <Info className="h-4 w-4" />
            Generale
          </TabsTrigger>
          <TabsTrigger value="access" className="gap-1.5">
            <Radio className="h-4 w-4" />
            Accessi ({accesses.length})
          </TabsTrigger>
          <TabsTrigger value="feedback" className="gap-1.5">
            <MessageSquare className="h-4 w-4" />
            Feedback ({feedback.length})
          </TabsTrigger>
          {showSyncTab && (
            <TabsTrigger value="sync" className="gap-1.5">
              <ClipboardCheck className="h-4 w-4" />
              Sync iz8wnh ({pendingChanges.length})
              {pendingCount > 0 && (
                <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] leading-none text-primary-foreground">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tab: General */}
        <TabsContent value="general" className="space-y-4">
          <RepeaterEditForm repeater={repeater} canEdit={canEdit} />
        </TabsContent>

        {/* Tab: Access Methods */}
        <TabsContent value="access" className="space-y-4">
          {canEdit && (
            <div className="flex justify-end">
              <AccessDialog
                repeaterId={repeater.id}
                networks={networks}
                trigger={
                  <Button size="sm">
                    <Plus className="mr-2 h-3.5 w-3.5" />
                    Aggiungi accesso
                  </Button>
                }
              />
            </div>
          )}
          {accesses.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nessun metodo di accesso registrato.
            </p>
          )}
          {accesses.map((access) => {
            const accessFeedback = feedbackByAccess.get(access.id) ?? [];
            return (
              <Card key={access.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Badge className={getModeColor(access.mode)}>
                      {access.mode}
                    </Badge>
                    {access.network && (
                      <CardDescription>
                        {access.network.name}
                        {access.network.kind && (
                          <span className="ml-1 text-xs">({access.network.kind})</span>
                        )}
                      </CardDescription>
                    )}
                    {canEdit && (
                      <div className="ml-auto flex items-center gap-1">
                        <AccessDialog
                          repeaterId={repeater.id}
                          access={access}
                          networks={networks}
                          trigger={
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={async () => {
                            if (!confirm("Eliminare questo accesso?")) return;
                            const result = await deleteAccess(access.id);
                            if (result.error) {
                              toast.error(result.error);
                            } else {
                              toast.success("Accesso eliminato");
                              router.refresh();
                            }
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    {access.ctcss_tx_hz != null && (
                      <div>
                        <dt className="text-muted-foreground">CTCSS TX</dt>
                        <dd>{formatCtcss(access.ctcss_tx_hz)}</dd>
                      </div>
                    )}
                    {access.ctcss_rx_hz != null && (
                      <div>
                        <dt className="text-muted-foreground">CTCSS RX</dt>
                        <dd>{formatCtcss(access.ctcss_rx_hz)}</dd>
                      </div>
                    )}
                    {access.dcs_code != null && (
                      <div>
                        <dt className="text-muted-foreground">DCS</dt>
                        <dd>{access.dcs_code}</dd>
                      </div>
                    )}
                    {access.color_code != null && (
                      <div>
                        <dt className="text-muted-foreground">Color Code</dt>
                        <dd>{access.color_code}</dd>
                      </div>
                    )}
                    {access.talkgroup != null && (
                      <div>
                        <dt className="text-muted-foreground">Talkgroup</dt>
                        <dd>{access.talkgroup}</dd>
                      </div>
                    )}
                    {access.dg_id != null && (
                      <div>
                        <dt className="text-muted-foreground">DG-ID</dt>
                        <dd>{access.dg_id}</dd>
                      </div>
                    )}
                    {access.node_id != null && (
                      <div>
                        <dt className="text-muted-foreground">Node ID</dt>
                        <dd>{access.node_id}</dd>
                      </div>
                    )}
                    {access.notes && (
                      <div className="col-span-full">
                        <dt className="text-muted-foreground">Note</dt>
                        <dd>{access.notes}</dd>
                      </div>
                    )}
                  </dl>

                  <dl className="grid grid-cols-2 gap-3 text-sm text-muted-foreground sm:grid-cols-4">
                    <div>
                      <dt className="text-xs">Source</dt>
                      <dd>{access.source}</dd>
                    </div>
                    {access.external_id && (
                      <div>
                        <dt className="text-xs">External ID</dt>
                        <dd className="font-mono text-xs">{access.external_id}</dd>
                      </div>
                    )}
                  </dl>

                  {/* Feedback for this access */}
                  {accessFeedback.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="mb-2 text-sm font-medium">
                          Feedback ({accessFeedback.length})
                        </h4>
                        <div className="space-y-2">
                          {accessFeedback.map((fb) => (
                            <div
                              key={fb.id}
                              className="flex items-start gap-2 rounded-md border p-2 text-sm"
                            >
                              {fb.type === "like" ? (
                                <ThumbsUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />
                              ) : (
                                <ThumbsDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600" />
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {formatUserName(fb.profiles)}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {STATION_LABELS[fb.station] ?? fb.station}
                                  </Badge>
                                  <span className="ml-auto text-xs text-muted-foreground">
                                    {formatDate(fb.created_at)}
                                  </span>
                                </div>
                                {fb.comment && (
                                  <p className="mt-1 text-muted-foreground">
                                    {fb.comment}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Tab: Feedback (all) */}
        <TabsContent value="feedback" className="space-y-3">
          {feedback.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nessun feedback per questo ripetitore.
            </p>
          )}
          {feedback.map((fb) => (
            <Card key={fb.id}>
              <CardContent className="flex items-start gap-3 pt-4">
                {fb.type === "like" ? (
                  <ThumbsUp className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                ) : (
                  <ThumbsDown className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-sm">
                      {formatUserName(fb.profiles)}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {STATION_LABELS[fb.station] ?? fb.station}
                    </Badge>
                    {fb.repeater_access && (
                      <Badge
                        variant="outline"
                        className={getModeColor(fb.repeater_access.mode)}
                      >
                        {fb.repeater_access.mode}
                      </Badge>
                    )}
                    <span className="ml-auto text-xs text-muted-foreground">
                      {formatDate(fb.created_at)}
                    </span>
                  </div>
                  {fb.comment && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {fb.comment}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Tab: Sync iz8wnh pending changes */}
        {showSyncTab && (
          <TabsContent value="sync" className="space-y-3">
            <RepeaterPendingChanges changes={pendingChanges} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
