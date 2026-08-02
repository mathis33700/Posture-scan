import { useCliches, useUrlsCliches } from '@/features/cliches/hooks';
import {
  useMesuresCalculees,
  type MesureCalculee,
} from '@/features/mesures/useMesuresCalculees';
import { usePointsParCliche } from '@/features/points/hooks';
import type { Cliche, PointAnatomique, VuePosturale } from '@/types/database';

export type DonneesBilan = {
  cliches: Cliche[];
  clicheParVue: Map<VuePosturale, Cliche>;
  urls: Map<string, string>;
  pointsParCliche: Map<string, PointAnatomique[]>;
  mesures: MesureCalculee[];
  chargement: boolean;
};

/**
 * Rassemble tout ce qu'il faut pour afficher un bilan : clichés, URL signées,
 * points et mesures recalculées.
 *
 * La synchronisation vers la table `mesures` est désactivée : la comparaison et
 * le rapport sont des écrans de lecture, et deux bilans affichés côte à côte ne
 * doivent pas déclencher d'écriture concurrente sur le bilan le plus ancien.
 */
export function useDonneesBilan(bilanId: string, echelle: number | null): DonneesBilan {
  const { data: cliches, isPending: clichesEnAttente } = useCliches(bilanId);
  const { data: urls } = useUrlsCliches(bilanId, cliches);
  const clicheIds = (cliches ?? []).map((cliche) => cliche.id);
  const { data: pointsParCliche, isPending: pointsEnAttente } = usePointsParCliche(clicheIds);

  const mesures = useMesuresCalculees({
    cliches,
    pointsParCliche,
    echelle,
    bilanId,
    synchroniser: false,
  });

  return {
    cliches: cliches ?? [],
    clicheParVue: new Map((cliches ?? []).map((cliche) => [cliche.vue, cliche])),
    urls: urls ?? new Map(),
    pointsParCliche: pointsParCliche ?? new Map(),
    mesures,
    chargement: clichesEnAttente || (clicheIds.length > 0 && pointsEnAttente),
  };
}

/** Positions normalisées d'un cliché, prêtes pour `PhotoAnnotee`. */
export function positionsDuCliche(
  donnees: DonneesBilan,
  cliche: Cliche | undefined
): Map<string, { x: number; y: number }> {
  if (!cliche) return new Map();
  return new Map(
    (donnees.pointsParCliche.get(cliche.id) ?? []).map((point) => [
      point.code_point,
      { x: point.x, y: point.y },
    ])
  );
}
