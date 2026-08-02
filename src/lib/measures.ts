import type { VuePosturale } from '@/types/domaine';

import {
  angleAvecHorizontale,
  angleBascule,
  arrondir,
  deviationHorizontale,
  milieu,
  pixelsVersCm,
  sensAvantProfil,
  sensGauchePatient,
  versPixels,
  type DimensionsImage,
  type PointNormalise,
  type PointPixels,
} from './geometry';

export type Unite = 'deg' | 'cm';

/**
 * Critère de normalité d'une mesure.
 *
 * Toutes ne se jugent pas de la même façon : une bascule d'épaules doit rester
 * proche de zéro, un angle cranio-vertébral doit au contraire rester grand, et
 * une bascule de bassin sagittale a une plage physiologique qui n'est centrée
 * ni sur zéro ni sur un extrême.
 */
export type Norme =
  | { genre: 'ecart'; seuil: number }
  | { genre: 'minimum'; seuil: number }
  | { genre: 'intervalle'; min: number; max: number };

export type ResultatMesure = {
  type: string;
  libelle: string;
  vue: VuePosturale;
  valeur: number;
  unite: Unite;
  norme: Norme;
  dansLaNorme: boolean;
  /** Phrase prête à afficher, qui nomme le côté concerné. */
  interpretation: string;
};

type Contexte = {
  /** Point anatomique en pixels, ou `null` s'il n'a pas été placé. */
  point: (code: string) => PointPixels | null;
  /** Calibrage du cabinet, `null` s'il n'a pas été renseigné. */
  echelle: number | null;
};

type Calcul = { valeur: number; interpretation: string } | null;

type DefinitionMesure = {
  type: string;
  libelle: string;
  vue: VuePosturale;
  unite: Unite;
  norme: Norme;
  calculer: (contexte: Contexte) => Calcul;
};

/**
 * Récupère plusieurs points d'un coup, ou `null` dès que l'un manque.
 *
 * Le type de retour est un n-uplet aligné sur les codes demandés, ce qui permet
 * de déstructurer sans assertion malgré `noUncheckedIndexedAccess`.
 */
function tous<const T extends readonly string[]>(
  contexte: Contexte,
  ...codes: T
): { [K in keyof T]: PointPixels } | null {
  const points: PointPixels[] = [];
  for (const code of codes) {
    const point = contexte.point(code);
    if (!point) return null;
    points.push(point);
  }
  return points as { [K in keyof T]: PointPixels };
}

/** Formule décrivant une bascule latérale, en nommant le côté le plus haut. */
function decrireBascule(angle: number, seuil: number): string {
  const amplitude = arrondir(Math.abs(angle));
  if (Math.abs(angle) <= seuil) return `Symétrique (${amplitude}°)`;
  return angle > 0
    ? `Côté gauche plus haut de ${amplitude}°`
    : `Côté droit plus haut de ${amplitude}°`;
}

/** Formule décrivant un décalage latéral, en nommant le sens du déport. */
function decrireDeport(centimetres: number, seuil: number): string {
  const amplitude = arrondir(Math.abs(centimetres));
  if (Math.abs(centimetres) <= seuil) return `Centré (${amplitude} cm)`;
  return centimetres > 0
    ? `Déporté à gauche de ${amplitude} cm`
    : `Déporté à droite de ${amplitude} cm`;
}

/** Bascule bilatérale : le motif commun à la plupart des mesures frontales. */
function mesureBascule(params: {
  type: string;
  libelle: string;
  vue: VuePosturale;
  codeGauche: string;
  codeDroit: string;
  seuil: number;
}): DefinitionMesure {
  return {
    type: params.type,
    libelle: params.libelle,
    vue: params.vue,
    unite: 'deg',
    norme: { genre: 'ecart', seuil: params.seuil },
    calculer: (contexte) => {
      const points = tous(contexte, params.codeGauche, params.codeDroit);
      if (!points) return null;
      const [gauche, droit] = points;

      const valeur = angleBascule(gauche, droit);
      return { valeur, interpretation: decrireBascule(valeur, params.seuil) };
    },
  };
}

