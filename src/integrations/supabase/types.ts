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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          created_at: string
          details: string | null
          device_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          device_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          device_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          details: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          new_value: Json | null
          old_value: Json | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string
          cep: string | null
          city: string
          cpf: string
          created_at: string
          credits: number
          email: string | null
          full_name: string
          id: string
          latitude: number | null
          longitude: number | null
          neighborhood: string | null
          nickname: string | null
          notes: string | null
          phone: string
          plan_id: string | null
          state: string
          updated_at: string
        }
        Insert: {
          address: string
          cep?: string | null
          city: string
          cpf: string
          created_at?: string
          credits?: number
          email?: string | null
          full_name: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          nickname?: string | null
          notes?: string | null
          phone: string
          plan_id?: string | null
          state?: string
          updated_at?: string
        }
        Update: {
          address?: string
          cep?: string | null
          city?: string
          cpf?: string
          created_at?: string
          credits?: number
          email?: string | null
          full_name?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          nickname?: string | null
          notes?: string | null
          phone?: string
          plan_id?: string | null
          state?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          client_id: string
          created_at: string
          id: string
          payment_method: string
          plan_name: string
          status: string
        }
        Insert: {
          amount: number
          client_id: string
          created_at?: string
          id?: string
          payment_method?: string
          plan_name: string
          status?: string
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string
          id?: string
          payment_method?: string
          plan_name?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          mac_address: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          mac_address: string
          name?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          mac_address?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      equipment: {
        Row: {
          client_name: string | null
          created_at: string
          firmware: string | null
          id: string
          ip_address: string | null
          location: string | null
          mac_address: string
          model: string
          name: string
          notes: string | null
          serial_number: string
          signal_level: number | null
          status: string
          type: string
          updated_at: string
          uptime: string | null
        }
        Insert: {
          client_name?: string | null
          created_at?: string
          firmware?: string | null
          id?: string
          ip_address?: string | null
          location?: string | null
          mac_address?: string
          model?: string
          name?: string
          notes?: string | null
          serial_number?: string
          signal_level?: number | null
          status?: string
          type?: string
          updated_at?: string
          uptime?: string | null
        }
        Update: {
          client_name?: string | null
          created_at?: string
          firmware?: string | null
          id?: string
          ip_address?: string | null
          location?: string | null
          mac_address?: string
          model?: string
          name?: string
          notes?: string | null
          serial_number?: string
          signal_level?: number | null
          status?: string
          type?: string
          updated_at?: string
          uptime?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          category: string
          created_at: string
          date: string
          document_url: string | null
          id: string
          notes: string | null
          product: string
          quantity: number
          registered_by: string | null
          supplier: string
          total: number
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          date?: string
          document_url?: string | null
          id?: string
          notes?: string | null
          product: string
          quantity?: number
          registered_by?: string | null
          supplier: string
          total?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          date?: string
          document_url?: string | null
          id?: string
          notes?: string | null
          product?: string
          quantity?: number
          registered_by?: string | null
          supplier?: string
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      investor_profits: {
        Row: {
          created_at: string
          id: string
          investor_id: string
          investor_share: number
          month: string
          net_profit: number
          paid: boolean
          total_expenses: number
          total_revenue: number
        }
        Insert: {
          created_at?: string
          id?: string
          investor_id: string
          investor_share?: number
          month: string
          net_profit?: number
          paid?: boolean
          total_expenses?: number
          total_revenue?: number
        }
        Update: {
          created_at?: string
          id?: string
          investor_id?: string
          investor_share?: number
          month?: string
          net_profit?: number
          paid?: boolean
          total_expenses?: number
          total_revenue?: number
        }
        Relationships: [
          {
            foreignKeyName: "investor_profits_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors"
            referencedColumns: ["id"]
          },
        ]
      }
      investors: {
        Row: {
          created_at: string
          id: string
          invested_amount: number
          notes: string | null
          participation_percentage: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invested_amount?: number
          notes?: string | null
          participation_percentage?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invested_amount?: number
          notes?: string | null
          participation_percentage?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          created_at: string
          features: string[]
          id: string
          name: string
          popular: boolean
          price: number
          sort_order: number
          subscribers: number
          subtitle: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          features?: string[]
          id?: string
          name: string
          popular?: boolean
          price?: number
          sort_order?: number
          subscribers?: number
          subtitle?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          features?: string[]
          id?: string
          name?: string
          popular?: boolean
          price?: number
          sort_order?: number
          subscribers?: number
          subtitle?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          initial_password: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string
          full_name?: string
          id: string
          initial_password?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          initial_password?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      provisioning_ips: {
        Row: {
          assigned_at: string
          client_name: string | null
          dns: string
          equipment_id: string | null
          gateway: string
          host_index: number
          id: string
          ip_address: string
          is_active: boolean
          released_at: string | null
          subnet: string
          subnet_index: number
        }
        Insert: {
          assigned_at?: string
          client_name?: string | null
          dns?: string
          equipment_id?: string | null
          gateway: string
          host_index: number
          id?: string
          ip_address: string
          is_active?: boolean
          released_at?: string | null
          subnet?: string
          subnet_index?: number
        }
        Update: {
          assigned_at?: string
          client_name?: string | null
          dns?: string
          equipment_id?: string | null
          gateway?: string
          host_index?: number
          id?: string
          ip_address?: string
          is_active?: boolean
          released_at?: string | null
          subnet?: string
          subnet_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "provisioning_ips_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      service_orders: {
        Row: {
          assigned_to: string | null
          client_id: string
          completed_at: string | null
          created_at: string
          description: string
          id: string
          notes: string | null
          scheduled_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          client_id: string
          completed_at?: string | null
          created_at?: string
          description?: string
          id?: string
          notes?: string | null
          scheduled_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          client_id?: string
          completed_at?: string | null
          created_at?: string
          description?: string
          id?: string
          notes?: string | null
          scheduled_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          auto_block_unknown: boolean
          id: string
          notifications_enabled: boolean
          security_pin: string
          updated_at: string
        }
        Insert: {
          auto_block_unknown?: boolean
          id?: string
          notifications_enabled?: boolean
          security_pin?: string
          updated_at?: string
        }
        Update: {
          auto_block_unknown?: boolean
          id?: string
          notifications_enabled?: boolean
          security_pin?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          client_id: string | null
          command_type: string | null
          content: string
          created_at: string
          id: string
          is_command: boolean
          sender: string
        }
        Insert: {
          client_id?: string | null
          command_type?: string | null
          content: string
          created_at?: string
          id?: string
          is_command?: boolean
          sender?: string
        }
        Update: {
          client_id?: string | null
          command_type?: string | null
          content?: string
          created_at?: string
          id?: string
          is_command?: boolean
          sender?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      wifi_settings: {
        Row: {
          band: string
          channel: number
          guest_enabled: boolean
          guest_password: string | null
          guest_ssid: string | null
          id: string
          password: string
          ssid: string
          updated_at: string
        }
        Insert: {
          band?: string
          channel?: number
          guest_enabled?: boolean
          guest_password?: string | null
          guest_ssid?: string | null
          id?: string
          password?: string
          ssid?: string
          updated_at?: string
        }
        Update: {
          band?: string
          channel?: number
          guest_enabled?: boolean
          guest_password?: string | null
          guest_ssid?: string | null
          id?: string
          password?: string
          ssid?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_next_provisioning_ip: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_authenticated_member: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "technician" | "teste" | "investor"
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
      app_role: ["admin", "technician", "teste", "investor"],
    },
  },
} as const
