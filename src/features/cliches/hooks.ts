import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { usePraticienId } from '@/features/auth/useAuth';
import { preparerPhoto } from '@/lib/image';
import { cheminPhoto, urlsSignees } from '@/lib/storage';
import { BUCKET_PHOTOS, supabase } from '@/lib/supabase';
import type { Cliche, VuePosturale } from '@/types/database';

export const VUES: VuePosturale[] = ['face', 'dos', 'profil'];

export const LIBELLE_VUE: Record<VuePosturale, string> = {
  face: 'Face',
  dos: 'Dos',
  profil: 'Profil',
};

export const clesCliches = {
  parBilan: (praticienId: string, bilanId: string) =>
    ['cliches', praticienId, bilanId] as const,
  urls: (praticienId: string, bilanId: string) =>
    ['cliches', praticienId, bilanId, 'urls'] as const,
};

export function useCliches(bilanId: string) {
  const praticienId = usePraticienId();

  return useQuery({
    queryKey: clesCliches.parBilan(praticienId, bilanId),
    queryFn: async (): Promise<Cliche[]> => {
      const { data, error } = await supabase
        .from('cliches')
        .select('*')
        .eq('bilan_id', bilanId);
      if (error) throw error;
      return data;
    },
    enabled: bilanId !== '',
  });
}

/**
 * URL signées des clichés d'un bilan, indexées par chemin.
 *
 * Rafraîchies un peu avant l'expiration côté Storage : une consultation peut
 * durer plus longtemps que la validité d'une URL, et une photo qui disparaît
 * en pleine séance de pointage serait déroutante.
 */
export function useUrlsCliches(bilanId: string, cliches: Cliche[] | undefined) {
  const praticienId = usePraticienId();
  const chemins = (cliches ?? []).map((cliche) => cliche.photo_path).sort();

  return useQuery({
    queryKey: [...clesCliches.urls(praticienId, bilanId), chemins],
    queryFn: () => urlsSignees(chemins),
    enabled: chemins.length > 0,
    staleTime: 45 * 60 * 1000,
    refetchInterval: 45 * 60 * 1000,
  });
}

export function useEnregistrerCliche(params: { bilanId: string; patientId: string }) {
  const { bilanId, patientId } = params;
  const praticienId = usePraticienId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entree: { vue: VuePosturale; fichier: File }): Promise<Cliche> => {
      const preparee = await preparerPhoto(entree.fichier);

      const chemin = cheminPhoto({
        praticienId,
        patientId,
        bilanId,
        vue: entree.vue,
        extension: preparee.extension,
      });

      // `upsert` permet de reprendre une photo ratée sans changer de chemin :
      // le fichier est écrasé et la ligne mise à jour.
      const { error: erreurUpload } = await supabase.storage
        .from(BUCKET_PHOTOS)
        .upload(chemin, preparee.fichier, {
          contentType: preparee.typeMime,
          upsert: true,
        });
      if (erreurUpload) throw erreurUpload;

      const { data, error } = await supabase
        .from('cliches')
        .upsert(
          {
            praticien_id: praticienId,
            bilan_id: bilanId,
            vue: entree.vue,
            photo_path: chemin,
            image_largeur: preparee.largeur,
            image_hauteur: preparee.hauteur,
          },
          { onConflict: 'bilan_id,vue' }
        )
        .select()
        .single();
      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: clesCliches.parBilan(praticienId, bilanId),
      });
    },
  });
}

export function useSupprimerCliche(bilanId: string) {
  const praticienId = usePraticienId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cliche: Cliche): Promise<void> => {
      // Le fichier d'abord : la ligne supprimée, plus rien ne donnerait son chemin.
      const { error: erreurStockage } = await supabase.storage
        .from(BUCKET_PHOTOS)
        .remove([cliche.photo_path]);
      if (erreurStockage) throw erreurStockage;

      // Les points du cliché partent en cascade.
      const { error } = await supabase.from('cliches').delete().eq('id', cliche.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: clesCliches.parBilan(praticienId, bilanId),
      });
    },
  });
}
