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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      bilans: {
        Row: {
          cree_le: string
          date_bilan: string
          id: string
          maj_le: string
          notes: string
          patient_id: string
          praticien_id: string
        }
        Insert: {
          cree_le?: string
          date_bilan?: string
          id?: string
          maj_le?: string
          notes?: string
          patient_id: string
          praticien_id: string
        }
        Update: {
          cree_le?: string
          date_bilan?: string
          id?: string
          maj_le?: string
          notes?: string
          patient_id?: string
          praticien_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bilans_patient_id_praticien_id_fkey"
            columns: ["patient_id", "praticien_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id", "praticien_id"]
          },
          {
            foreignKeyName: "bilans_praticien_id_fkey"
            columns: ["praticien_id"]
            isOneToOne: false
            referencedRelation: "praticiens"
            referencedColumns: ["id"]
          },
        ]
      }
      cliches: {
        Row: {
          bilan_id: string
          cree_le: string
          id: string
          image_hauteur: number
          image_largeur: number
          maj_le: string
          photo_path: string
          praticien_id: string
          vue: Database["public"]["Enums"]["vue_posturale"]
        }
        Insert: {
          bilan_id: string
          cree_le?: string
          id?: string
          image_hauteur: number
          image_largeur: number
          maj_le?: string
          photo_path: string
          praticien_id: string
          vue: Database["public"]["Enums"]["vue_posturale"]
        }
        Update: {
          bilan_id?: string
          cree_le?: string
          id?: string
          image_hauteur?: number
          image_largeur?: number
          maj_le?: string
          photo_path?: string
          praticien_id?: string
          vue?: Database["public"]["Enums"]["vue_posturale"]
        }
        Relationships: [
          {
            foreignKeyName: "cliches_bilan_id_praticien_id_fkey"
            columns: ["bilan_id", "praticien_id"]
            isOneToOne: false
            referencedRelation: "bilans"
            referencedColumns: ["id", "praticien_id"]
          },
          {
            foreignKeyName: "cliches_praticien_id_fkey"
            columns: ["praticien_id"]
            isOneToOne: false
            referencedRelation: "praticiens"
            referencedColumns: ["id"]
          },
        ]
      }
      mesures: {
        Row: {
          bilan_id: string
          cliche_id: string | null
          cree_le: string
          id: string
          maj_le: string
          praticien_id: string
          type: string
          unite: string
          valeur: number
        }
        Insert: {
          bilan_id: string
          cliche_id?: string | null
          cree_le?: string
          id?: string
          maj_le?: string
          praticien_id: string
          type: string
          unite: string
          valeur: number
        }
        Update: {
          bilan_id?: string
          cliche_id?: string | null
          cree_le?: string
          id?: string
          maj_le?: string
          praticien_id?: string
          type?: string
          unite?: string
          valeur?: number
        }
        Relationships: [
          {
            foreignKeyName: "mesures_bilan_id_praticien_id_fkey"
            columns: ["bilan_id", "praticien_id"]
            isOneToOne: false
            referencedRelation: "bilans"
            referencedColumns: ["id", "praticien_id"]
          },
          {
            foreignKeyName: "mesures_cliche_id_praticien_id_fkey"
            columns: ["cliche_id", "praticien_id"]
            isOneToOne: false
            referencedRelation: "cliches"
            referencedColumns: ["id", "praticien_id"]
          },
          {
            foreignKeyName: "mesures_praticien_id_fkey"
            columns: ["praticien_id"]
            isOneToOne: false
            referencedRelation: "praticiens"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          cree_le: string
          date_naissance: string | null
          id: string
          maj_le: string
          nom: string
          notes: string
          praticien_id: string
          prenom: string
        }
        Insert: {
          cree_le?: string
          date_naissance?: string | null
          id?: string
          maj_le?: string
          nom: string
          notes?: string
          praticien_id: string
          prenom: string
        }
        Update: {
          cree_le?: string
          date_naissance?: string | null
          id?: string
          maj_le?: string
          nom?: string
          notes?: string
          praticien_id?: string
          prenom?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_praticien_id_fkey"
            columns: ["praticien_id"]
            isOneToOne: false
            referencedRelation: "praticiens"
            referencedColumns: ["id"]
          },
        ]
      }
      points: {
        Row: {
          cliche_id: string
          code_point: string
          id: string
          maj_le: string
          praticien_id: string
          x: number
          y: number
        }
        Insert: {
          cliche_id: string
          code_point: string
          id?: string
          maj_le?: string
          praticien_id: string
          x: number
          y: number
        }
        Update: {
          cliche_id?: string
          code_point?: string
          id?: string
          maj_le?: string
          praticien_id?: string
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "points_cliche_id_praticien_id_fkey"
            columns: ["cliche_id", "praticien_id"]
            isOneToOne: false
            referencedRelation: "cliches"
            referencedColumns: ["id", "praticien_id"]
          },
          {
            foreignKeyName: "points_praticien_id_fkey"
            columns: ["praticien_id"]
            isOneToOne: false
            referencedRelation: "praticiens"
            referencedColumns: ["id"]
          },
        ]
      }
      praticiens: {
        Row: {
          cabinet: string
          cree_le: string
          echelle_px_par_cm: number | null
          email: string
          id: string
          maj_le: string
          nom: string
        }
        Insert: {
          cabinet?: string
          cree_le?: string
          echelle_px_par_cm?: number | null
          email: string
          id: string
          maj_le?: string
          nom?: string
        }
        Update: {
          cabinet?: string
          cree_le?: string
          echelle_px_par_cm?: number | null
          email?: string
          id?: string
          maj_le?: string
          nom?: string
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
      vue_posturale: "face" | "dos" | "profil"
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
      vue_posturale: ["face", "dos", "profil"],
    },
  },
} as const
