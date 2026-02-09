"use client";

import Link from "next/link";
import { ArrowLeft, ThumbsUp, ThumbsDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatFrequency, formatShift, formatCtcss } from "@/lib/format";
import { getModeColor } from "@/lib/mode-colors";
import type {
  Repeater,
  RepeaterAccessWithNetwork,
  FeedbackStats,
  RepeaterReport,
} from "@/lib/types";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  reviewed: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

interface RepeaterDetailProps {
  repeater: Repeater;
  accesses: RepeaterAccessWithNetwork[];
  feedbackStats: FeedbackStats | null;
  reports: RepeaterReport[];
}

export function RepeaterDetail({
  repeater,
  accesses,
  feedbackStats,
  reports,
}: RepeaterDetailProps) {
  return (
    <div className="space-y-6">
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
              <span className="flex items-center gap-1">
                <ThumbsUp className="h-4 w-4" />
                {feedbackStats.likes_total ?? 0}
              </span>
              <span className="flex items-center gap-1">
                <ThumbsDown className="h-4 w-4" />
                {feedbackStats.down_total ?? 0}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* General Info */}
      <Card>
        <CardHeader>
          <CardTitle>General Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Callsign
              </dt>
              <dd className="font-mono">{repeater.callsign ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Frequency
              </dt>
              <dd>{formatFrequency(repeater.frequency_hz)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Shift
              </dt>
              <dd>{formatShift(repeater.shift_hz)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Locality
              </dt>
              <dd>{repeater.locality ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Region
              </dt>
              <dd>{repeater.region ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Province
              </dt>
              <dd>{repeater.province_code ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Locator
              </dt>
              <dd className="font-mono">{repeater.locator ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Manager
              </dt>
              <dd>{repeater.manager ?? "—"}</dd>
            </div>
            {repeater.lat != null && repeater.lon != null && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Coordinates
                </dt>
                <dd className="font-mono text-sm">
                  {repeater.lat.toFixed(5)}, {repeater.lon.toFixed(5)}
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <Tabs defaultValue="access">
        <TabsList>
          <TabsTrigger value="access">
            Access Methods ({accesses.length})
          </TabsTrigger>
          <TabsTrigger value="reports">Reports ({reports.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="access" className="space-y-4">
          {accesses.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No access methods registered.
            </p>
          )}
          {accesses.map((access) => (
            <Card key={access.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Badge className={getModeColor(access.mode)}>
                    {access.mode}
                  </Badge>
                  {access.network && (
                    <CardDescription>
                      Network: {access.network.name}
                    </CardDescription>
                  )}
                </div>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          {reports.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No reports for this repeater.
            </p>
          )}
          {reports.map((report) => (
            <Card key={report.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge className={STATUS_COLORS[report.status]}>
                    {report.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(report.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{report.description}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
