export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      content_reports: {
        Row: {
          additional_info: string | null
          content_id: string
          content_title: string
          content_type: string
          correct_provider: string | null
          created_at: string
          device_info: string | null
          id: string
          issue_type: string
          region: string | null
          reported_provider: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          additional_info?: string | null
          content_id: string
          content_title: string
          content_type: string
          correct_provider?: string | null
          created_at?: string
          device_info?: string | null
          id?: string
          issue_type: string
          region?: string | null
          reported_provider?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          additional_info?: string | null
          content_id?: string
          content_title?: string
          content_type?: string
          correct_provider?: string | null
          created_at?: string
          device_info?: string | null
          id?: string
          issue_type?: string
          region?: string | null
          reported_provider?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          id: string
          notify_before_minutes: number
          push_enabled: boolean
          push_subscription: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notify_before_minutes?: number
          push_enabled?: boolean
          push_subscription?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notify_before_minutes?: number
          push_enabled?: boolean
          push_subscription?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          preferred_watch_time: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          preferred_watch_time?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          preferred_watch_time?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          created_at: string
          id: string
          media_type: string
          rating: string
          tmdb_id: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          media_type: string
          rating: string
          tmdb_id: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          media_type?: string
          rating?: string
          tmdb_id?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_events: {
        Row: {
          created_at: string
          event_name: string
          event_time: string
          id: string
          link: string | null
          participants: string | null
          platform_details: Json | null
          streaming_platforms: string[] | null
          summary: string | null
          user_id: string
          where_to_watch: string | null
        }
        Insert: {
          created_at?: string
          event_name: string
          event_time: string
          id?: string
          link?: string | null
          participants?: string | null
          platform_details?: Json | null
          streaming_platforms?: string[] | null
          summary?: string | null
          user_id: string
          where_to_watch?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          event_time?: string
          id?: string
          link?: string | null
          participants?: string | null
          platform_details?: Json | null
          streaming_platforms?: string[] | null
          summary?: string | null
          user_id?: string
          where_to_watch?: string | null
        }
        Relationships: []
      }
      streaming_mappings: {
        Row: {
          category: string | null
          channel: string
          id: string
          is_verified: boolean | null
          last_updated: string | null
          notes: string | null
          platforms: string[]
          report_count: number | null
        }
        Insert: {
          category?: string | null
          channel: string
          id?: string
          is_verified?: boolean | null
          last_updated?: string | null
          notes?: string | null
          platforms: string[]
          report_count?: number | null
        }
        Update: {
          category?: string | null
          channel?: string
          id?: string
          is_verified?: boolean | null
          last_updated?: string | null
          notes?: string | null
          platforms?: string[]
          report_count?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      watchlist: {
        Row: {
          added_at: string
          genres: string[] | null
          id: string
          is_watched: boolean | null
          media_type: string
          poster_path: string | null
          release_year: number | null
          streaming_platforms: string[] | null
          title: string
          tmdb_id: number
          user_id: string
          watched_at: string | null
        }
        Insert: {
          added_at?: string
          genres?: string[] | null
          id?: string
          is_watched?: boolean | null
          media_type: string
          poster_path?: string | null
          release_year?: number | null
          streaming_platforms?: string[] | null
          title: string
          tmdb_id: number
          user_id: string
          watched_at?: string | null
        }
        Update: {
          added_at?: string
          genres?: string[] | null
          id?: string
          is_watched?: boolean | null
          media_type?: string
          poster_path?: string | null
          release_year?: number | null
          streaming_platforms?: string[] | null
          title?: string
          tmdb_id?: number
          user_id?: string
          watched_at?: string | null
        }
        Relationships: []
      }
      wish_usage: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          usage_date: string
          user_id: string
          wish_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          usage_date?: string
          user_id: string
          wish_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          usage_date?: string
          user_id?: string
          wish_count?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      sport_league: "NFL" | "NBA" | "MLB" | "NHL" | "MLS" | "NCAAF" | "NCAAB"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      sport_league: ["NFL", "NBA", "MLB", "NHL", "MLS", "NCAAF", "NCAAB"],
    },
  },
} as const
