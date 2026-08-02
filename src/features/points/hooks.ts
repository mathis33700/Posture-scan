import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { usePraticienId } from '@/features/auth/useAuth';
import { supabase } from '@/lib/supabase';
import type { PointAnatomique } from '@/types/domaine';

export const clesPoints = {
  parCliches: (praticienId: string, clicheIds: string[]) =>
    ['points', praticienId, [...clicheIds].sort()] as const,
};

/** Points de plusieurs clichés en une requête, indexés par identifiant de cliché. */
export function usePointsParCliche(clicheIds: string[]) {
  const praticienId = usePraticienId();

  return useQuery({
    queryKey: clesPoints.parCliches(praticienId, clicheIds),
    queryFn: async (): Promise<Map<string, PointAnatomique[]>> => {
      const { data, error } = await supabase
        .from('points')
        .select('*')
        .in('cliche_id', clicheIds);
      if (error) throw error;

      const parCliche = new Map<string, PointAnatomique[]>();
      for (const id of clicheIds) parCliche.set(id, []);
      for (const point of data) {
        parCliche.get(point.cliche_id)?.push(point);
      }
      return parCliche;
    },
    enabled: clicheIds.length > 0,
  });
}

export function useEnregistrerPoint(clicheIds: string[]) {
  const praticienId = usePraticienId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entree: {
      clicheId: string;
      codePoint: string;
      x: number;
      y: number;
    }): Promise<PointAnatomique> => {
      const { data, error } = await supabase
        .from('points')
        .upsert(
          {
            praticien_id: praticienId,
            cliche_id: entree.clicheId,
            code_point: entree.codePoint,
            x: entree.x,
            y: entree.y,
          },
          { onConflict: 'cliche_id,code_point' }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: clesPoints.parCliches(praticienId, clicheIds),
      });
    },
  });
}

export function useSupprimerPoint(clicheIds: string[]) {
  const praticienId = usePraticienId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entree: { clicheId: string; codePoint: string }): Promise<void> => {
      const { error } = await supabase
        .from('points')
        .delete()
        .eq('cliche_id', entree.clicheId)
        .eq('code_point', entree.codePoint);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: clesPoints.parCliches(praticienId, clicheIds),
      });
    },
  });
}
