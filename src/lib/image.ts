/** Côté le plus long après redimensionnement, en pixels. */
const COTE_MAX = 1600;

/** Qualité JPEG : au-delà, le fichier grossit sans gain visible pour du pointage. */
const QUALITE_JPEG = 0.85;

export type ImagePreparee = {
  fichier: Blob;
  largeur: number;
  hauteur: number;
  extension: 'jpg';
  typeMime: 'image/jpeg';
};

/**
 * Prépare une photo pour le stockage : orientation appliquée, redimensionnement
 * et recompression en JPEG.
 *
 * Le point délicat est l'orientation EXIF. Les photos prises à l'iPhone sont
 * fréquemment enregistrées dans le capteur puis accompagnées d'un tag EXIF
 * indiquant la rotation à appliquer. Sans traitement, le navigateur affiche
 * l'image redressée mais un canvas la dessine brute : les points placés à
 * l'écran ne correspondraient plus au fichier, et les angles calculés seraient
 * faux d'un quart de tour. `imageOrientation: 'from-image'` applique la
 * rotation à la décompression ; ce qui est stocké est donc déjà droit, sans
 * métadonnée d'orientation résiduelle, et `largeur`/`hauteur` décrivent bien
 * l'image telle qu'elle sera réaffichée.
 */
export async function preparerPhoto(fichier: File): Promise<ImagePreparee> {
  const source = await createImageBitmap(fichier, { imageOrientation: 'from-image' });

  try {
    const facteur = Math.min(1, COTE_MAX / Math.max(source.width, source.height));
    const largeur = Math.round(source.width * facteur);
    const hauteur = Math.round(source.height * facteur);

    const canvas = document.createElement('canvas');
    canvas.width = largeur;
    canvas.height = hauteur;

    const contexte = canvas.getContext('2d');
    if (!contexte) throw new Error("Le canvas 2D n'est pas disponible sur cet appareil.");

    contexte.imageSmoothingQuality = 'high';
    contexte.drawImage(source, 0, 0, largeur, hauteur);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', QUALITE_JPEG)
    );
    if (!blob) throw new Error("La photo n'a pas pu être encodée.");

    return {
      fichier: blob,
      largeur,
      hauteur,
      extension: 'jpg',
      typeMime: 'image/jpeg',
    };
  } finally {
    source.close();
  }
}

/** Charge une image et attend qu'elle soit décodée, pour un rendu canvas fiable. */
export function chargerImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    // Les URL signées sont sur le domaine Supabase : sans CORS, le canvas
    // serait marqué « tainted » et l'export PDF échouerait.
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Photo illisible.'));
    image.src = url;
  });
}
