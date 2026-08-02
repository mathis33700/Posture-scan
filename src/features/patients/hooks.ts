import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { usePraticienId } from '@/features/auth/useAuth';
import { supprimerPhotosSousPrefixe } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import type { Patient } from '@/types/domaine';

export const clesPatients = {
  tous: (praticienId: string) => ['patients', praticienId] as const,
  liste: (praticienId: string, recherche: string) =>
    ['patients', praticienId, 'liste', recherche] as const,
  detail: (praticienId: string, patientId: string) =>
    ['patients', praticienId, 'detail', patientId] as const,
};

/**
 * PostgREST interprète les virgules et les parenthèses comme la syntaxe du
 * filtre `or`, et `%`/`_` comme des jokers de `ilike`. On les retire du terme
 * saisi pour qu'une recherche « Durand, Marie » ne casse pas la requête.
 */
function nettoyerRecherche(recherche: string): string {
  return recherche.replace(/[,()%_\\*]/g, ' ').trim();
}

export function usePatients(recherche: string) {
  const praticienId = usePraticienId();
  const terme = nettoyerRecherche(recherche);

  return useQuery({
    queryKey: clesPatients.liste(praticienId, terme),
    queryFn: async (): Promise<Patient[]> => {
      let requete = supabase
        .from('patients')
        .select('*')
        .order('nom')
        .order('prenom')
        .limit(200);

      if (terme) {
        requete = requete.or(`nom.ilike.%${terme}%,prenom.ilike.%${terme}%`);
      }

      const { data, error } = await requete;
      if (error) throw error;
      return data;
    },
  });
}

export function usePatient(patientId: string) {
  const praticienId = usePraticienId();

  return useQuery({
    queryKey: clesPatients.detail(praticienId, patientId),
    queryFn: async (): Promise<Patient> => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export type SaisiePatient = {
  nom: string;
  prenom: string;
  date_naissance: string | null;
  notes: string;
};

export function useCreerPatient() {
  const praticienId = usePraticienId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (valeurs: SaisiePatient): Promise<Patient> => {
      const { data, error } = await supabase
        .from('patients')
        .insert({ ...valeurs, praticien_id: praticienId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clesPatients.tous(praticienId) });
    },
  });
}

export function useMajPatient(patientId: string) {
  const praticienId = usePraticienId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (valeurs: SaisiePatient): Promise<Patient> => {
      const { data, error } = await supabase
        .from('patients')
        .update(valeurs)
        .eq('id', patientId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (patient) => {
      queryClient.setQueryData(clesPatients.detail(praticienId, patientId), patient);
      void queryClient.invalidateQueries({ queryKey: clesPatients.tous(praticienId) });
    },
  });
}

export function useSupprimerPatient() {
  const praticienId = usePraticienId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patientId: string): Promise<void> => {
      // Les bilans, clichés, points et mesures partent en cascade côté base.
      // Les photos, elles, ne sont liées par aucune clé étrangère : il faut les
      // retirer du bucket explicitement, et avant la ligne — si la suppression
      // échouait après, les fichiers deviendraient orphelins et introuvables.
      await supprimerPhotosSousPrefixe(`${praticienId}/${patientId}`);

      const { error } = await supabase.from('patients').delete().eq('id', patientId);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clesPatients.tous(praticienId) });
    },
  });
}
