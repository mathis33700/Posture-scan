import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { usePraticienId } from '@/features/auth/useAuth';
import { supprimerPhotosSousPrefixe } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import type { Bilan } from '@/types/domaine';

export const clesBilans = {
  parPatient: (praticienId: string, patientId: string) =>
    ['bilans', praticienId, patientId] as const,
  detail: (praticienId: string, bilanId: string) =>
    ['bilans', praticienId, 'detail', bilanId] as const,
};

export function useBilans(patientId: string) {
  const praticienId = usePraticienId();

  return useQuery({
    queryKey: clesBilans.parPatient(praticienId, patientId),
    queryFn: async (): Promise<Bilan[]> => {
      const { data, error } = await supabase
        .from('bilans')
        .select('*')
        .eq('patient_id', patientId)
        .order('date_bilan', { ascending: false })
        .order('cree_le', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useBilan(bilanId: string) {
  const praticienId = usePraticienId();

  return useQuery({
    queryKey: clesBilans.detail(praticienId, bilanId),
    queryFn: async (): Promise<Bilan> => {
      const { data, error } = await supabase
        .from('bilans')
        .select('*')
        .eq('id', bilanId)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreerBilan(patientId: string) {
  const praticienId = usePraticienId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (valeurs: { date_bilan: string; notes: string }): Promise<Bilan> => {
      const { data, error } = await supabase
        .from('bilans')
        .insert({ ...valeurs, patient_id: patientId, praticien_id: praticienId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: clesBilans.parPatient(praticienId, patientId),
      });
    },
  });
}

export function useMajBilan(bilanId: string) {
  const praticienId = usePraticienId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (valeurs: { date_bilan?: string; notes?: string }): Promise<Bilan> => {
      const { data, error } = await supabase
        .from('bilans')
        .update(valeurs)
        .eq('id', bilanId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (bilan) => {
      queryClient.setQueryData(clesBilans.detail(praticienId, bilanId), bilan);
      void queryClient.invalidateQueries({
        queryKey: clesBilans.parPatient(praticienId, bilan.patient_id),
      });
    },
  });
}

export function useSupprimerBilan(patientId: string) {
  const praticienId = usePraticienId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bilanId: string): Promise<void> => {
      // Les photos d'abord : elles ne partent pas avec la ligne, faute de clé
      // étrangère entre le bucket et la base.
      await supprimerPhotosSousPrefixe(`${praticienId}/${patientId}/${bilanId}`);

      const { error } = await supabase.from('bilans').delete().eq('id', bilanId);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: clesBilans.parPatient(praticienId, patientId),
      });
    },
  });
}
