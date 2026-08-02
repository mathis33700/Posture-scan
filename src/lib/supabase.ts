import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database';

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !publishableKey) {
  throw new Error(
    'Configuration Supabase absente. Copiez .env.example en .env.local et renseignez ' +
      'VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY.'
  );
}

export const supabase = createClient<Database>(url, publishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // Les liens de réinitialisation de mot de passe arrivent en fragment d'URL.
    detectSessionInUrl: true,
  },
});

export const BUCKET_PHOTOS = 'postures';

/** Durée de validité des URL signées des photos. */
export const DUREE_URL_SIGNEE_S = 3600;
