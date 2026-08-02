export type Rectangle = { left: number; top: number; width: number; height: number };

/**
 * Rectangle occupé par une image en « contain » dans un conteneur : l'image est
 * agrandie au maximum sans être rognée ni déformée, puis centrée.
 *
 * Ce rectangle est calculé en JavaScript plutôt que laissé à `object-contain`,
 * car les points sont positionnés en pourcentage de l'image : il faut connaître
 * la zone réellement occupée par les pixels, pas celle du conteneur avec ses
 * bandes vides.
 */
export function calculerFit(
  conteneur: { largeur: number; hauteur: number },
  image: { largeur: number; hauteur: number }
): Rectangle {
  if (
    conteneur.largeur <= 0 ||
    conteneur.hauteur <= 0 ||
    image.largeur <= 0 ||
    image.hauteur <= 0
  ) {
    return { left: 0, top: 0, width: 0, height: 0 };
  }

  const facteur = Math.min(
    conteneur.largeur / image.largeur,
    conteneur.hauteur / image.hauteur
  );
  const width = image.largeur * facteur;
  const height = image.hauteur * facteur;

  return {
    left: (conteneur.largeur - width) / 2,
    top: (conteneur.hauteur - height) / 2,
    width,
    height,
  };
}
