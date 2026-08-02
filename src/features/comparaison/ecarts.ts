import { arrondir } from '@/lib/geometry';
import { estDansLaNorme, type ResultatMesure } from '@/lib/measures';

export type Evolution = 'amelioration' | 'degradation' | 'stable';

export type Ecart = {
  mesure: ResultatMesure;
  avant: number;
  apres: number;
  delta: number;
  evolution: Evolution;
};

/**
 * Variation en deçà de laquelle on ne conclut rien.
 *
 * Le pointage est manuel : replacer les mêmes repères sur deux photos donne
 * déjà un écart de l'ordre du degré. Annoncer une amélioration sous ce seuil
 * serait interpréter du bruit.
 */
const SEUIL_SIGNIFICATIF: Record<ResultatMesure['unite'], number> = { deg: 1, cm: 0.5 };

/** Distance d'une valeur à sa plage de référence ; 0 lorsqu'elle est dedans. */
export function distanceALaNorme(mesure: ResultatMesure): number {
  if (estDansLaNorme(mesure.valeur, mesure.norme)) return 0;

  switch (mesure.norme.genre) {
    case 'ecart':
      return Math.abs(mesure.valeur) - mesure.norme.seuil;
    case 'minimum':
      return mesure.norme.seuil - mesure.valeur;
    case 'intervalle':
      return mesure.valeur < mesure.norme.min
        ? mesure.norme.min - mesure.valeur
        : mesure.valeur - mesure.norme.max;
  }
}

/**
 * Rapproche deux jeux de mesures, mesure à mesure.
 *
 * Le sens d'une amélioration dépend de la norme : pour un écart c'est se
 * rapprocher de zéro, pour un minimum comme l'angle cranio-vertébral c'est
 * augmenter, pour un intervalle c'est y revenir. On compare donc les distances
 * à la norme, jamais les valeurs brutes — sans quoi un angle passant de −6° à
 * +5° serait annoncé comme une dégradation alors que la posture s'est redressée.
 *
 * Une mesure absente de l'un des deux bilans est ignorée : il n'y a rien à
 * comparer tant que les mêmes points ne sont pas placés des deux côtés.
 */
export function calculerEcarts(avant: ResultatMesure[], apres: ResultatMesure[]): Ecart[] {
  const parType = new Map(avant.map((mesure) => [mesure.type, mesure]));

  return apres.flatMap((mesureApres) => {
    const mesureAvant = parType.get(mesureApres.type);
    if (!mesureAvant) return [];

    const gain = distanceALaNorme(mesureAvant) - distanceALaNorme(mesureApres);
    const seuil = SEUIL_SIGNIFICATIF[mesureApres.unite];

    return [
      {
        mesure: mesureApres,
        avant: mesureAvant.valeur,
        apres: mesureApres.valeur,
        delta: arrondir(mesureApres.valeur - mesureAvant.valeur),
        evolution:
          Math.abs(gain) < seuil ? 'stable' : gain > 0 ? 'amelioration' : 'degradation',
      },
    ];
  });
}