const MESURES_FACE: DefinitionMesure[] = [
  mesureBascule({
    type: 'angle_epaules_face',
    libelle: 'Bascule des épaules',
    vue: 'face',
    codeGauche: 'acromion_gauche',
    codeDroit: 'acromion_droit',
    seuil: 2,
  }),
  mesureBascule({
    type: 'angle_bassin_face',
    libelle: 'Bascule du bassin (EIAS)',
    vue: 'face',
    codeGauche: 'eias_gauche',
    codeDroit: 'eias_droit',
    seuil: 2,
  }),
  mesureBascule({
    type: 'inclinaison_tete',
    libelle: 'Inclinaison de la tête',
    vue: 'face',
    codeGauche: 'tragus_gauche',
    codeDroit: 'tragus_droit',
    seuil: 2,
  }),
  mesureBascule({
    type: 'angle_genoux',
    libelle: 'Bascule de la ligne des genoux',
    vue: 'face',
    codeGauche: 'genou_gauche',
    codeDroit: 'genou_droit',
    seuil: 2,
  }),
  {
    type: 'deport_epaules_face',
    libelle: 'Déport latéral des épaules',
    vue: 'face',
    unite: 'cm',
    norme: { genre: 'ecart', seuil: 1.5 },
    calculer: (contexte) => {
      if (!contexte.echelle) return null;
      const points = tous(
        contexte,
        'acromion_gauche',
        'acromion_droit',
        'malleole_gauche',
        'malleole_droite'
      );
      if (!points) return null;
      const [acromionGauche, acromionDroit, malleoleGauche, malleoleDroite] = points;

      const sens = sensGauchePatient(acromionGauche, acromionDroit);
      const ecartPx = deviationHorizontale(
        milieu(acromionGauche, acromionDroit),
        milieu(malleoleGauche, malleoleDroite),
        sens
      );
      const valeur = pixelsVersCm(ecartPx, contexte.echelle);
      return { valeur, interpretation: decrireDeport(valeur, 1.5) };
    },
  },
  {
    type: 'deport_tete_face',
    libelle: 'Déport latéral de la tête',
    vue: 'face',
    unite: 'cm',
    norme: { genre: 'ecart', seuil: 1.5 },
    calculer: (contexte) => {
      if (!contexte.echelle) return null;
      const points = tous(
        contexte,
        'tragus_gauche',
        'tragus_droit',
        'acromion_gauche',
        'acromion_droit',
        'malleole_gauche',
        'malleole_droite'
      );
      if (!points) return null;
      const [
        tragusGauche,
        tragusDroit,
        acromionGauche,
        acromionDroit,
        malleoleGauche,
        malleoleDroite,
      ] = points;

      // L'orientation vient des acromions : les tragus sont trop rapprochés
      // pour donner un sens fiable quand la tête est très inclinée.
      const sens = sensGauchePatient(acromionGauche, acromionDroit);
      const ecartPx = deviationHorizontale(
        milieu(tragusGauche, tragusDroit),
        milieu(malleoleGauche, malleoleDroite),
        sens
      );
      const valeur = pixelsVersCm(ecartPx, contexte.echelle);
      return { valeur, interpretation: decrireDeport(valeur, 1.5) };
    },
  },
];

