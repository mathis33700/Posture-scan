import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { usePraticienId } from '@/features/auth/useAuth';
import { supabase } from '@/lib/supabase';
import type { Praticien } from '@/types/database';

export function clePraticien(id: string) {
  return ['praticien', id] as const;
}

export function usePraticien() {
  const praticienId = usePraticienId();

  return useQuery({
    queryKey: clePraticien(praticienId),
    queryFn: async (): Promise<Praticien> => {
      const { data, error } = await supabase
        .from('praticiens')
        .select('*')
        .eq('id', praticienId)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export type MajPraticien = {
  nom: string;
  cabinet: string;
  echelle_px_par_cm: number | null;
};

export function useMajPraticien() {
  const praticienId = usePraticienId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (valeurs: MajPraticien): Promise<Praticien> => {
      const { data, error } = await supabase
        .from('praticiens')
        .update(valeurs)
        .eq('id', praticienId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (praticien) => {
      queryClient.setQueryData(clePraticien(praticienId), praticien);
    },
  });
}
