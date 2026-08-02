import { describe, expect, it } from 'vitest';

import {
  angleAvecHorizontale,
  angleBascule,
  arrondir,
  deviationHorizontale,
  distance,
  milieu,
  pixelsVersCm,
  sensAvantProfil,
  sensGauchePatient,
  versPixels,
} from './geometry';

describe('versPixels', () => {
  it('rend au point ses proportions réelles', () => {
    expect(versPixels({ x: 0.5, y: 0.25 }, { largeur: 1200, hauteur: 1600 })).toEqual({
      x: 600,
      y: 400,
    });
  });
});

describe('angleBascule', () => {
  it('renvoie 0 pour une ligne horizontale', () => {
    expect(angleBascule({ x: 100, y: 500 }, { x: 300, y: 500 })).toBe(0);
  });

  it('est positif quand le côté gauche du patient est plus haut', () => {
    // Le point droit est 100 px plus bas, sur un écart horizontal de 100 px.
    const angle = angleBascule({ x: 100, y: 400 }, { x: 200, y: 500 });
    expect(angle).toBeCloseTo(45);
  });

  it('est négatif quand le côté droit est plus haut', () => {
    const angle = angleBascule({ x: 100, y: 500 }, { x: 200, y: 400 });
    expect(angle).toBeCloseTo(-45);
  });

  it("donne le même signe de face et de dos, malgré l'inversion à l'image", () => {
    // De face, la gauche du patient est à droite de l'image ; de dos, à gauche.
    // La bascule anatomique, elle, est identique : gauche 20 px plus haute.
    const deFace = angleBascule({ x: 700, y: 480 }, { x: 500, y: 500 });
    const deDos = angleBascule({ x: 500, y: 480 }, { x: 700, y: 500 });

    expect(deFace).toBeCloseTo(deDos);
    expect(deFace).toBeGreaterThan(0);
  });

  it('vaut ±90° dans le cas dégénéré de deux points superposés en x', () => {
    expect(angleBascule({ x: 300, y: 400 }, { x: 300, y: 500 })).toBeCloseTo(90);
  });

  it("corrige bien le rapport d'aspect : le calcul sur des coordonnées normalisées serait faux", () => {
    // Deux points normalisés sur une photo 1200 × 1600 (3:4).
    const image = { largeur: 1200, hauteur: 1600 };
    const gauche = versPixels({ x: 0.3, y: 0.4 }, image);
    const droit = versPixels({ x: 0.7, y: 0.44 }, image);

    // En pixels : dx = 480, dy = 64 → atan(64/480) ≈ 7,59°.
    expect(angleBascule(gauche, droit)).toBeCloseTo(7.594, 2);

    // Sur les coordonnées normalisées brutes, on aurait atan(0,04/0,4) ≈ 5,71° :
    // une sous-estimation d'environ deux degrés, du même ordre que la mesure.
    const sansCorrection = (Math.atan2(0.44 - 0.4, Math.abs(0.7 - 0.3)) * 180) / Math.PI;
    expect(sansCorrection).toBeCloseTo(5.71, 1);
    expect(Math.abs(sansCorrection - angleBascule(gauche, droit))).toBeGreaterThan(1.5);
  });
});

describe('angleAvecHorizontale', () => {
  it('mesure une ouverture de 45°', () => {
    expect(angleAvecHorizontale({ x: 100, y: 500 }, { x: 200, y: 400 })).toBeCloseTo(45);
  });

  it('ignore le sens du tracé', () => {
    const aller = angleAvecHorizontale({ x: 100, y: 500 }, { x: 250, y: 400 });
    const retour = angleAvecHorizontale({ x: 250, y: 400 }, { x: 100, y: 500 });
    expect(aller).toBeCloseTo(retour);
  });

  it('reste positif quel que soit le côté vers lequel le patient regarde', () => {
    const versLaDroite = angleAvecHorizontale({ x: 500, y: 400 }, { x: 620, y: 300 });
    const versLaGauche = angleAvecHorizontale({ x: 500, y: 400 }, { x: 380, y: 300 });
    expect(versLaDroite).toBeCloseTo(versLaGauche);
    expect(versLaDroite).toBeGreaterThan(0);
  });
});

describe('sensGauchePatient', () => {
  it('vaut +1 quand la gauche anatomique est vers les x croissants (vue de face)', () => {
    expect(sensGauchePatient({ x: 700, y: 500 }, { x: 500, y: 500 })).toBe(1);
  });

  it('vaut −1 de dos, où les côtés sont inversés', () => {
    expect(sensGauchePatient({ x: 500, y: 500 }, { x: 700, y: 500 })).toBe(-1);
  });

  it('ne renvoie jamais 0, même pour deux points confondus', () => {
    expect(sensGauchePatient({ x: 600, y: 500 }, { x: 600, y: 500 })).toBe(1);
  });
});

describe('sensAvantProfil', () => {
  it('déduit le sens du regard de la position du tragus par rapport à C7', () => {
    expect(sensAvantProfil({ x: 700, y: 200 }, { x: 640, y: 260 })).toBe(1);
    expect(sensAvantProfil({ x: 500, y: 200 }, { x: 560, y: 260 })).toBe(-1);
  });
});

describe('deviationHorizontale', () => {
  it('compte positivement un décalage vers la gauche du patient', () => {
    // Vue de face : la gauche du patient est vers les x croissants.
    const ecart = deviationHorizontale({ x: 620, y: 300 }, { x: 600, y: 900 }, 1);
    expect(ecart).toBe(20);
  });

  it('inverse le signe de dos, pour désigner la même gauche anatomique', () => {
    const ecart = deviationHorizontale({ x: 580, y: 300 }, { x: 600, y: 900 }, -1);
    expect(ecart).toBe(20);
  });
});

describe('milieu et distance', () => {
  it('calcule le milieu de deux points', () => {
    expect(milieu({ x: 100, y: 200 }, { x: 300, y: 400 })).toEqual({ x: 200, y: 300 });
  });

  it('calcule une distance euclidienne', () => {
    expect(distance({ x: 0, y: 0 }, { x: 30, y: 40 })).toBe(50);
  });
});

describe('pixelsVersCm', () => {
  it('applique le calibrage du cabinet', () => {
    expect(pixelsVersCm(125, 12.5)).toBe(10);
  });
});

describe('arrondir', () => {
  it('arrondit à une décimale par défaut', () => {
    expect(arrondir(7.594)).toBe(7.6);
    expect(arrondir(-2.349)).toBe(-2.3);
  });
});