const MESURES_DOS: DefinitionMesure[] = [
  mesureBascule({
    type: 'angle_epaules_dos',
    libelle: 'Bascule des épaules',
    vue: 'dos',
    codeGauche: 'acromion_gauche',
    codeDroit: 'acromion_droit',
    seuil: 2,
  }),
  mesureBascule({
    type: 'angle_scapulaire',
    libelle: 'Bascule des scapulas',
    vue: 'dos',
    codeGauche: 'scapula_gauche',
    codeDroit: 'scapula_droit',
    seuil: 2,
  }),
  mesureBascule({
    type: 'angle_bassin_dos',
    libelle: 'Bascule du bassin (EIPS)',
    vue: 'dos',
    codeGauche: 'eips_gauche',
    codeDroit: 'eips_droit',
    seuil: 2,
  }),
  {
    type: 'deviation_rachidienne',
    libelle: 'Déviation de C7 sur le sillon',
    vue: 'dos',
    unite: 'cm',
    norme: { genre: 'ecart', seuil: 1 },
    calculer: (contexte) => {
      if (!contexte.echelle) return null;
      const points = tous(contexte, 'c7', 'pli_fessier', 'acromion_gauche', 'acromion_droit');
      if (!points) return null;
      const [c7, pliFessier, acromionGauche, acromionDroit] = points;

      const sens = sensGauchePatient(acromionGauche, acromionDroit);
      const valeur = pixelsVersCm(
        deviationHorizontale(c7, pliFessier, sens),
        contexte.echelle
      );
      return { valeur, interpretation: decrireDeport(valeur, 1) };
    },
  },
];

/** Décrit un décalage sagittal : positif vers l'avant, négatif vers l'arrière. */
function decrireSagittal(centimetres: number, seuil: number, quoi: string): string {
  const amplitude = arrondir(Math.abs(centimetres));
  if (Math.abs(centimetres) <= seuil) return `${quoi} aligné (${amplitude} cm)`;
  return centimetres > 0
    ? `${quoi} en avant de ${amplitude} cm`
    : `${quoi} en arrière de ${amplitude} cm`;
}

const MESURES_PROFIL: DefinitionMesure[] = [
  {
    type: 'anteposition_tete',
    libelle: 'Antéposition de la tête',
    vue: 'profil',
    unite: 'cm',
    norme: { genre: 'ecart', seuil: 2.5 },
    calculer: (contexte) => {
      if (!contexte.echelle) return null;
      const points = tous(contexte, 'tragus', 'c7', 'acromion');
      if (!points) return null;
      const [tragus, c7, acromion] = points;

      const valeur = pixelsVersCm(
        deviationHorizontale(tragus, acromion, sensAvantProfil(tragus, c7)),
        contexte.echelle
      );
      return { valeur, interpretation: decrireSagittal(valeur, 2.5, 'Tragus') };
    },
  },
  {
    type: 'angle_cranio_vertebral',
    libelle: 'Angle cranio-vertébral',
    vue: 'profil',
    unite: 'deg',
    // Sous 48-50°, la littérature parle d'antéposition marquée de la tête :
    // ici, plus l'angle est petit, plus la posture est dégradée.
    norme: { genre: 'minimum', seuil: 48 },
    calculer: (contexte) => {
      const points = tous(contexte, 'tragus', 'c7');
      if (!points) return null;
      const [tragus, c7] = points;

      const valeur = angleAvecHorizontale(c7, tragus);
      const arrondie = arrondir(valeur);
      return {
        valeur,
        interpretation:
          valeur >= 48
            ? `${arrondie}° — dans la norme`
            : `${arrondie}° — antéposition de la tête`,
      };
    },
  },
  {
    type: 'anteposition_epaule',
    libelle: "Antéposition de l'épaule",
    vue: 'profil',
    unite: 'cm',
    norme: { genre: 'ecart', seuil: 2.5 },
    calculer: (contexte) => {
      if (!contexte.echelle) return null;
      const points = tous(contexte, 'tragus', 'c7', 'acromion', 'grand_trochanter');
      if (!points) return null;
      const [tragus, c7, acromion, trochanter] = points;

      const valeur = pixelsVersCm(
        deviationHorizontale(acromion, trochanter, sensAvantProfil(tragus, c7)),
        contexte.echelle
      );
      return { valeur, interpretation: decrireSagittal(valeur, 2.5, 'Acromion') };
    },
  },
  {
    type: 'bascule_bassin_sagittale',
    libelle: 'Bascule sagittale du bassin',
    vue: 'profil',
    unite: 'deg',
    // Une antéversion physiologique se situe autour de 10 à 15°.
    norme: { genre: 'intervalle', min: 5, max: 20 },
    calculer: (contexte) => {
      const points = tous(contexte, 'eias', 'eips');
      if (!points) return null;
      const [eias, eips] = points;

      // L'EIAS sous l'EIPS signe une antéversion : y croît vers le bas.
      const valeur = angleAvecHorizontale(eips, eias) * (eias.y > eips.y ? 1 : -1);
      const arrondie = arrondir(Math.abs(valeur));
      return {
        valeur,
        interpretation:
          valeur >= 0 ? `Antéversion de ${arrondie}°` : `Rétroversion de ${arrondie}°`,
      };
    },
  },
  {
    type: 'alignement_bassin_cheville',
    libelle: 'Alignement trochanter / malléole',
    vue: 'profil',
    unite: 'cm',
    norme: { genre: 'ecart', seuil: 2 },
    calculer: (contexte) => {
      if (!contexte.echelle) return null;
      const points = tous(contexte, 'tragus', 'c7', 'grand_trochanter', 'malleole_laterale');
      if (!points) return null;
      const [tragus, c7, trochanter, malleole] = points;

      const valeur = pixelsVersCm(
        deviationHorizontale(trochanter, malleole, sensAvantProfil(tragus, c7)),
        contexte.echelle
      );
      return { valeur, interpretation: decrireSagittal(valeur, 2, 'Bassin') };
    },
  },
];

