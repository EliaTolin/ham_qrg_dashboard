"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  Radio,
  MessageSquare,
  AlertTriangle,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatFrequency, formatShift, formatCtcss } from "@/lib/format";
import { getModeColor } from "@/lib/mode-colors";
import type {
  Repeater,
  RepeaterAccessWithNetwork,
  FeedbackStats,
  RepeaterFeedbackWithRelations,
  RepeaterReportWithProfile,
} from "@/lib/types";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  reviewed: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const STATION_LABELS: Record<string, string> = {
  portable: "Portable",
  mobile: "Mobile",
  fixed: "Fixed",
};

function formatUserName(
  profile: { first_name: string | null; last_name: string | null; callsign: string | null } | null
): string {
  if (!profile) return "Unknown";
  if (profile.callsign) return profile.callsign;
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ");
  return name || "Unknown";
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

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

interface RepeaterDetailProps {
  repeater: Repeater;
  accesses: RepeaterAccessWithNetwork[];
  feedbackStats: FeedbackStats | null;
  feedback: RepeaterFeedbackWithRelations[];
  reports: RepeaterReportWithProfile[];
}

export function RepeaterDetail({
  repeater,
  accesses,
  feedbackStats,
  feedback,
  reports,
}: RepeaterDetailProps) {
  // Group feedback by access ID
  const feedbackByAccess = new Map<string, RepeaterFeedbackWithRelations[]>();
  for (const fb of feedback) {
    const list = feedbackByAccess.get(fb.repeater_access_id) ?? [];
    list.push(fb);
    feedbackByAccess.set(fb.repeater_access_id, list);
  }

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
          <h2 className="text-2xl font-bold">
            {repeater.callsign ?? "Unknown"}
          </h2>
          <p className="text-muted-foreground">
            {repeater.name ?? repeater.locality ?? ""}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-4">
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

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general" className="gap-1.5">
            <Info className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="access" className="gap-1.5">
            <Radio className="h-4 w-4" />
            Access ({accesses.length})
          </TabsTrigger>
          <TabsTrigger value="feedback" className="gap-1.5">
            <MessageSquare className="h-4 w-4" />
            Feedback ({feedback.length})
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-1.5">
            <AlertTriangle className="h-4 w-4" />
            Reports ({reports.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab: General */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Repeater Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                <InfoItem label="Callsign" value={<span className="font-mono">{repeater.callsign ?? "—"}</span>} />
                <InfoItem label="Frequency" value={formatFrequency(repeater.frequency_hz)} />
                <InfoItem label="Shift" value={formatShift(repeater.shift_hz)} />
                <InfoItem label="Locality" value={repeater.locality ?? "—"} />
                <InfoItem label="Region" value={repeater.region ?? "—"} />
                <InfoItem label="Province" value={repeater.province_code ?? "—"} />
                <InfoItem label="Locator" value={<span className="font-mono">{repeater.locator ?? "—"}</span>} />
                <InfoItem label="Manager" value={repeater.manager ?? "—"} />
                {repeater.lat != null && repeater.lon != null && (
                  <InfoItem
                    label="Coordinates"
                    value={
                      <span className="font-mono text-sm">
                        {repeater.lat.toFixed(5)}, {repeater.lon.toFixed(5)}
                      </span>
                    }
                  />
                )}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                <InfoItem label="Source" value={repeater.source} />
                <InfoItem label="External ID" value={<span className="font-mono text-sm">{repeater.external_id ?? "—"}</span>} />
                <InfoItem label="Last Seen" value={repeater.last_seen_at ? formatDate(repeater.last_seen_at) : "—"} />
                <InfoItem label="Created" value={formatDate(repeater.created_at)} />
                <InfoItem label="Updated" value={formatDate(repeater.updated_at)} />
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Access Methods */}
        <TabsContent value="access" className="space-y-4">
          {accesses.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No access methods registered.
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
                        <dt className="text-muted-foreground">Notes</dt>
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
              No feedback for this repeater.
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

        {/* Tab: Reports */}
        <TabsContent value="reports" className="space-y-3">
          {reports.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No reports for this repeater.
            </p>
          )}
          {reports.map((report) => (
            <Card key={report.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={STATUS_COLORS[report.status]}>
                      {report.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      by {formatUserName(report.profiles)}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(report.created_at)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{report.description}</p>
                {report.updated_at !== report.created_at && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Updated: {formatDate(report.updated_at)}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
