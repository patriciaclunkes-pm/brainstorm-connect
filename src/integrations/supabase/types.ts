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
      audit_logs: {
        Row: {
          acao: string
          created_at: string
          detalhes: Json | null
          entidade: string
          entidade_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string
          detalhes?: Json | null
          entidade: string
          entidade_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          detalhes?: Json | null
          entidade?: string
          entidade_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      categorias: {
        Row: {
          ativo: boolean
          data_criacao: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          data_criacao?: string
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          data_criacao?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      equipes: {
        Row: {
          created_at: string
          id: string
          lider_id: string | null
          nome: string
        }
        Insert: {
          created_at?: string
          id?: string
          lider_id?: string | null
          nome: string
        }
        Update: {
          created_at?: string
          id?: string
          lider_id?: string | null
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipes_lider_fk"
            columns: ["lider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_tramitacoes: {
        Row: {
          avaliador_id: string | null
          data_tramitacao: string
          id: string
          ideia_id: string
          novo_status: Database["public"]["Enums"]["ideia_status"]
          parecer_texto: string | null
          status_anterior: Database["public"]["Enums"]["ideia_status"] | null
        }
        Insert: {
          avaliador_id?: string | null
          data_tramitacao?: string
          id?: string
          ideia_id: string
          novo_status: Database["public"]["Enums"]["ideia_status"]
          parecer_texto?: string | null
          status_anterior?: Database["public"]["Enums"]["ideia_status"] | null
        }
        Update: {
          avaliador_id?: string | null
          data_tramitacao?: string
          id?: string
          ideia_id?: string
          novo_status?: Database["public"]["Enums"]["ideia_status"]
          parecer_texto?: string | null
          status_anterior?: Database["public"]["Enums"]["ideia_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_tramitacoes_avaliador_id_fkey"
            columns: ["avaliador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_tramitacoes_ideia_id_fkey"
            columns: ["ideia_id"]
            isOneToOne: false
            referencedRelation: "ideias"
            referencedColumns: ["id"]
          },
        ]
      }
      ideias: {
        Row: {
          autor_id: string
          categoria_id: string
          data_registro: string
          descricao: string
          equipe_id: string | null
          id: string
          motivo_recusa: string | null
          status: Database["public"]["Enums"]["ideia_status"]
          titulo: string
          updated_at: string
        }
        Insert: {
          autor_id: string
          categoria_id: string
          data_registro?: string
          descricao: string
          equipe_id?: string | null
          id?: string
          motivo_recusa?: string | null
          status?: Database["public"]["Enums"]["ideia_status"]
          titulo: string
          updated_at?: string
        }
        Update: {
          autor_id?: string
          categoria_id?: string
          data_registro?: string
          descricao?: string
          equipe_id?: string | null
          id?: string
          motivo_recusa?: string | null
          status?: Database["public"]["Enums"]["ideia_status"]
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ideias_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ideias_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ideias_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          created_at: string
          id: string
          ideia_id: string | null
          lida: boolean
          mensagem: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ideia_id?: string | null
          lida?: boolean
          mensagem: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ideia_id?: string | null
          lida?: boolean
          mensagem?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_ideia_id_fkey"
            columns: ["ideia_id"]
            isOneToOne: false
            referencedRelation: "ideias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacoes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ativo: boolean
          created_at: string
          email: string
          equipe_id: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email?: string
          equipe_id?: string | null
          id: string
          nome?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string
          equipe_id?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
        ]
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
      is_gestor: { Args: { _user_id: string }; Returns: boolean }
      lidera_equipe: {
        Args: { _equipe_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "rh" | "lider" | "colaborador"
      ideia_status:
        | "aguardando_avaliacao"
        | "em_avaliacao"
        | "aguardando_informacoes"
        | "aprovada"
        | "em_roadmap"
        | "recusada"
        | "implementada"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "rh", "lider", "colaborador"],
      ideia_status: [
        "aguardando_avaliacao",
        "em_avaliacao",
        "aguardando_informacoes",
        "aprovada",
        "em_roadmap",
        "recusada",
        "implementada",
      ],
    },
  },
} as const
