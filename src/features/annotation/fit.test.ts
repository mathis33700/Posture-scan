import { describe, expect, it } from 'vitest';

import { calculerFit } from './fit';

describe('calculerFit', () => {
  it('centre horizontalement une image plus étroite que le conteneur', () => {
    // Image 3:4 dans un conteneur carré : la hauteur est limitante.
    const rect = calculerFit({ largeur: 400, hauteur: 400 }, { largeur: 300, hauteur: 400 });

    expect(rect.height).toBe(400);
    expect(rect.width).toBe(300);
    expect(rect.left).toBe(50);
    expect(rect.top).toBe(0);
  });

  it('centre verticalement une image plus large que le conteneur', () => {
    const rect = calculerFit({ largeur: 400, hauteur: 400 }, { largeur: 400, hauteur: 300 });

    expect(rect.width).toBe(400);
    expect(rect.height).toBe(300);
    expect(rect.left).toBe(0);
    expect(rect.top).toBe(50);
  });

  it("conserve le rapport d'aspect en agrandissant une petite image", () => {
    const rect = calculerFit({ largeur: 800, hauteur: 800 }, { largeur: 100, hauteur: 200 });

    expect(rect.width / rect.height).toBeCloseTo(0.5);
    expect(rect.height).toBe(800);
  });

  it('renvoie un rectangle vide tant que le conteneur n’est pas mesuré', () => {
    // Au premier rendu, le ResizeObserver n'a pas encore fourni de dimensions.
    expect(calculerFit({ largeur: 0, hauteur: 0 }, { largeur: 300, hauteur: 400 })).toEqual({
      left: 0,
      top: 0,
      width: 0,
      height: 0,
    });
  });
});
