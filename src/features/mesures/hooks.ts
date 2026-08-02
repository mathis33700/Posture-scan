import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { usePraticienId } from '@/features/auth/useAuth';
import type { ResultatMesure } from '@/lib/measures';
import { supabase } from '@/lib/supabase';
import type { Mesure } from '@/types/domaine';

export const clesMesures = {
  parBilan: (praticienId: string, bilanId: string) =>
    ['mesures', praticienId, bilanId] as const,
};

export function useMesures(bilanId: string) {
  const praticienId = usePraticienId();

  return useQuery({
    queryKey: clesMesures.parBilan(praticienId, bilanId),
    queryFn: async (): Promise<Mesure[]> => {
      const { data, error } = await supabase
        .from('mesures')
        .select('*')
        .eq('bilan_id', bilanId);
      if (error) throw error;
      return data;
    },
  });
}

export type MesureAEnregistrer = Pick<ResultatMesure, 'type' | 'valeur' | 'unite'> & {
  clicheId: string | null;
};

/**
 * Remplace le jeu de mesures d'un bilan.
 *
 * Les mesures sont dérivées des points : elles sont recalculées à chaque
 * affichage et persistées pour que l'historique, la comparaison et le rapport
 * puissent les lire sans recharger tous les points de tous les bilans.
 *
 * Les types devenus absents sont supprimés : si un point est effacé, la mesure
 * qui en dépendait doit disparaître, et non rester figée sur sa dernière valeur.
 */
export function useRemplacerMesures(bilanId: string) {
  const praticienId = usePraticienId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mesures: MesureAEnregistrer[]): Promise<void> => {
      if (mesures.length > 0) {
        const { error } = await supabase.from('mesures').upsert(
          mesures.map((mesure) => ({
            praticien_id: praticienId,
            bilan_id: bilanId,
            cliche_id: mesure.clicheId,
            type: mesure.type,
            valeur: mesure.valeur,
            unite: mesure.unite,
          })),
          { onConflict: 'bilan_id,type' }
        );
        if (error) throw error;
      }

      const typesConserves = mesures.map((mesure) => mesure.type);
      let suppression = supabase.from('mesures').delete().eq('bilan_id', bilanId);
      if (typesConserves.length > 0) {
        suppression = suppression.not(
          'type',
          'in',
          `(${typesConserves.map((type) => `"${type}"`).join(',')})`
        );
      }

      const { error: erreurSuppression } = await suppression;
      if (erreurSuppression) throw erreurSuppression;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: clesMesures.parBilan(praticienId, bilanId),
      });
    },
  });
}
