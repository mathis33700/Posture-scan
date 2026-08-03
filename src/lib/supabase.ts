import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/types/domaine';

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * `true` lorsque les variables d'environnement n'ont pas été fournies au build.
 *
 * Ce module ne lève volontairement plus d'erreur : une exception au chargement
 * empêche React de monter, et l'utilisateur n'obtient qu'une page blanche sans
 * la moindre indication. L'application affiche à la place un écran explicite,
 * et c'est bien plus utile — le cas se produit surtout à la mise en ligne,
 * quand les variables ont été déclarées à l'exécution au lieu du build.
 */
export const configurationManquante = !url || !publishableKey;

export const supabase = createClient<Database>(
  // Valeurs de repli syntaxiquement valides : `createClient` refuse une URL
  // vide, or ce module est importé avant que l'écran d'erreur ne s'affiche.
  // Aucune requête ne partira, l'application s'arrêtant sur cet écran.
  url || 'https://configuration-absente.invalid',
  publishableKey || 'configuration-absente',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // Les liens de réinitialisation de mot de passe arrivent en fragment d'URL.
      detectSessionInUrl: true,
    },
  }
);

export const BUCKET_PHOTOS = 'postures';

/** Durée de validité des URL signées des photos. */
export const DUREE_URL_SIGNEE_S = 3600;
