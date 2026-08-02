import { describe, expect, it } from 'vitest';

import type { PointNormalise } from './geometry';
import { calculerMesures, estDansLaNorme, libelleNorme } from './measures';

/** Photo de test au format portrait 3:4, comme une prise de vue au cabinet. */
const IMAGE = { largeur: 1200, hauteur: 1600 };

/** Calibrage : 12 px par cm, soit un patient d'environ 1,33 m de haut à l'image. */
const ECHELLE = 12;

function points(entrees: Record<string, [number, number]>): Map<string, PointNormalise> {
  return new Map(Object.entries(entrees).map(([code, [x, y]]) => [code, { x, y }]));
}

function trouver(resultats: ReturnType<typeof calculerMesures>, type: string) {
  const mesure = resultats.find((r) => r.type === type);
  if (!mesure) throw new Error(`Mesure ${type} absente du résultat`);
  return mesure;
}

describe('calculerMesures — vue de face', () => {
  // De face, le patient nous fait face : sa gauche est à droite de l'image.
  const POSE_NEUTRE = {
    tragus_gauche: [0.54, 0.12] as [number, number],
    tragus_droit: [0.46, 0.12] as [number, number],
    acromion_gauche: [0.64, 0.24] as [number, number],
    acromion_droit: [0.36, 0.24] as [number, number],
    eias_gauche: [0.58, 0.5] as [number, number],
    eias_droit: [0.42, 0.5] as [number, number],
    genou_gauche: [0.56, 0.72] as [number, number],
    genou_droit: [0.44, 0.72] as [number, number],
    malleole_gauche: [0.54, 0.94] as [number, number],
    malleole_droite: [0.46, 0.94] as [number, number],
  };

  it('ne signale aucune bascule sur une posture symétrique', () => {
    const resultats = calculerMesures({
      vue: 'face',
      points: points(POSE_NEUTRE),
      image: IMAGE,
      echelle: ECHELLE,
    });

    expect(trouver(resultats, 'angle_epaules_face').valeur).toBe(0);
    expect(trouver(resultats, 'angle_epaules_face').dansLaNorme).toBe(true);
    expect(trouver(resultats, 'angle_epaules_face').interpretation).toBe('Symétrique (0°)');
  });

  it("nomme le côté gauche quand l'épaule gauche est plus haute", () => {
    // L'acromion droit descend : la gauche devient la plus haute.
    const resultats = calculerMesures({
      vue: 'face',
      points: points({ ...POSE_NEUTRE, acromion_droit: [0.36, 0.27] }),
      image: IMAGE,
      echelle: ECHELLE,
    });

    const mesure = trouver(resultats, 'angle_epaules_face');
    // dx = 0,28 × 1200 = 336 px ; dy = 0,03 × 1600 = 48 px → atan(48/336) ≈ 8,13°
    expect(mesure.valeur).toBeCloseTo(8.1, 1);
    expect(mesure.interpretation).toBe('Côté gauche plus haut de 8.1°');
    expect(mesure.dansLaNorme).toBe(false);
  });

  it("nomme le côté droit quand c'est lui qui est plus haut", () => {
    const resultats = calculerMesures({
      vue: 'face',
      points: points({ ...POSE_NEUTRE, acromion_gauche: [0.64, 0.27] }),
      image: IMAGE,
      echelle: ECHELLE,
    });

    const mesure = trouver(resultats, 'angle_epaules_face');
    expect(mesure.valeur).toBeLessThan(0);
    expect(mesure.interpretation).toContain('Côté droit plus haut');
  });

  it('mesure un déport latéral en centimètres', () => {
    // Les épaules se décalent de 0,03 en normalisé, soit 36 px, soit 3 cm.
    const resultats = calculerMesures({
      vue: 'face',
      points: points({
        ...POSE_NEUTRE,
        acromion_gauche: [0.67, 0.24],
        acromion_droit: [0.39, 0.24],
      }),
      image: IMAGE,
      echelle: ECHELLE,
    });

    const mesure = trouver(resultats, 'deport_epaules_face');
    expect(mesure.valeur).toBeCloseTo(3, 1);
    expect(mesure.unite).toBe('cm');
    expect(mesure.interpretation).toBe('Déporté à gauche de 3 cm');
  });

  it('omet les mesures en centimètres tant que le cabinet n’est pas calibré', () => {
    const resultats = calculerMesures({
      vue: 'face',
      points: points(POSE_NEUTRE),
      image: IMAGE,
      echelle: null,
    });

    expect(resultats.find((r) => r.unite === 'cm')).toBeUndefined();
    // Les angles, eux, ne dépendent pas du calibrage et restent calculés.
    expect(trouver(resultats, 'angle_epaules_face')).toBeDefined();
  });

  it('omet une mesure dont un point manque, plutôt que de la renvoyer à zéro', () => {
    const incomplet = { ...POSE_NEUTRE } as Record<string, [number, number]>;
    delete incomplet.eias_droit;

    const resultats = calculerMesures({
      vue: 'face',
      points: points(incomplet),
      image: IMAGE,
      echelle: ECHELLE,
    });

    expect(resultats.find((r) => r.type === 'angle_bassin_face')).toBeUndefined();
    expect(resultats.find((r) => r.type === 'angle_epaules_face')).toBeDefined();
  });
});

