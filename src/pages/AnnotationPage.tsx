import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';

import { Alerte } from '@/components/ui/Alerte';
import { BlocChargement } from '@/components/ui/Chargement';
import type { EtatEnregistrement } from '@/components/ui/IndicateurEnregistrement';
import { EditeurPoints, type Position } from '@/features/annotation/EditeurPoints';
import { LIBELLE_VUE, useCliches, useUrlsCliches, VUES } from '@/features/cliches/hooks';
import {
  useEnregistrerPoint,
  usePointsParCliche,
  useSupprimerPoint,
} from '@/features/points/hooks';
import { pointsDeLaVue } from '@/lib/points-catalog';
import type { Cliche, VuePosturale } from '@/types/domaine';

function estVue(valeur: string | undefined): valeur is VuePosturale {
  return VUES.includes(valeur as VuePosturale);
}

export function AnnotationPage() {
  const { bilanId, vue } = useParams<{ bilanId: string; vue: string }>();

  if (!bilanId || !estVue(vue)) return <Navigate to="/patients" replace />;
  return <ChargeurAnnotation bilanId={bilanId} vue={vue} />;
}

function ChargeurAnnotation({ bilanId, vue }: { bilanId: string; vue: VuePosturale }) {
  const { data: cliches, isPending, error } = useCliches(bilanId);
  const { data: urls } = useUrlsCliches(bilanId, cliches);
  const cliche = cliches?.find((c) => c.vue === vue);

  if (isPending) return <BlocChargement />;
  if (error) return <Alerte>Ce bilan est introuvable.</Alerte>;
  if (!cliche) {
    return (
      <div className="space-y-4">
        <Alerte ton="info">
          Aucune photo n’a encore été prise pour la vue de {LIBELLE_VUE[vue].toLowerCase()}.
        </Alerte>
        <Link to={`/bilans/${bilanId}`} className="text-accent-600 text-sm">
          ‹ Revenir au bilan
        </Link>
      </div>
    );
  }

  const url = urls?.get(cliche.photo_path);
  if (!url) return <BlocChargement libelle="Chargement de la photo…" />;

  return <ContenuAnnotation bilanId={bilanId} vue={vue} cliche={cliche} url={url} />;
}

function ContenuAnnotation({
  bilanId,
  vue,
  cliche,
  url,
}: {
  bilanId: string;
  vue: VuePosturale;
  cliche: Cliche;
  url: string;
}) {
  const navigate = useNavigate();
  const clicheIds = [cliche.id];
  const { data: pointsParCliche, isPending } = usePointsParCliche(clicheIds);
  const enregistrerPoint = useEnregistrerPoint(clicheIds);
  const supprimerPoint = useSupprimerPoint(clicheIds);

  const etatEnregistrement: EtatEnregistrement =
    enregistrerPoint.isPending || supprimerPoint.isPending
      ? 'en-cours'
      : enregistrerPoint.isError || supprimerPoint.isError
        ? 'erreur'
        : 'enregistre';

  if (isPending) return <BlocChargement />;

  const positionsInitiales = new Map<string, Position>(
    (pointsParCliche?.get(cliche.id) ?? []).map((point) => [
      point.code_point,
      { x: point.x, y: point.y },
    ])
  );

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to={`/bilans/${bilanId}`}
          className="text-ardoise-500 hover:text-ardoise-700 text-sm"
        >
          ‹ Retour au bilan
        </Link>
        <h1 className="font-semibold">Vue de {LIBELLE_VUE[vue].toLowerCase()}</h1>
      </div>

      {(enregistrerPoint.isError || supprimerPoint.isError) && (
        <Alerte>
          Le dernier point n’a pas pu être enregistré. Vérifiez le réseau : les positions
          affichées ne sont plus forcément celles du serveur.
        </Alerte>
      )}

      {/* `key` sur le cliché : reprendre la photo remonte l'éditeur, qui
          réinitialise alors son état local depuis les points du serveur. */}
      <EditeurPoints
        key={cliche.id}
        url={url}
        image={{ largeur: cliche.image_largeur, hauteur: cliche.image_hauteur }}
        vue={vue}
        definitions={pointsDeLaVue(vue)}
        positionsInitiales={positionsInitiales}
        etatEnregistrement={etatEnregistrement}
        onTerminer={() => navigate(`/bilans/${bilanId}`)}
        onEnregistrer={(code, position) =>
          enregistrerPoint.mutate({
            clicheId: cliche.id,
            codePoint: code,
            x: position.x,
            y: position.y,
          })
        }
        onEffacer={(code) => supprimerPoint.mutate({ clicheId: cliche.id, codePoint: code })}
      />
    </div>
  );
}
