import { useEffect, useMemo, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

import { AuthContext } from './AuthContext';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [chargement, setChargement] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    let actif = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!actif) return;
      setSession(data.session);
      setChargement(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((evenement, nouvelle) => {
      setSession(nouvelle);
      setChargement(false);

      // À la déconnexion, on vide le cache : il contient des données de santé
      // qui ne doivent pas rester en mémoire pour la session suivante.
      if (evenement === 'SIGNED_OUT') {
        queryClient.clear();
      }
    });

    return () => {
      actif = false;
      subscription.subscription.unsubscribe();
    };
  }, [queryClient]);

  const valeur = useMemo(() => ({ session, chargement }), [session, chargement]);

  return <AuthContext value={valeur}>{children}</AuthContext>;
}