describe('calculerMesures — vue de dos', () => {
  // De dos, les côtés sont inversés à l'image : la gauche du patient est à gauche.
  const POSE_DOS = {
    c7: [0.5, 0.2] as [number, number],
    acromion_gauche: [0.36, 0.24] as [number, number],
    acromion_droit: [0.64, 0.24] as [number, number],
    scapula_gauche: [0.4, 0.36] as [number, number],
    scapula_droit: [0.6, 0.36] as [number, number],
    eips_gauche: [0.44, 0.5] as [number, number],
    eips_droit: [0.56, 0.5] as [number, number],
    pli_fessier: [0.5, 0.56] as [number, number],
    malleole_gauche: [0.46, 0.94] as [number, number],
    malleole_droite: [0.54, 0.94] as [number, number],
  };

  it('donne le même signe que de face pour une même bascule anatomique', () => {
    // Épaule gauche du patient plus haute, vue de dos : elle est à gauche de
    // l'image, donc son y est plus petit du côté des x décroissants.
    const resultats = calculerMesures({
      vue: 'dos',
      points: points({ ...POSE_DOS, acromion_droit: [0.64, 0.27] }),
      image: IMAGE,
      echelle: ECHELLE,
    });

    const mesure = trouver(resultats, 'angle_epaules_dos');
    expect(mesure.valeur).toBeGreaterThan(0);
    expect(mesure.interpretation).toContain('Côté gauche plus haut');
  });

  it('oriente la déviation rachidienne avec les côtés inversés du dos', () => {
    // C7 décalée vers les x décroissants : de dos, c'est la gauche du patient.
    const resultats = calculerMesures({
      vue: 'dos',
      points: points({ ...POSE_DOS, c7: [0.47, 0.2] }),
      image: IMAGE,
      echelle: ECHELLE,
    });

    const mesure = trouver(resultats, 'deviation_rachidienne');
    // 0,03 × 1200 = 36 px → 3 cm vers la gauche du patient.
    expect(mesure.valeur).toBeCloseTo(3, 1);
    expect(mesure.interpretation).toBe('Déporté à gauche de 3 cm');
  });
});

