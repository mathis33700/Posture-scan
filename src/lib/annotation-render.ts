import type { PointPixels } from './geometry';
import { BASE_FIL_A_PLOMB, SEGMENTS_PAR_VUE } from './points-catalog';
import type { VuePosturale } from '@/types/database';

export type PositionsPoints = Map<string, { x: number; y: number }>;

export type Annotations = {
  /** Abscisse du fil à plomb, ou `null` si sa base n'est pas placée. */
  abscisseFilAPlomb: number | null;
  segments: { cle: string; a: PointPixels; b: PointPixels }[];
  points: { cle: string; position: PointPixels }[];
  /** Épaisseur de trait proportionnée à la définition de l'image. */
  epaisseur: number;
};

export const COULEUR_PLOMB = '#38bdf8';
export const COULEUR_SEGMENT = '#f8fafc';
export const COULEUR_POINT = '#0ea5e9';

/**
 * Traduit un jeu de points en tracés à dessiner.
 *
 * Ce calcul est partagé par l'aperçu SVG et par le rendu canvas de l'export
 * PDF : les deux dessinent forcément la même chose, alors que deux
 * implémentations parallèles finiraient par diverger sur un décalage ou une
 * épaisseur.
 */
export function construireAnnotations(params: {
  vue: VuePosturale;
  positions: PositionsPoints;
  image: { largeur: number; hauteur: number };
}): Annotations {
  const { vue, positions, image } = params;

  const enPixels = (code: string): PointPixels | null => {
    const point = positions.get(code);
    return point ? { x: point.x * image.largeur, y: point.y * image.hauteur } : null;
  };

  const bases = BASE_FIL_A_PLOMB[vue]
    .map(enPixels)
    .filter((point): point is PointPixels => point !== null);

  const segments = SEGMENTS_PAR_VUE[vue].flatMap(([codeA, codeB]) => {
    const a = enPixels(codeA);
    const b = enPixels(codeB);
    return a && b ? [{ cle: `${codeA}-${codeB}`, a, b }] : [];
  });

  return {
    abscisseFilAPlomb:
      bases.length > 0 ? bases.reduce((somme, p) => somme + p.x, 0) / bases.length : null,
    segments,
    points: [...positions.keys()].flatMap((code) => {
      const position = enPixels(code);
      return position ? [{ cle: code, position }] : [];
    }),
    // Rapportée à la définition de l'image, l'épaisseur reste identique à
    // l'écran comme sur le PDF, quelle que soit la taille du cliché.
    epaisseur: Math.max(image.largeur, image.hauteur) / 400,
  };
}
