/**
 * Types de la base Posture Scan.
 *
 * Ce fichier suit la forme produite par `supabase gen types typescript` et doit
 * être régénéré après toute migration :
 *
 *   npx supabase gen types typescript --project-id <ref> > src/types/database.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type VuePosturale = 'face' | 'dos' | 'profil';

export type Database = {
  public: {
    Tables: {
      praticiens: {
        Row: {
          id: string;
          email: string;
          nom: string;
          cabinet: string;
          echelle_px_par_cm: number | null;
          cree_le: string;
          maj_le: string;
        };
        Insert: {
          id: string;
          email: string;
          nom?: string;
          cabinet?: string;
          echelle_px_par_cm?: number | null;
        };
        Update: {
          email?: string;
          nom?: string;
          cabinet?: string;
          echelle_px_par_cm?: number | null;
        };
        Relationships: [];
      };
      patients: {
        Row: {
          id: string;
          praticien_id: string;
          nom: string;
          prenom: string;
          date_naissance: string | null;
          notes: string;
          cree_le: string;
          maj_le: string;
        };
        Insert: {
          id?: string;
          praticien_id: string;
          nom: string;
          prenom: string;
          date_naissance?: string | null;
          notes?: string;
        };
        Update: {
          nom?: string;
          prenom?: string;
          date_naissance?: string | null;
          notes?: string;
        };
        Relationships: [];
      };
      bilans: {
        Row: {
          id: string;
          praticien_id: string;
          patient_id: string;
          date_bilan: string;
          notes: string;
          cree_le: string;
          maj_le: string;
        };
        Insert: {
          id?: string;
          praticien_id: string;
          patient_id: string;
          date_bilan?: string;
          notes?: string;
        };
        Update: {
          date_bilan?: string;
          notes?: string;
        };
        Relationships: [];
      };
      cliches: {
        Row: {
          id: string;
          praticien_id: string;
          bilan_id: string;
          vue: VuePosturale;
          photo_path: string;
          image_largeur: number;
          image_hauteur: number;
          cree_le: string;
          maj_le: string;
        };
        Insert: {
          id?: string;
          praticien_id: string;
          bilan_id: string;
          vue: VuePosturale;
          photo_path: string;
          image_largeur: number;
          image_hauteur: number;
        };
        Update: {
          photo_path?: string;
          image_largeur?: number;
          image_hauteur?: number;
        };
        Relationships: [];
      };
      points: {
        Row: {
          id: string;
          praticien_id: string;
          cliche_id: string;
          code_point: string;
          x: number;
          y: number;
          maj_le: string;
        };
        Insert: {
          id?: string;
          praticien_id: string;
          cliche_id: string;
          code_point: string;
          x: number;
          y: number;
        };
        Update: {
          x?: number;
          y?: number;
        };
        Relationships: [];
      };
      mesures: {
        Row: {
          id: string;
          praticien_id: string;
          bilan_id: string;
          cliche_id: string | null;
          type: string;
          valeur: number;
          unite: 'deg' | 'cm' | 'px';
          cree_le: string;
          maj_le: string;
        };
        Insert: {
          id?: string;
          praticien_id: string;
          bilan_id: string;
          cliche_id?: string | null;
          type: string;
          valeur: number;
          unite: 'deg' | 'cm' | 'px';
        };
        Update: {
          valeur?: number;
          unite?: 'deg' | 'cm' | 'px';
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      vue_posturale: VuePosturale;
    };
    CompositeTypes: Record<never, never>;
  };
};

export type Praticien = Database['public']['Tables']['praticiens']['Row'];
export type Patient = Database['public']['Tables']['patients']['Row'];
export type Bilan = Database['public']['Tables']['bilans']['Row'];
export type Cliche = Database['public']['Tables']['cliches']['Row'];
export type PointAnatomique = Database['public']['Tables']['points']['Row'];
export type Mesure = Database['public']['Tables']['mesures']['Row'];