describe('calculerMesures — vue de profil', () => {
  /** Patient photographié tourné vers la droite de l'image. */
  const PROFIL_DROITE = {
    tragus: [0.56, 0.12] as [number, number],
    c7: [0.5, 0.18] as [number, number],
    acromion: [0.48, 0.24] as [number, number],
    eias: [0.54, 0.5] as [number, number],
    eips: [0.44, 0.48] as [number, number],
    grand_trochanter: [0.48, 0.52] as [number, number],
    condyle_femoral: [0.48, 0.72] as [number, number],
    malleole_laterale: [0.47, 0.94] as [number, number],
  };

  /** Le même patient, photographié de l'autre côté : tout est en miroir. */
  const PROFIL_GAUCHE = Object.fromEntries(
    Object.entries(PROFIL_DROITE).map(([code, [x, y]]) => [
      code,
      [1 - x, y] as [number, number],
    ])
  );

  it("mesure l'antéposition de la tête", () => {
    const resultats = calculerMesures({
      vue: 'profil',
      points: points(PROFIL_DROITE),
      image: IMAGE,
      echelle: ECHELLE,
    });

    const mesure = trouver(resultats, 'anteposition_tete');
    // Tragus en avant de l'acromion de 0,08 × 1200 = 96 px, soit 8 cm.
    expect(mesure.valeur).toBeCloseTo(8, 1);
    expect(mesure.interpretation).toBe('Tragus en avant de 8 cm');
    expect(mesure.dansLaNorme).toBe(false);
  });

  it('donne le même résultat quel que soit le côté photographié', () => {
    const versLaDroite = calculerMesures({
      vue: 'profil',
      points: points(PROFIL_DROITE),
      image: IMAGE,
      echelle: ECHELLE,
    });
    const versLaGauche = calculerMesures({
      vue: 'profil',
      points: points(PROFIL_GAUCHE),
      image: IMAGE,
      echelle: ECHELLE,
    });

    for (const mesure of versLaDroite) {
      expect(trouver(versLaGauche, mesure.type).valeur).toBeCloseTo(mesure.valeur, 5);
    }
  });

  it("calcule l'angle cranio-vertébral sans avoir besoin du calibrage", () => {
    const resultats = calculerMesures({
      vue: 'profil',
      points: points(PROFIL_DROITE),
      image: IMAGE,
      echelle: null,
    });

    const mesure = trouver(resultats, 'angle_cranio_vertebral');
    // dx = 0,06 × 1200 = 72 px ; dy = 0,06 × 1600 = 96 px → atan(96/72) ≈ 53,1°
    expect(mesure.valeur).toBeCloseTo(53.1, 1);
    expect(mesure.dansLaNorme).toBe(true);
  });

  it('signale une antéposition quand l’angle cranio-vertébral chute', () => {
    const resultats = calculerMesures({
      vue: 'profil',
      points: points({ ...PROFIL_DROITE, tragus: [0.62, 0.14] }),
      image: IMAGE,
      echelle: null,
    });

    const mesure = trouver(resultats, 'angle_cranio_vertebral');
    expect(mesure.valeur).toBeLessThan(48);
    expect(mesure.dansLaNorme).toBe(false);
    expect(mesure.interpretation).toContain('antéposition');
  });

  it('distingue antéversion et rétroversion du bassin', () => {
    const anteversion = calculerMesures({
      vue: 'profil',
      points: points(PROFIL_DROITE),
      image: IMAGE,
      echelle: null,
    });
    expect(trouver(anteversion, 'bascule_bassin_sagittale').interpretation).toContain(
      'Antéversion'
    );

    // EIAS remontée au-dessus de l'EIPS : le bassin bascule en arrière.
    const retroversion = calculerMesures({
      vue: 'profil',
      points: points({ ...PROFIL_DROITE, eias: [0.54, 0.46] }),
      image: IMAGE,
      echelle: null,
    });
    expect(trouver(retroversion, 'bascule_bassin_sagittale').interpretation).toContain(
      'Rétroversion'
    );
  });
});

describe('estDansLaNorme', () => {
  it('juge un écart par sa valeur absolue', () => {
    expect(estDansLaNorme(1.9, { genre: 'ecart', seuil: 2 })).toBe(true);
    expect(estDansLaNorme(-1.9, { genre: 'ecart', seuil: 2 })).toBe(true);
    expect(estDansLaNorme(-2.1, { genre: 'ecart', seuil: 2 })).toBe(false);
  });

  it('juge un minimum par le bas', () => {
    expect(estDansLaNorme(50, { genre: 'minimum', seuil: 48 })).toBe(true);
    expect(estDansLaNorme(47, { genre: 'minimum', seuil: 48 })).toBe(false);
  });

  it('juge un intervalle par ses deux bornes', () => {
    const norme = { genre: 'intervalle', min: 5, max: 20 } as const;
    expect(estDansLaNorme(12, norme)).toBe(true);
    expect(estDansLaNorme(4, norme)).toBe(false);
    expect(estDansLaNorme(21, norme)).toBe(false);
  });
});

describe('libelleNorme', () => {
  it('formule les trois genres de norme', () => {
    expect(libelleNorme({ genre: 'ecart', seuil: 2 }, 'deg')).toBe('± 2°');
    expect(libelleNorme({ genre: 'minimum', seuil: 48 }, 'deg')).toBe('≥ 48°');
    expect(libelleNorme({ genre: 'intervalle', min: 5, max: 20 }, 'cm')).toBe('5 à 20 cm');
  });
});
