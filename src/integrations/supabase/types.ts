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
      club_members: {
        Row: {
          club_id: string | null
          id: string
          joined_at: string
          role: string
          user_id: string | null
        }
        Insert: {
          club_id?: string | null
          id?: string
          joined_at?: string
          role?: string
          user_id?: string | null
        }
        Update: {
          club_id?: string | null
          id?: string
          joined_at?: string
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_members_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          average_rating: number
          city: string | null
          country: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          member_count: number
          name: string
          top_player: string | null
          weekly_games: number
        }
        Insert: {
          average_rating?: number
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          member_count?: number
          name: string
          top_player?: string | null
          weekly_games?: number
        }
        Update: {
          average_rating?: number
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          member_count?: number
          name?: string
          top_player?: string | null
          weekly_games?: number
        }
        Relationships: [
          {
            foreignKeyName: "clubs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_sessions: {
        Row: {
          best_moment: string | null
          biggest_mistake: string | null
          created_at: string
          game_id: string | null
          id: string
          key_moments: Json | null
          messages: Json | null
          summary: string | null
          training_plan: Json | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          best_moment?: string | null
          biggest_mistake?: string | null
          created_at?: string
          game_id?: string | null
          id?: string
          key_moments?: Json | null
          messages?: Json | null
          summary?: string | null
          training_plan?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          best_moment?: string | null
          biggest_mistake?: string | null
          created_at?: string
          game_id?: string | null
          id?: string
          key_moments?: Json | null
          messages?: Json | null
          summary?: string | null
          training_plan?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_sessions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          accuracy_black: number | null
          accuracy_red: number | null
          black_guest_name: string | null
          black_player: string | null
          board_snapshots: Json
          created_at: string
          duration_seconds: number | null
          elo_change_black: number | null
          elo_change_red: number | null
          id: string
          mode: Database["public"]["Enums"]["game_mode"]
          moves: Json
          reason: string | null
          red_guest_name: string | null
          red_player: string | null
          result: Database["public"]["Enums"]["game_result"]
          total_moves: number
          variant: string
          winner: string | null
        }
        Insert: {
          accuracy_black?: number | null
          accuracy_red?: number | null
          black_guest_name?: string | null
          black_player?: string | null
          board_snapshots?: Json
          created_at?: string
          duration_seconds?: number | null
          elo_change_black?: number | null
          elo_change_red?: number | null
          id?: string
          mode?: Database["public"]["Enums"]["game_mode"]
          moves?: Json
          reason?: string | null
          red_guest_name?: string | null
          red_player?: string | null
          result?: Database["public"]["Enums"]["game_result"]
          total_moves?: number
          variant?: string
          winner?: string | null
        }
        Update: {
          accuracy_black?: number | null
          accuracy_red?: number | null
          black_guest_name?: string | null
          black_player?: string | null
          board_snapshots?: Json
          created_at?: string
          duration_seconds?: number | null
          elo_change_black?: number | null
          elo_change_red?: number | null
          id?: string
          mode?: Database["public"]["Enums"]["game_mode"]
          moves?: Json
          reason?: string | null
          red_guest_name?: string | null
          red_player?: string | null
          result?: Database["public"]["Enums"]["game_result"]
          total_moves?: number
          variant?: string
          winner?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "games_black_player_fkey"
            columns: ["black_player"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_red_player_fkey"
            columns: ["red_player"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_entries: {
        Row: {
          category: string
          city: string | null
          country: string | null
          draws: number
          id: string
          losses: number
          rank_change: number
          rating: number
          score: number
          streak: number
          updated_at: string
          user_id: string | null
          username: string
          wins: number
        }
        Insert: {
          category: string
          city?: string | null
          country?: string | null
          draws?: number
          id?: string
          losses?: number
          rank_change?: number
          rating?: number
          score?: number
          streak?: number
          updated_at?: string
          user_id?: string | null
          username: string
          wins?: number
        }
        Update: {
          category?: string
          city?: string | null
          country?: string | null
          draws?: number
          id?: string
          losses?: number
          rank_change?: number
          rating?: number
          score?: number
          streak?: number
          updated_at?: string
          user_id?: string | null
          username?: string
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          best_streak: number
          city: string | null
          country: string | null
          country_code: string | null
          created_at: string
          current_streak: number
          display_name: string | null
          draws: number
          elo_blitz: number
          elo_daily: number
          elo_rapid: number
          id: string
          is_pro: boolean
          losses: number
          puzzle_score: number
          rush_best: number
          total_games: number
          updated_at: string
          username: string
          wins: number
        }
        Insert: {
          avatar_url?: string | null
          best_streak?: number
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          current_streak?: number
          display_name?: string | null
          draws?: number
          elo_blitz?: number
          elo_daily?: number
          elo_rapid?: number
          id: string
          is_pro?: boolean
          losses?: number
          puzzle_score?: number
          rush_best?: number
          total_games?: number
          updated_at?: string
          username: string
          wins?: number
        }
        Update: {
          avatar_url?: string | null
          best_streak?: number
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          current_streak?: number
          display_name?: string | null
          draws?: number
          elo_blitz?: number
          elo_daily?: number
          elo_rapid?: number
          id?: string
          is_pro?: boolean
          losses?: number
          puzzle_score?: number
          rush_best?: number
          total_games?: number
          updated_at?: string
          username?: string
          wins?: number
        }
        Relationships: []
      }
      puzzle_attempts: {
        Row: {
          attempts: number
          created_at: string
          id: string
          puzzle_id: string | null
          solved: boolean
          time_seconds: number | null
          user_id: string | null
        }
        Insert: {
          attempts?: number
          created_at?: string
          id?: string
          puzzle_id?: string | null
          solved?: boolean
          time_seconds?: number | null
          user_id?: string | null
        }
        Update: {
          attempts?: number
          created_at?: string
          id?: string
          puzzle_id?: string | null
          solved?: boolean
          time_seconds?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "puzzle_attempts_puzzle_id_fkey"
            columns: ["puzzle_id"]
            isOneToOne: false
            referencedRelation: "puzzles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "puzzle_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      puzzles: {
        Row: {
          board: Json
          created_at: string
          daily_date: string | null
          difficulty: string
          explanation: string | null
          id: string
          is_daily: boolean
          side_to_move: string
          solution: Json
          theme: string
          title: string
        }
        Insert: {
          board: Json
          created_at?: string
          daily_date?: string | null
          difficulty?: string
          explanation?: string | null
          id?: string
          is_daily?: boolean
          side_to_move?: string
          solution: Json
          theme: string
          title: string
        }
        Update: {
          board?: Json
          created_at?: string
          daily_date?: string | null
          difficulty?: string
          explanation?: string | null
          id?: string
          is_daily?: boolean
          side_to_move?: string
          solution?: Json
          theme?: string
          title?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          board: Json | null
          chat_messages: Json
          code: string
          created_at: string
          current_turn: string
          expires_at: string
          guest_guest_name: string | null
          guest_user_id: string | null
          host_guest_name: string | null
          host_user_id: string | null
          id: string
          move_history: Json
          status: string
          time_control: string
          variant: string
        }
        Insert: {
          board?: Json | null
          chat_messages?: Json
          code: string
          created_at?: string
          current_turn?: string
          expires_at?: string
          guest_guest_name?: string | null
          guest_user_id?: string | null
          host_guest_name?: string | null
          host_user_id?: string | null
          id?: string
          move_history?: Json
          status?: string
          time_control?: string
          variant?: string
        }
        Update: {
          board?: Json | null
          chat_messages?: Json
          code?: string
          created_at?: string
          current_turn?: string
          expires_at?: string
          guest_guest_name?: string | null
          guest_user_id?: string | null
          host_guest_name?: string | null
          host_user_id?: string | null
          id?: string
          move_history?: Json
          status?: string
          time_control?: string
          variant?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_guest_user_id_fkey"
            columns: ["guest_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_host_user_id_fkey"
            columns: ["host_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          animations_enabled: boolean
          auto_flip_board: boolean
          board_theme: string
          language: string
          piece_style: string
          show_coordinates: boolean
          show_legal_moves: boolean
          sound_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          animations_enabled?: boolean
          auto_flip_board?: boolean
          board_theme?: string
          language?: string
          piece_style?: string
          show_coordinates?: boolean
          show_legal_moves?: boolean
          sound_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          animations_enabled?: boolean
          auto_flip_board?: boolean
          board_theme?: string
          language?: string
          piece_style?: string
          show_coordinates?: boolean
          show_legal_moves?: boolean
          sound_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      game_mode:
        | "vs-ai"
        | "vs-human-local"
        | "vs-human-online"
        | "puzzle"
        | "analysis"
      game_result: "red" | "black" | "draw" | "ongoing"
      move_quality:
        | "brilliant"
        | "great"
        | "good"
        | "inaccuracy"
        | "mistake"
        | "blunder"
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
      game_mode: [
        "vs-ai",
        "vs-human-local",
        "vs-human-online",
        "puzzle",
        "analysis",
      ],
      game_result: ["red", "black", "draw", "ongoing"],
      move_quality: [
        "brilliant",
        "great",
        "good",
        "inaccuracy",
        "mistake",
        "blunder",
      ],
    },
  },
} as const
