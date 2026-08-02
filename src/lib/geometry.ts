/**
 * Primitives géométriques du calcul postural.
 *
 * Toutes les fonctions travaillent en **pixels**, jamais en coordonnées
 * normalisées. C'est la précaution centrale de ce module : les points sont
 * stockés entre 0 et 1, et calculer un angle directement dessus revient à
 * mesurer sur une image écrasée au carré. Sur une photo 3:4, une ligne
 * d'épaules réellement inclinée de 5° en donnerait environ 6,7 — l'erreur est
 * du même ordre que ce qu'on cherche à mesurer.
 *
 * Repère : `x` vers la droite de l'image, `y` vers le bas.
 */

export type PointNormalise = { x: number; y: number };
export type PointPixels = { x: number; y: number };
export type DimensionsImage = { largeur: number; hauteur: number };

const RAD_VERS_DEG = 180 / Math.PI;

/** Remet un point normalisé dans l'espace pixel de son image. */
export function versPixels(point: PointNormalise, image: DimensionsImage): PointPixels {
  return { x: point.x * image.largeur, y: point.y * image.hauteur };
}

/**
 * Bascule d'une ligne bilatérale, en degrés.
 *
 * Positif ⇒ le côté **gauche du patient** est plus haut.
 *
 * L'écart horizontal est pris en valeur absolue, ce qui rend le résultat
 * indépendant du côté de l'image où tombe chaque point. C'est indispensable :
 * de face le patient nous fait face, de dos il est retourné, donc sa gauche
 * change de côté à l'image alors que la bascule anatomique, elle, ne change pas.
 */
export function angleBascule(gauche: PointPixels, droit: PointPixels): number {
  const ecartHorizontal = Math.abs(droit.x - gauche.x);
  // y croît vers le bas : un point droit plus bas signifie une gauche plus haute.
  const denivele = droit.y - gauche.y;
  return Math.atan2(denivele, ecartHorizontal) * RAD_VERS_DEG;
}

/**
 * Angle entre l'horizontale et le segment `origine → extremite`, entre 0 et 90°.
 *
 * Sert aux mesures sagittales comme l'angle cranio-vertébral, où seule
 * l'ouverture compte et non l'orientation du tracé.
 */
export function angleAvecHorizontale(origine: PointPixels, extremite: PointPixels): number {
  const ecartHorizontal = Math.abs(extremite.x - origine.x);
  const ecartVertical = Math.abs(extremite.y - origine.y);
  return Math.atan2(ecartVertical, ecartHorizontal) * RAD_VERS_DEG;
}

/**
 * Sens de la gauche du patient dans l'image, déduit d'une paire bilatérale.
 *
 * Renvoie +1 si la gauche anatomique se trouve vers les x croissants, −1 sinon.
 * Permet d'orienter les déviations latérales sans savoir si la photo est prise
 * de face ou de dos.
 */
export function sensGauchePatient(gauche: PointPixels, droit: PointPixels): number {
  return Math.sign(gauche.x - droit.x) || 1;
}

/**
 * Sens vers lequel le patient regarde, sur une vue de profil.
 *
 * Le tragus est en avant de C7 : leur écart horizontal donne donc la direction
 * de l'avant, sans avoir à demander au praticien de quel côté il a photographié.
 */
export function sensAvantProfil(tragus: PointPixels, c7: PointPixels): number {
  return Math.sign(tragus.x - c7.x) || 1;
}

/**
 * Écart horizontal signé d'un point par rapport à la verticale passant par
 * `reference`, en pixels, exprimé dans le sens donné par `sens`.
 */
export function deviationHorizontale(
  point: PointPixels,
  reference: PointPixels,
  sens: number
): number {
  return sens * (point.x - reference.x);
}

/** Milieu de deux points. */
export function milieu(a: PointPixels, b: PointPixels): PointPixels {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/** Distance euclidienne, en pixels. */
export function distance(a: PointPixels, b: PointPixels): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/** Conversion en centimètres à partir du calibrage du cabinet. */
export function pixelsVersCm(pixels: number, echellePxParCm: number): number {
  return pixels / echellePxParCm;
}

/** Arrondi d'affichage, pour ne pas exposer une précision que la photo n'a pas. */
export function arrondir(valeur: number, decimales = 1): number {
  const facteur = 10 ** decimales;
  return Math.round(valeur * facteur) / facteur;
}
