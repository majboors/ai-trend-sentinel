export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      api_keys: {
        Row: {
          binance_api_key: string
          binance_api_secret: string
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          binance_api_key: string
          binance_api_secret: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          binance_api_key?: string
          binance_api_secret?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      assets: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"]
          created_at: string | null
          free: number
          id: string
          last_updated: string | null
          locked: number
          symbol: string
          user_id: string
        }
        Insert: {
          account_type: Database["public"]["Enums"]["account_type"]
          created_at?: string | null
          free?: number
          id?: string
          last_updated?: string | null
          locked?: number
          symbol: string
          user_id: string
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"]
          created_at?: string | null
          free?: number
          id?: string
          last_updated?: string | null
          locked?: number
          symbol?: string
          user_id?: string
        }
        Relationships: []
      }
      coin_indicators: {
        Row: {
          coin_symbol: string
          created_at: string | null
          id: string
          indicators: Json
          sentiment: string
          trade_view_id: string | null
          user_response: string | null
        }
        Insert: {
          coin_symbol: string
          created_at?: string | null
          id?: string
          indicators: Json
          sentiment: string
          trade_view_id?: string | null
          user_response?: string | null
        }
        Update: {
          coin_symbol?: string
          created_at?: string | null
          id?: string
          indicators?: Json
          sentiment?: string
          trade_view_id?: string | null
          user_response?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coin_indicators_trade_view_id_fkey"
            columns: ["trade_view_id"]
            isOneToOne: false
            referencedRelation: "trade_views"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          amount: number
          coin_symbol: string
          created_at: string | null
          direction: string
          error_message: string | null
          id: string
          percentage: number
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"] | null
          trading_view_name: string
          user_id: string | null
        }
        Insert: {
          amount: number
          coin_symbol: string
          created_at?: string | null
          direction: string
          error_message?: string | null
          id?: string
          percentage: number
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"] | null
          trading_view_name: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          coin_symbol?: string
          created_at?: string | null
          direction?: string
          error_message?: string | null
          id?: string
          percentage?: number
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"] | null
          trading_view_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      prediction_trades: {
        Row: {
          amount: number
          closed_at: string | null
          created_at: string | null
          entry_price: number
          exit_price: number | null
          id: string
          profit_loss: number | null
          status: Database["public"]["Enums"]["trade_status"]
          symbol: string
          type: string
          user_id: string
          view_id: string
        }
        Insert: {
          amount: number
          closed_at?: string | null
          created_at?: string | null
          entry_price: number
          exit_price?: number | null
          id?: string
          profit_loss?: number | null
          status: Database["public"]["Enums"]["trade_status"]
          symbol: string
          type: string
          user_id: string
          view_id: string
        }
        Update: {
          amount?: number
          closed_at?: string | null
          created_at?: string | null
          entry_price?: number
          exit_price?: number | null
          id?: string
          profit_loss?: number | null
          status?: Database["public"]["Enums"]["trade_status"]
          symbol?: string
          type?: string
          user_id?: string
          view_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prediction_trades_view_id_fkey"
            columns: ["view_id"]
            isOneToOne: false
            referencedRelation: "prediction_views"
            referencedColumns: ["id"]
          },
        ]
      }
      prediction_views: {
        Row: {
          created_at: string | null
          current_amount: number
          id: string
          initial_amount: number
          name: string
          start_date: string
          status: Database["public"]["Enums"]["prediction_status"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_amount?: number
          id?: string
          initial_amount: number
          name: string
          start_date: string
          status?: Database["public"]["Enums"]["prediction_status"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_amount?: number
          id?: string
          initial_amount?: number
          name?: string
          start_date?: string
          status?: Database["public"]["Enums"]["prediction_status"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      trade_notifications: {
        Row: {
          coin_symbol: string
          created_at: string | null
          high_price: number | null
          id: string
          low_price: number | null
          trade_view_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          coin_symbol: string
          created_at?: string | null
          high_price?: number | null
          id?: string
          low_price?: number | null
          trade_view_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          coin_symbol?: string
          created_at?: string | null
          high_price?: number | null
          id?: string
          low_price?: number | null
          trade_view_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trade_notifications_trade_view_id_fkey"
            columns: ["trade_view_id"]
            isOneToOne: false
            referencedRelation: "trade_views"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_views: {
        Row: {
          created_at: string | null
          id: string
          name: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"]
          amount: number
          created_at: string | null
          id: string
          price: number
          status: string
          symbol: string
          timestamp: string | null
          type: string
          user_id: string
        }
        Insert: {
          account_type: Database["public"]["Enums"]["account_type"]
          amount: number
          created_at?: string | null
          id?: string
          price: number
          status: string
          symbol: string
          timestamp?: string | null
          type: string
          user_id: string
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"]
          amount?: number
          created_at?: string | null
          id?: string
          price?: number
          status?: string
          symbol?: string
          timestamp?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      volatile_trades: {
        Row: {
          amount: number
          closed_at: string | null
          created_at: string | null
          entry_price: number
          exit_price: number | null
          high_price: number
          id: string
          low_price: number
          profit_loss: number | null
          status: Database["public"]["Enums"]["trade_status"] | null
          symbol: string
          user_id: string
          volatility: number
        }
        Insert: {
          amount: number
          closed_at?: string | null
          created_at?: string | null
          entry_price: number
          exit_price?: number | null
          high_price: number
          id?: string
          low_price: number
          profit_loss?: number | null
          status?: Database["public"]["Enums"]["trade_status"] | null
          symbol: string
          user_id: string
          volatility: number
        }
        Update: {
          amount?: number
          closed_at?: string | null
          created_at?: string | null
          entry_price?: number
          exit_price?: number | null
          high_price?: number
          id?: string
          low_price?: number
          profit_loss?: number | null
          status?: Database["public"]["Enums"]["trade_status"] | null
          symbol?: string
          user_id?: string
          volatility?: number
        }
        Relationships: []
      }
      whale_trades: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          price: number
          symbol: string
          timestamp: string
          trade_type: Database["public"]["Enums"]["whale_trade_type"]
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          price: number
          symbol: string
          timestamp?: string
          trade_type: Database["public"]["Enums"]["whale_trade_type"]
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          price?: number
          symbol?: string
          timestamp?: string
          trade_type?: Database["public"]["Enums"]["whale_trade_type"]
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      account_type: "spot" | "margin"
      notification_status: "pending" | "sent" | "failed"
      prediction_status: "active" | "completed" | "cancelled"
      trade_status: "open" | "closed" | "cancelled"
      whale_trade_type: "buy" | "sell"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
