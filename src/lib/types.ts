import type { Database } from "./database.types";

export type Repeater = Database["public"]["Tables"]["repeaters"]["Row"];
export type RepeaterAccess = Database["public"]["Tables"]["repeater_access"]["Row"];
export type RepeaterFeedback = Database["public"]["Tables"]["repeater_feedback"]["Row"];
export type RepeaterReport = Database["public"]["Tables"]["repeater_reports"]["Row"];
export type Network = Database["public"]["Tables"]["networks"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type FeedbackStats = Database["public"]["Views"]["v_repeater_feedback_stats"]["Row"];
export type UserRole = Database["public"]["Tables"]["user_roles"]["Row"];
export type RolePermission = Database["public"]["Tables"]["role_permissions"]["Row"];

export type AccessMode = Database["public"]["Enums"]["access_mode"];
export type AppRole = Database["public"]["Enums"]["app_role"];
export type AppPermission = Database["public"]["Enums"]["app_permission"];
export type ReportStatus = Database["public"]["Enums"]["report_status"];
export type NetworkKind = Database["public"]["Enums"]["network_kind"];
export type FeedbackType = Database["public"]["Enums"]["feedback_type"];

export type RepeaterAccessWithNetwork = RepeaterAccess & {
  network: Network | null;
};

export type RepeaterWithAccesses = {
  repeater: Repeater;
  accesses: RepeaterAccessWithNetwork[];
};

export type SearchRepeaterResult = {
  repeater: Repeater;
  accesses: RepeaterAccessWithNetwork[];
  rank: number;
};

export type RepeaterFeedbackWithRelations = RepeaterFeedback & {
  profiles: Pick<Profile, "first_name" | "last_name" | "callsign"> | null;
  repeater_access: Pick<RepeaterAccess, "mode" | "network_id"> | null;
};

export type RepeaterReportWithProfile = RepeaterReport & {
  profiles: Pick<Profile, "first_name" | "last_name" | "callsign"> | null;
};

// Manual type — sync_pending_changes is not in generated types
export type PendingChangeStatus = "pending" | "approved" | "rejected";
export type PendingChangeType = "update" | "new" | "deactivate" | "reactivate";

export interface SyncPendingChange {
  id: string;
  repeater_id: string | null;
  external_id: string;
  change_type: PendingChangeType;
  remote_data: Record<string, unknown>;
  diff: Record<string, { local: unknown; remote: unknown }>;
  remote_updated_at: string | null;
  local_updated_at: string | null;
  suggested_winner: "remote" | "local" | "unknown";
  status: PendingChangeStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}
