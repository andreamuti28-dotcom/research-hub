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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      market_reports: {
        Row: {
          content: string
          created_at: string
          id: string
          is_current: boolean
          report_date: string
          source: string | null
          title: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          is_current?: boolean
          report_date?: string
          source?: string | null
          title?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_current?: boolean
          report_date?: string
          source?: string | null
          title?: string
        }
        Relationships: []
      }
      papers: {
        Row: {
          abstract: string
          content: string
          created_at: string
          downloads: number
          id: string
          is_published: boolean
          language: string
          pdf_url: string | null
          published_date: string
          slug: string
          tags: string[]
          title: string
          updated_at: string
          views: number
        }
        Insert: {
          abstract: string
          content?: string
          created_at?: string
          downloads?: number
          id?: string
          is_published?: boolean
          language?: string
          pdf_url?: string | null
          published_date?: string
          slug: string
          tags?: string[]
          title: string
          updated_at?: string
          views?: number
        }
        Update: {
          abstract?: string
          content?: string
          created_at?: string
          downloads?: number
          id?: string
          is_published?: boolean
          language?: string
          pdf_url?: string | null
          published_date?: string
          slug?: string
          tags?: string[]
          title?: string
          updated_at?: string
          views?: number
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          about_bio: string | null
          about_certifications: Json
          about_certifications_label: string | null
          about_education: Json
          about_education_label: string | null
          about_hobbies: Json
          about_hobbies_label: string | null
          about_kicker: string | null
          about_languages: Json
          about_languages_bar_color: string | null
          about_languages_bar_track_color: string
          about_languages_label: string | null
          about_logo_max_width: number
          about_panel_bg: string | null
          about_panel_fg: string | null
          about_portrait_pos_x: number
          about_portrait_pos_y: number
          about_role: string | null
          about_software: Json
          about_software_label: string | null
          about_tooltip_bg: string
          about_tooltip_border: string
          about_tooltip_fg: string
          archive_disclaimer: string
          contact_email: string | null
          featured_paper_ids: string[]
          header_bg: string
          hero_intro: string
          hero_title: string
          home_featured_label: string
          home_market_disclaimer: string
          home_market_enabled: boolean
          home_market_label: string
          id: string
          linkedin_url: string
          name: string
          portrait_url: string | null
          singleton: boolean
          updated_at: string
        }
        Insert: {
          about_bio?: string | null
          about_certifications?: Json
          about_certifications_label?: string | null
          about_education?: Json
          about_education_label?: string | null
          about_hobbies?: Json
          about_hobbies_label?: string | null
          about_kicker?: string | null
          about_languages?: Json
          about_languages_bar_color?: string | null
          about_languages_bar_track_color?: string
          about_languages_label?: string | null
          about_logo_max_width?: number
          about_panel_bg?: string | null
          about_panel_fg?: string | null
          about_portrait_pos_x?: number
          about_portrait_pos_y?: number
          about_role?: string | null
          about_software?: Json
          about_software_label?: string | null
          about_tooltip_bg?: string
          about_tooltip_border?: string
          about_tooltip_fg?: string
          archive_disclaimer?: string
          contact_email?: string | null
          featured_paper_ids?: string[]
          header_bg?: string
          hero_intro?: string
          hero_title?: string
          home_featured_label?: string
          home_market_disclaimer?: string
          home_market_enabled?: boolean
          home_market_label?: string
          id?: string
          linkedin_url?: string
          name?: string
          portrait_url?: string | null
          singleton?: boolean
          updated_at?: string
        }
        Update: {
          about_bio?: string | null
          about_certifications?: Json
          about_certifications_label?: string | null
          about_education?: Json
          about_education_label?: string | null
          about_hobbies?: Json
          about_hobbies_label?: string | null
          about_kicker?: string | null
          about_languages?: Json
          about_languages_bar_color?: string | null
          about_languages_bar_track_color?: string
          about_languages_label?: string | null
          about_logo_max_width?: number
          about_panel_bg?: string | null
          about_panel_fg?: string | null
          about_portrait_pos_x?: number
          about_portrait_pos_y?: number
          about_role?: string | null
          about_software?: Json
          about_software_label?: string | null
          about_tooltip_bg?: string
          about_tooltip_border?: string
          about_tooltip_fg?: string
          archive_disclaimer?: string
          contact_email?: string | null
          featured_paper_ids?: string[]
          header_bg?: string
          hero_intro?: string
          hero_title?: string
          home_featured_label?: string
          home_market_disclaimer?: string
          home_market_enabled?: boolean
          home_market_label?: string
          id?: string
          linkedin_url?: string
          name?: string
          portrait_url?: string | null
          singleton?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      site_visits: {
        Row: {
          created_at: string
          id: string
          path: string | null
          visitor_token: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          path?: string | null
          visitor_token?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          path?: string | null
          visitor_token?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
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
      increment_paper_downloads: { Args: { _slug: string }; Returns: undefined }
      increment_paper_views: { Args: { _slug: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
