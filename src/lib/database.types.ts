export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      networks: {
        Row: {
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["network_kind"]
          name: string
          notes: string | null
          parent_network_id: string | null
          website: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["network_kind"]
          name: string
          notes?: string | null
          parent_network_id?: string | null
          website?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["network_kind"]
          name?: string
          notes?: string | null
          parent_network_id?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "networks_parent_network_id_fkey"
            columns: ["parent_network_id"]
            isOneToOne: false
            referencedRelation: "networks"
            referencedColumns: ["id"]
          },
        ]
      }
      params: {
        Row: {
          created_at: string
          id: string
          key: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          value?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          callsign: string | null
          created_at: string
          deleted_at: string | null
          first_name: string | null
          id: string
          last_name: string | null
          propic: string | null
          updated_at: string
          user_type: Database["public"]["Enums"]["user_type"] | null
        }
        Insert: {
          callsign?: string | null
          created_at?: string
          deleted_at?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          propic?: string | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"] | null
        }
        Update: {
          callsign?: string | null
          created_at?: string
          deleted_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          propic?: string | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"] | null
        }
        Relationships: []
      }
      repeater_access: {
        Row: {
          color_code: number | null
          created_at: string
          ctcss_rx_hz: number | null
          ctcss_tx_hz: number | null
          dcs_code: number | null
          dg_id: number | null
          external_id: string | null
          id: string
          last_seen_at: string | null
          mode: Database["public"]["Enums"]["access_mode"]
          network_id: string | null
          node_id: number | null
          notes: string | null
          repeater_id: string
          source: string
          talkgroup: number | null
          updated_at: string
        }
        Insert: {
          color_code?: number | null
          created_at?: string
          ctcss_rx_hz?: number | null
          ctcss_tx_hz?: number | null
          dcs_code?: number | null
          dg_id?: number | null
          external_id?: string | null
          id?: string
          last_seen_at?: string | null
          mode: Database["public"]["Enums"]["access_mode"]
          network_id?: string | null
          node_id?: number | null
          notes?: string | null
          repeater_id: string
          source?: string
          talkgroup?: number | null
          updated_at?: string
        }
        Update: {
          color_code?: number | null
          created_at?: string
          ctcss_rx_hz?: number | null
          ctcss_tx_hz?: number | null
          dcs_code?: number | null
          dg_id?: number | null
          external_id?: string | null
          id?: string
          last_seen_at?: string | null
          mode?: Database["public"]["Enums"]["access_mode"]
          network_id?: string | null
          node_id?: number | null
          notes?: string | null
          repeater_id?: string
          source?: string
          talkgroup?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "repeater_access_network_id_fkey"
            columns: ["network_id"]
            isOneToOne: false
            referencedRelation: "networks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repeater_access_repeater_id_fkey"
            columns: ["repeater_id"]
            isOneToOne: false
            referencedRelation: "repeaters"
            referencedColumns: ["id"]
          },
        ]
      }
      repeater_feedback: {
        Row: {
          comment: string
          created_at: string
          geom: unknown
          id: string
          lat: number
          lon: number
          repeater_access_id: string
          repeater_id: string
          station: Database["public"]["Enums"]["station_kind"]
          type: Database["public"]["Enums"]["feedback_type"]
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          geom?: unknown
          id?: string
          lat: number
          lon: number
          repeater_access_id: string
          repeater_id: string
          station: Database["public"]["Enums"]["station_kind"]
          type: Database["public"]["Enums"]["feedback_type"]
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          geom?: unknown
          id?: string
          lat?: number
          lon?: number
          repeater_access_id?: string
          repeater_id?: string
          station?: Database["public"]["Enums"]["station_kind"]
          type?: Database["public"]["Enums"]["feedback_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "repeater_feedback_repeater_access_id_fkey"
            columns: ["repeater_access_id"]
            isOneToOne: false
            referencedRelation: "repeater_access"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repeater_feedback_repeater_id_fkey"
            columns: ["repeater_id"]
            isOneToOne: false
            referencedRelation: "repeaters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repeater_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      repeater_reports: {
        Row: {
          created_at: string
          description: string
          id: string
          repeater_id: string
          status: Database["public"]["Enums"]["report_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          repeater_id: string
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          repeater_id?: string
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "repeater_reports_repeater_id_fkey"
            columns: ["repeater_id"]
            isOneToOne: false
            referencedRelation: "repeaters"
            referencedColumns: ["id"]
          },
        ]
      }
      repeaters: {
        Row: {
          callsign: string | null
          created_at: string
          external_id: string | null
          frequency_hz: number
          geom: unknown
          id: string
          last_seen_at: string | null
          lat: number | null
          locality: string | null
          locator: string | null
          lon: number | null
          manager: string | null
          name: string | null
          province_code: string | null
          region: string | null
          shift_hz: number | null
          shift_raw: string | null
          source: string
          updated_at: string
        }
        Insert: {
          callsign?: string | null
          created_at?: string
          external_id?: string | null
          frequency_hz: number
          geom?: unknown
          id?: string
          last_seen_at?: string | null
          lat?: number | null
          locality?: string | null
          locator?: string | null
          lon?: number | null
          manager?: string | null
          name?: string | null
          province_code?: string | null
          region?: string | null
          shift_hz?: number | null
          shift_raw?: string | null
          source?: string
          updated_at?: string
        }
        Update: {
          callsign?: string | null
          created_at?: string
          external_id?: string | null
          frequency_hz?: number
          geom?: unknown
          id?: string
          last_seen_at?: string | null
          lat?: number | null
          locality?: string | null
          locator?: string | null
          lon?: number | null
          manager?: string | null
          name?: string | null
          province_code?: string | null
          region?: string | null
          shift_hz?: number | null
          shift_raw?: string | null
          source?: string
          updated_at?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          permission: Database["public"]["Enums"]["app_permission"]
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          permission: Database["public"]["Enums"]["app_permission"]
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          permission?: Database["public"]["Enums"]["app_permission"]
        }
        Relationships: []
      }
      user_favorite_repeaters: {
        Row: {
          created_at: string
          id: string
          repeater_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          repeater_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          repeater_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorite_repeaters_repeater_id_fkey"
            columns: ["repeater_id"]
            isOneToOne: false
            referencedRelation: "repeaters"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: Database["public"]["Enums"]["app_role"]
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: Database["public"]["Enums"]["app_role"]
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_repeater_feedback_stats: {
        Row: {
          down_total: number | null
          last_down_at: string | null
          last_like_at: string | null
          likes_total: number | null
          repeater_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "repeater_feedback_repeater_id_fkey"
            columns: ["repeater_id"]
            isOneToOne: false
            referencedRelation: "repeaters"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      maidenhead_to_point: { Args: { loc: string }; Returns: unknown }
      parse_shift_hz: { Args: { shift_text: string }; Returns: number }
      repeaters_in_bounds: {
        Args: {
          p_access_modes?: string[]
          p_lat1: number
          p_lat2: number
          p_lon1: number
          p_lon2: number
        }
        Returns: {
          accesses: Json
          repeater: Database["public"]["Tables"]["repeaters"]["Row"]
        }[]
      }
      repeaters_nearby: {
        Args: {
          p_access_modes?: string[]
          p_lat: number
          p_limit?: number
          p_lon: number
          p_radius_km?: number
        }
        Returns: {
          accesses: Json
          distance_m: number
          repeater: Database["public"]["Tables"]["repeaters"]["Row"]
        }[]
      }
      search_repeaters: {
        Args: {
          p_query: string
          p_limit?: number
          p_access_modes?: string[]
          p_freq_min_hz?: number
          p_freq_max_hz?: number
        }
        Returns: {
          repeater: Database["public"]["Tables"]["repeaters"]["Row"]
          accesses: Json
          rank: number
        }[]
      }
      try_parse_ctcss: { Args: { t: string }; Returns: number }
    }
    Enums: {
      access_mode:
        | "ANALOG"
        | "DMR"
        | "C4FM"
        | "DSTAR"
        | "ECHOLINK"
        | "SVX"
        | "APRS"
        | "BEACON"
        | "ATV"
        | "NXDN"
        | "ALLSTAR"
        | "WINLINK"
      app_permission:
        | "repeaters.write"
        | "repeaters.delete"
        | "networks.write"
        | "networks.delete"
        | "reports.manage"
        | "users.manage"
        | "sync.trigger"
      app_role: "admin" | "viewer" | "bridge_manager" | "report_manager"
      feedback_type: "like" | "down"
      network_kind: "dmr" | "c4fm" | "dstar" | "voip" | "mixed" | "other"
      report_status: "pending" | "reviewed" | "resolved" | "rejected"
      station_kind: "portable" | "mobile" | "fixed"
      user_type: "swl" | "licensed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
