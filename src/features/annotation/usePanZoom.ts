import { useCallback, useRef, useState } from 'react';

export const ZOOM_MIN = 1;
export const ZOOM_MAX = 8;

export type Transformation = { echelle: number; tx: number; ty: number };

const NEUTRE: Transformation = { echelle: 1, tx: 0, ty: 0 };

/**
 * Zoom et déplacement de la photo.
 *
 * La transformation s'applique avec `transform-origin: 0 0`, ce qui donne
 * `écran = base + t + échelle × local`. Ancrer un point sous les doigts pendant
 * un pincement se réduit alors à `t' = u − (k'/k)(u − t)`, où `u` est le milieu
 * des deux doigts rapporté à l'origine de l'image. Avec une origine centrée, la
 * même correction demanderait de compenser en plus le décalage du centre.
 */
export function usePanZoom() {
  const [transformation, setTransformation] = useState<Transformation>(NEUTRE);
  const derniereDistance = useRef<number | null>(null);

  const deplacer = useCallback((dx: number, dy: number) => {
    setTransformation((t) => ({ ...t, tx: t.tx + dx, ty: t.ty + dy }));
  }, []);

  /**
   * @param facteur      rapport entre la nouvelle et l'ancienne échelle
   * @param ancrageX/Y   point à laisser immobile, en coordonnées relatives à
   *                     l'origine de l'image non transformée
   */
  const zoomer = useCallback((facteur: number, ancrageX: number, ancrageY: number) => {
    setTransformation((t) => {
      const echelle = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, t.echelle * facteur));
      // Revenu à l'échelle 1, on recadre : sinon l'image peut rester décalée
      // hors du conteneur sans moyen évident de la ramener.
      if (echelle === ZOOM_MIN) return NEUTRE;

      const rapport = echelle / t.echelle;
      return {
        echelle,
        tx: ancrageX - rapport * (ancrageX - t.tx),
        ty: ancrageY - rapport * (ancrageY - t.ty),
      };
    });
  }, []);

  const reinitialiser = useCallback(() => setTransformation(NEUTRE), []);

  /** Met à jour le zoom à partir de l'écartement courant de deux doigts. */
  const pincer = useCallback(
    (distance: number, ancrageX: number, ancrageY: number) => {
      const precedente = derniereDistance.current;
      derniereDistance.current = distance;
      if (precedente === null || precedente === 0) return;
      zoomer(distance / precedente, ancrageX, ancrageY);
    },
    [zoomer]
  );

  const finPincement = useCallback(() => {
    derniereDistance.current = null;
  }, []);

  return { transformation, deplacer, zoomer, pincer, finPincement, reinitialiser };
}
