import type { VuePosturale } from '@/types/database';

/**
 * Catalogue des points anatomiques, défini en code et non en base.
 *
 * Le faire évoluer ne demande donc aucune migration : seules les lignes
 * `points` déjà enregistrées portent un `code_point`, et un code retiré du
 * catalogue est simplement ignoré à l'affichage. La détection automatique
 * prévue en V2 (MediaPipe ou équivalent) produira ses repères sur ces mêmes
 * codes, ce qui permettra de la brancher sans toucher au schéma.
 */
export type DefinitionPoint = {
  code: string;
  libelle: string;
  /** Repère de palpation, affiché pendant le pointage. */
  aide: string;
};

/** Vue de face : le patient regarde l'objectif. */
const POINTS_FACE = [
  {
    code: 'tragus_gauche',
    libelle: 'Tragus gauche',
    aide: 'Petit relief cartilagineux devant le conduit auditif.',
  },
  { code: 'tragus_droit', libelle: 'Tragus droit', aide: 'Symétrique du précédent.' },
  {
    code: 'acromion_gauche',
    libelle: 'Acromion gauche',
    aide: "Sommet externe de l'épaule.",
  },
  { code: 'acromion_droit', libelle: 'Acromion droit', aide: "Sommet externe de l'épaule." },
  {
    code: 'eias_gauche',
    libelle: 'EIAS gauche',
    aide: 'Épine iliaque antéro-supérieure : proéminence avant de la crête iliaque.',
  },
  { code: 'eias_droit', libelle: 'EIAS droite', aide: 'Symétrique du précédent.' },
  {
    code: 'genou_gauche',
    libelle: 'Genou gauche',
    aide: 'Centre de la rotule.',
  },
  { code: 'genou_droit', libelle: 'Genou droit', aide: 'Centre de la rotule.' },
  {
    code: 'malleole_gauche',
    libelle: 'Malléole gauche',
    aide: 'Malléole interne. Sert de base au fil à plomb.',
  },
  {
    code: 'malleole_droite',
    libelle: 'Malléole droite',
    aide: 'Malléole interne. Sert de base au fil à plomb.',
  },
] as const satisfies readonly DefinitionPoint[];

/** Vue de dos. */
const POINTS_DOS = [
  {
    code: 'c7',
    libelle: 'C7',
    aide: 'Vertèbre proéminente, à la base du cou.',
  },
  { code: 'acromion_gauche', libelle: 'Acromion gauche', aide: "Sommet externe de l'épaule." },
  { code: 'acromion_droit', libelle: 'Acromion droit', aide: "Sommet externe de l'épaule." },
  {
    code: 'scapula_gauche',
    libelle: 'Angle inférieur scapula gauche',
    aide: "Pointe basse de l'omoplate.",
  },
  {
    code: 'scapula_droit',
    libelle: 'Angle inférieur scapula droite',
    aide: "Pointe basse de l'omoplate.",
  },
  {
    code: 'eips_gauche',
    libelle: 'EIPS gauche',
    aide: 'Épine iliaque postéro-supérieure : fossette lombaire.',
  },
  { code: 'eips_droit', libelle: 'EIPS droite', aide: 'Symétrique du précédent.' },
  {
    code: 'pli_fessier',
    libelle: 'Sillon interfessier',
    aide: 'Haut du sillon. Extrémité basse de la ligne rachidienne.',
  },
  {
    code: 'malleole_gauche',
    libelle: 'Malléole gauche',
    aide: 'Malléole externe. Sert de base au fil à plomb.',
  },
  {
    code: 'malleole_droite',
    libelle: 'Malléole droite',
    aide: 'Malléole externe. Sert de base au fil à plomb.',
  },
] as const satisfies readonly DefinitionPoint[];

/** Vue de profil : un seul côté est visible, les points ne sont donc pas latéralisés. */
const POINTS_PROFIL = [
  {
    code: 'tragus',
    libelle: 'Tragus',
    aide: 'Devant le conduit auditif. Référence de la position de la tête.',
  },
  { code: 'c7', libelle: 'C7', aide: 'Vertèbre proéminente, à la base du cou.' },
  { code: 'acromion', libelle: 'Acromion', aide: "Sommet externe de l'épaule." },
  {
    code: 'eias',
    libelle: 'EIAS',
    aide: 'Épine iliaque antéro-supérieure.',
  },
  {
    code: 'eips',
    libelle: 'EIPS',
    aide: 'Épine iliaque postéro-supérieure.',
  },
  {
    code: 'grand_trochanter',
    libelle: 'Grand trochanter',
    aide: 'Relief osseux latéral de la hanche.',
  },
  {
    code: 'condyle_femoral',
    libelle: 'Condyle fémoral',
    aide: 'Face latérale du genou, axe de flexion.',
  },
  {
    code: 'malleole_laterale',
    libelle: 'Malléole latérale',
    aide: 'Sert de base au fil à plomb.',
  },
] as const satisfies readonly DefinitionPoint[];

export const CATALOGUE_POINTS: Record<VuePosturale, readonly DefinitionPoint[]> = {
  face: POINTS_FACE,
  dos: POINTS_DOS,
  profil: POINTS_PROFIL,
};

/**
 * Segments tracés entre les points sur une photo annotée.
 *
 * Purement illustratif : ces traits rendent la posture lisible d'un coup d'œil
 * sur le rapport et la comparaison, mais aucune mesure n'en dépend — celles-ci
 * sont calculées directement à partir des points.
 */
export const SEGMENTS_PAR_VUE: Record<VuePosturale, readonly (readonly [string, string])[]> = {
  face: [
    ['tragus_gauche', 'tragus_droit'],
    ['acromion_gauche', 'acromion_droit'],
    ['eias_gauche', 'eias_droit'],
    ['genou_gauche', 'genou_droit'],
    ['malleole_gauche', 'malleole_droite'],
  ],
  dos: [
    ['acromion_gauche', 'acromion_droit'],
    ['scapula_gauche', 'scapula_droit'],
    ['eips_gauche', 'eips_droit'],
    ['c7', 'pli_fessier'],
    ['malleole_gauche', 'malleole_droite'],
  ],
  profil: [
    ['tragus', 'c7'],
    ['c7', 'acromion'],
    ['acromion', 'grand_trochanter'],
    ['eias', 'eips'],
    ['grand_trochanter', 'condyle_femoral'],
    ['condyle_femoral', 'malleole_laterale'],
  ],
};

/**
 * Points servant de base au fil à plomb de chaque vue : la verticale de
 * référence part de leur milieu.
 */
export const BASE_FIL_A_PLOMB: Record<VuePosturale, readonly string[]> = {
  face: ['malleole_gauche', 'malleole_droite'],
  dos: ['malleole_gauche', 'malleole_droite'],
  profil: ['malleole_laterale'],
};

export function pointsDeLaVue(vue: VuePosturale): readonly DefinitionPoint[] {
  return CATALOGUE_POINTS[vue];
}

export function nombrePointsAttendus(vue: VuePosturale): number {
  return CATALOGUE_POINTS[vue].length;
}
