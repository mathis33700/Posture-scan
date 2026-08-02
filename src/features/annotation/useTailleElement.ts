import { useEffect, useState, type RefObject } from 'react';

export type Taille = { largeur: number; hauteur: number };

/** Suit les dimensions d'un élément via ResizeObserver (rotation, clavier virtuel, split view). */
export function useTailleElement(reference: RefObject<HTMLElement | null>): Taille {
  const [taille, setTaille] = useState<Taille>({ largeur: 0, hauteur: 0 });

  useEffect(() => {
    const element = reference.current;
    if (!element) return;

    const observateur = new ResizeObserver(([entree]) => {
      if (!entree) return;
      const { width, height } = entree.contentRect;
      setTaille((precedente) =>
        // Évite un rendu par pixel lors d'un redimensionnement continu.
        precedente.largeur === width && precedente.hauteur === height
          ? precedente
          : { largeur: width, hauteur: height }
      );
    });

    observateur.observe(element);
    return () => observateur.disconnect();
  }, [reference]);

  return taille;
}
