import { BUCKET_PHOTOS, DUREE_URL_SIGNEE_S, supabase } from './supabase';

/** Chemin d'une photo dans le bucket privé. */
export function cheminPhoto(params: {
  praticienId: string;
  patientId: string;
  bilanId: string;
  vue: string;
  extension: string;
}): string {
  const { praticienId, patientId, bilanId, vue, extension } = params;
  return `${praticienId}/${patientId}/${bilanId}/${vue}.${extension}`;
}

/**
 * URL signée temporaire. Le bucket étant privé, c'est le seul moyen d'afficher
 * une photo ; l'URL expire au bout de `DUREE_URL_SIGNEE_S`.
 */
export async function urlSignee(photoPath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET_PHOTOS)
    .createSignedUrl(photoPath, DUREE_URL_SIGNEE_S);
  if (error) throw error;
  return data.signedUrl;
}

/** Plusieurs URL signées en un appel, pour ne pas enchaîner les allers-retours. */
export async function urlsSignees(photoPaths: string[]): Promise<Map<string, string>> {
  if (photoPaths.length === 0) return new Map();

  const { data, error } = await supabase.storage
    .from(BUCKET_PHOTOS)
    .createSignedUrls(photoPaths, DUREE_URL_SIGNEE_S);
  if (error) throw error;

  const parChemin = new Map<string, string>();
  for (const entree of data) {
    if (entree.signedUrl && entree.path) parChemin.set(entree.path, entree.signedUrl);
  }
  return parChemin;
}

/**
 * Liste récursivement les fichiers sous un préfixe.
 *
 * Le Storage Supabase n'a pas de vrais dossiers : `list` renvoie à la fois les
 * fichiers du niveau courant et les préfixes qui font office de sous-dossiers,
 * ces derniers étant reconnaissables à leur `id` nul.
 */
async function listerRecursivement(prefixe: string): Promise<string[]> {
  const { data, error } = await supabase.storage
    .from(BUCKET_PHOTOS)
    .list(prefixe, { limit: 1000 });
  if (error) throw error;

  const chemins: string[] = [];
  for (const entree of data) {
    const chemin = `${prefixe}/${entree.name}`;
    if (entree.id === null) {
      chemins.push(...(await listerRecursivement(chemin)));
    } else {
      chemins.push(chemin);
    }
  }
  return chemins;
}

/**
 * Supprime toutes les photos sous un préfixe.
 *
 * Les fichiers du bucket ne sont liés aux lignes par aucune clé étrangère : la
 * suppression en cascade côté Postgres ne les emporte pas, il faut les retirer
 * explicitement avant de supprimer le patient ou le bilan.
 */
export async function supprimerPhotosSousPrefixe(prefixe: string): Promise<void> {
  const chemins = await listerRecursivement(prefixe);
  if (chemins.length === 0) return;

  const { error } = await supabase.storage.from(BUCKET_PHOTOS).remove(chemins);
  if (error) throw error;
}
