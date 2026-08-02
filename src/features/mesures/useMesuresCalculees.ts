import { useEffect, useMemo, useRef } from 'react';

import { calculerMesures, type ResultatMesure } from '@/lib/measures';
import type { Cliche, PointAnatomique } from '@/types/database';

import { useRemplacerMesures } from './hooks';

export type MesureCalculee = ResultatMesure & { clicheId: string };

/**
 * Recalcule les mesures d'un bilan à partir des points, et les persiste.
 *
 * Le calcul reste la source de vérité : la table `mesures` n'est qu'un reflet,
 * entretenu pour que l'historique et le rapport n'aient pas à recharger tous
 * les points. La synchronisation passe par un effet, car c'est bien la mise à
 * jour d'un système externe à partir de l'état de React.
 */
export function useMesuresCalculees(params: {
  cliches: Cliche[] | undefined;
  pointsParCliche: Map<string, PointAnatomique[]> | undefined;
  echelle: number | null;
  bilanId: string;
  /** Laisser à `false` sur les écrans en lecture seule (comparaison, rapport). */
  synchroniser: boolean;
}): MesureCalculee[] {
  const { cliches, pointsParCliche, echelle, bilanId, synchroniser } = params;
  const remplacerMesures = useRemplacerMesures(bilanId);

  const mesures = useMemo(() => {
    if (!cliches || !pointsParCliche) return [];

    return cliches.flatMap((cliche) =>
      calculerMesures({
        vue: cliche.vue,
        points: new Map(
          (pointsParCliche.get(cliche.id) ?? []).map((point) => [
            point.code_point,
            { x: point.x, y: point.y },
          ])
        ),
        image: { largeur: cliche.image_largeur, hauteur: cliche.image_hauteur },
        echelle,
      }).map((resultat) => ({ ...resultat, clicheId: cliche.id }))
    );
  }, [cliches, pointsParCliche, echelle]);

  // Signature du jeu calculé : évite de réécrire à chaque rendu, et surtout à
  // chaque retour sur la page alors que rien n'a bougé.
  const signature = mesures.map((m) => `${m.type}:${m.valeur}:${m.unite}`).join('|');
  const derniereEnvoyee = useRef<string | null>(null);
  const pret = Boolean(cliches && pointsParCliche);

  const enregistrer = remplacerMesures.mutate;
  useEffect(() => {
    if (!synchroniser || !pret) return;
    if (derniereEnvoyee.current === signature) return;
    derniereEnvoyee.current = signature;

    enregistrer(
      mesures.map((mesure) => ({
        type: mesure.type,
        valeur: mesure.valeur,
        unite: mesure.unite,
        clicheId: mesure.clicheId,
      }))
    );
    // `signature` résume `mesures` : le dépendre des deux relancerait l'effet
    // à chaque nouvelle référence de tableau, pour un contenu identique.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, synchroniser, pret, enregistrer]);

  return mesures;
}
