import { describe, expect, it } from 'vitest';

import type { ResultatMesure } from '@/lib/measures';

import { calculerEcarts, distanceALaNorme } from './ecarts';

function mesure(partielle: Partial<ResultatMesure> & { valeur: number }): ResultatMesure {
  return {
    type: 'angle_epaules_face',
    libelle: 'Bascule des épaules',
    vue: 'face',
    unite: 'deg',
    norme: { genre: 'ecart', seuil: 2 },
    dansLaNorme: true,
    interpretation: '',
    ...partielle,
  };
}

describe('distanceALaNorme', () => {
  it('vaut 0 pour une valeur dans la norme', () => {
    expect(distanceALaNorme(mesure({ valeur: 1.5 }))).toBe(0);
  });

  it("mesure le dépassement d'un écart, quel que soit son signe", () => {
    expect(distanceALaNorme(mesure({ valeur: 6 }))).toBe(4);
    expect(distanceALaNorme(mesure({ valeur: -6 }))).toBe(4);
  });

  it('mesure le manque sous un minimum', () => {
    const cva = mesure({ valeur: 40, norme: { genre: 'minimum', seuil: 48 } });
    expect(distanceALaNorme(cva)).toBe(8);
  });

  it("mesure l'écart à la borne franchie d'un intervalle", () => {
    const norme = { genre: 'intervalle', min: 5, max: 20 } as const;
    expect(distanceALaNorme(mesure({ valeur: 2, norme }))).toBe(3);
    expect(distanceALaNorme(mesure({ valeur: 26, norme }))).toBe(6);
  });
});

describe('calculerEcarts', () => {
  it('annonce une amélioration quand la bascule se rapproche de zéro', () => {
    const ecarts = calculerEcarts([mesure({ valeur: 8 })], [mesure({ valeur: 3 })]);

    expect(ecarts).toHaveLength(1);
    expect(ecarts[0]?.evolution).toBe('amelioration');
    expect(ecarts[0]?.delta).toBe(-5);
  });

  it('annonce une dégradation quand elle s’en éloigne', () => {
    const ecarts = calculerEcarts([mesure({ valeur: 3 })], [mesure({ valeur: 9 })]);
    expect(ecarts[0]?.evolution).toBe('degradation');
  });

  it('ne conclut rien sous le seuil de reproductibilité du pointage', () => {
    const ecarts = calculerEcarts([mesure({ valeur: 6 })], [mesure({ valeur: 5.4 })]);
    expect(ecarts[0]?.evolution).toBe('stable');
  });

  it('voit une amélioration dans un changement de côté qui réduit la bascule', () => {
    // −6° puis +5° : la valeur brute augmente de 11, mais la posture se redresse.
    // Comparer les valeurs plutôt que les distances à la norme conclurait à tort
    // à une dégradation.
    const ecarts = calculerEcarts([mesure({ valeur: -6 })], [mesure({ valeur: 5 })]);

    expect(ecarts[0]?.delta).toBe(11);
    expect(ecarts[0]?.evolution).toBe('amelioration');
  });

  it("traite un minimum dans le bon sens : l'angle cranio-vertébral doit croître", () => {
    const norme = { genre: 'minimum', seuil: 48 } as const;
    const ameliore = calculerEcarts(
      [mesure({ type: 'angle_cranio_vertebral', valeur: 40, norme })],
      [mesure({ type: 'angle_cranio_vertebral', valeur: 46, norme })]
    );
    expect(ameliore[0]?.evolution).toBe('amelioration');

    const degrade = calculerEcarts(
      [mesure({ type: 'angle_cranio_vertebral', valeur: 46, norme })],
      [mesure({ type: 'angle_cranio_vertebral', valeur: 38, norme })]
    );
    expect(degrade[0]?.evolution).toBe('degradation');
  });

  it('reste stable entre deux valeurs toutes deux dans la norme', () => {
    // Les deux sont à distance nulle : rien à conclure, même si l'écart brut
    // dépasse le seuil.
    const ecarts = calculerEcarts([mesure({ valeur: -1.8 })], [mesure({ valeur: 1.9 })]);
    expect(ecarts[0]?.evolution).toBe('stable');
  });

  it('ignore une mesure absente du bilan de référence', () => {
    const ecarts = calculerEcarts(
      [mesure({ type: 'angle_epaules_face', valeur: 4 })],
      [
        mesure({ type: 'angle_epaules_face', valeur: 2 }),
        mesure({ type: 'angle_bassin_face', valeur: 3 }),
      ]
    );

    expect(ecarts).toHaveLength(1);
    expect(ecarts[0]?.mesure.type).toBe('angle_epaules_face');
  });
});
