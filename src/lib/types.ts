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