export const MESURES_PAR_VUE: Record<VuePosturale, DefinitionMesure[]> = {
  face: MESURES_FACE,
  dos: MESURES_DOS,
  profil: MESURES_PROFIL,
};

export function estDansLaNorme(valeur: number, norme: Norme): boolean {
  switch (norme.genre) {
    case 'ecart':
      return Math.abs(valeur) <= norme.seuil;
    case 'minimum':
      return valeur >= norme.seuil;
    case 'intervalle':
      return valeur >= norme.min && valeur <= norme.max;
  }
}

/** Valeur signée avec son unité, telle qu'elle s'affiche dans les tableaux. */
export function formaterValeur(mesure: Pick<ResultatMesure, 'valeur' | 'unite'>): string {
  // Le signe explicite compte : il porte le côté ou le sens de la déviation.
  const signe = mesure.valeur > 0 ? '+' : '';
  return mesure.unite === 'deg' ? `${signe}${mesure.valeur}°` : `${signe}${mesure.valeur} cm`;
}

/** Libellé de la plage de référence, tel qu'il figure dans le rapport. */
export function libelleNorme(norme: Norme, unite: Unite): string {
  const symbole = unite === 'deg' ? '°' : ' cm';
  switch (norme.genre) {
    case 'ecart':
      return `± ${norme.seuil}${symbole}`;
    case 'minimum':
      return `≥ ${norme.seuil}${symbole}`;
    case 'intervalle':
      return `${norme.min} à ${norme.max}${symbole}`;
  }
}

/**
 * Calcule les mesures d'une vue.
 *
 * Une mesure dont il manque un point n'est pas calculée : elle est simplement
 * absente du résultat, plutôt que renvoyée à zéro. Un angle nul se lirait comme
 * une posture parfaitement symétrique, ce qui serait un contresens clinique.
 * Les mesures en centimètres sont également omises tant que le calibrage du
 * cabinet n'est pas renseigné.
 */
export function calculerMesures(params: {
  vue: VuePosturale;
  points: Map<string, PointNormalise>;
  image: DimensionsImage;
  echelle: number | null;
}): ResultatMesure[] {
  const contexte: Contexte = {
    point: (code) => {
      const normalise = params.points.get(code);
      return normalise ? versPixels(normalise, params.image) : null;
    },
    echelle: params.echelle,
  };

  const resultats: ResultatMesure[] = [];
  for (const definition of MESURES_PAR_VUE[params.vue]) {
    const calcul = definition.calculer(contexte);
    if (!calcul) continue;

    resultats.push({
      type: definition.type,
      libelle: definition.libelle,
      vue: definition.vue,
      valeur: arrondir(calcul.valeur),
      unite: definition.unite,
      norme: definition.norme,
      dansLaNorme: estDansLaNorme(calcul.valeur, definition.norme),
      interpretation: calcul.interpretation,
    });
  }
  return resultats;
}
