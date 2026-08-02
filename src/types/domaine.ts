/**
 * Vocabulaire métier, dérivé des types de la base.
 *
 * `database.ts` est **généré** par la CLI Supabase et régénéré à chaque
 * migration : il est écrasé intégralement. Ces alias vivent donc à côté, pour
 * qu'une régénération ne les emporte pas — c'est le seul fichier de types que
 * l'application importe.
 *
 *   npx supabase gen types typescript --project-id <ref> > src/types/database.ts
 */
import type { Database } from './database';

export type { Database };

export type VuePosturale = Database['public']['Enums']['vue_posturale'];

export type Praticien = Database['public']['Tables']['praticiens']['Row'];
export type Patient = Database['public']['Tables']['patients']['Row'];
export type Bilan = Database['public']['Tables']['bilans']['Row'];
export type Cliche = Database['public']['Tables']['cliches']['Row'];
export type PointAnatomique = Database['public']['Tables']['points']['Row'];
export type Mesure = Database['public']['Tables']['mesures']['Row'];
