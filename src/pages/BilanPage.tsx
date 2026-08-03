import { useState } from 'react';

import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';

import { ResumePatient } from '@/components/ResumePatient';
import { Alerte } from '@/components/ui/Alerte';
import { Button } from '@/components/ui/Button';
import { Champ, Saisie, ZoneTexte } from '@/components/ui/Champ';
import { BlocChargement } from '@/components/ui/Chargement';
import { ConfirmationSuppression } from '@/components/ui/ConfirmationSuppression';
import { IndicateurEnregistrement } from '@/components/ui/IndicateurEnregistrement';
import { useBilan, useMajBilan, useSupprimerBilan } from '@/features/bilans/hooks';
import { CarteVue } from '@/features/cliches/CarteVue';
import {
  useCliches,
  useEnregistrerCliche,
  useSupprimerCliche,
  useUrlsCliches,
  VUES,
} from '@/features/cliches/hooks';
import { TableauMesures } from '@/features/mesures/TableauMesures';
import { useMesuresCalculees } from '@/features/mesures/useMesuresCalculees';
import { usePatient } from '@/features/patients/hooks';
import { usePointsParCliche } from '@/features/points/hooks';
import { usePraticien } from '@/features/praticien/usePraticien';
import { dateDuJourSql } from '@/lib/format';
import { nombrePointsAttendus } from '@/lib/points-catalog';
import type { Bilan, VuePosturale } from '@/types/domaine';

export function BilanPage() {
  const { bilanId } = useParams<{ bilanId: string }>();
  if (!bilanId) return <Navigate to="/patients" replace />;
  return <ChargeurBilan bilanId={bilanId} />;
}

function ChargeurBilan({ bilanId }: { bilanId: string }) {
  const { data: bilan, isPending, error } = useBilan(bilanId);

  if (isPending) return <BlocChargement />;
  if (error) return <Alerte>Ce bilan est introuvable.</Alerte>;

  return <ContenuBilan bilan={bilan} />;
}

function ContenuBilan({ bilan }: { bilan: Bilan }) {
  const navigate = useNavigate();
  const { data: patient } = usePatient(bilan.patient_id);
  const { data: cliches } = useCliches(bilan.id);
  const { data: urls } = useUrlsCliches(bilan.id, cliches);
  const clicheIds = (cliches ?? []).map((cliche) => cliche.id);
  const { data: pointsParCliche } = usePointsParCliche(clicheIds);
  const { data: praticien } = usePraticien();

  const mesures = useMesuresCalculees({
    cliches,
    pointsParCliche,
    echelle: praticien?.echelle_px_par_cm ?? null,
    bilanId: bilan.id,
    synchroniser: true,
  });

  const enregistrerCliche = useEnregistrerCliche({
    bilanId: bilan.id,
    patientId: bilan.patient_id,
  });
  const supprimerCliche = useSupprimerCliche(bilan.id);
  const supprimerBilan = useSupprimerBilan(bilan.patient_id);

  const [vueEnCours, setVueEnCours] = useState<VuePosturale | null>(null);
  const [suppressionOuverte, setSuppressionOuverte] = useState(false);

  const parVue = new Map((cliches ?? []).map((cliche) => [cliche.vue, cliche]));
  const totalPointsPlaces = [...(pointsParCliche?.values() ?? [])].reduce(
    (somme, points) => somme + points.length,
    0
  );
  const totalPointsAttendus = (cliches ?? []).reduce(
    (somme, cliche) => somme + nombrePointsAttendus(cliche.vue),
    0
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link
          to={`/patients/${bilan.patient_id}`}
          className="text-ardoise-500 hover:text-ardoise-700 text-sm"
        >
          ‹ Retour à la fiche patient
        </Link>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Bilan postural</h1>
          {patient && <ResumePatient patient={patient} />}
          {/* Aucun bouton de validation nulle part : autant le dire. */}
          <IndicateurEnregistrement
            className="mt-1"
            etat={
              enregistrerCliche.isPending || supprimerCliche.isPending
                ? 'en-cours'
                : enregistrerCliche.isError || supprimerCliche.isError
                  ? 'erreur'
                  : 'enregistre'
            }
          />
        </div>
        <div className="flex gap-2">
          {cliches && cliches.length > 0 && (
            <Link to={`/bilans/${bilan.id}/rapport`}>
              <Button variante="secondaire" taille="sm">
                Rapport
              </Button>
            </Link>
          )}
          <Button variante="discret" taille="sm" onClick={() => setSuppressionOuverte(true)}>
            Supprimer
          </Button>
        </div>
      </header>

      <EnteteBilan bilan={bilan} />

      {enregistrerCliche.isError && (
        <Alerte>
          L’envoi de la photo a échoué. Vérifiez le réseau du cabinet et réessayez.
        </Alerte>
      )}
      {supprimerCliche.isError && <Alerte>La photo n’a pas pu être retirée.</Alerte>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {VUES.map((vue) => {
          const cliche = parVue.get(vue);
          return (
            <CarteVue
              key={vue}
              vue={vue}
              cliche={cliche}
              url={cliche ? urls?.get(cliche.photo_path) : undefined}
              positions={
                new Map(
                  (cliche ? (pointsParCliche?.get(cliche.id) ?? []) : []).map((point) => [
                    point.code_point,
                    { x: point.x, y: point.y },
                  ])
                )
              }
              bilanId={bilan.id}
              enCours={enregistrerCliche.isPending && vueEnCours === vue}
              nombrePointsPlaces={cliche ? (pointsParCliche?.get(cliche.id)?.length ?? 0) : 0}
              nombrePointsAttendus={nombrePointsAttendus(vue)}
              onFichier={(fichier) => {
                setVueEnCours(vue);
                enregistrerCliche.mutate(
                  { vue, fichier },
                  { onSettled: () => setVueEnCours(null) }
                );
              }}
              onSupprimer={() => {
                if (cliche) supprimerCliche.mutate(cliche);
              }}
            />
          );
        })}
      </div>

      {cliches && cliches.length > 0 && totalPointsPlaces < totalPointsAttendus && (
        <Alerte ton="info">
          {totalPointsPlaces} point{totalPointsPlaces > 1 ? 's' : ''} placé
          {totalPointsPlaces > 1 ? 's' : ''} sur {totalPointsAttendus}. Les mesures qui
          dépendent de points manquants ne sont pas calculées.
        </Alerte>
      )}

      {mesures.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-medium">Mesures</h2>
          <TableauMesures mesures={mesures} />
        </section>
      )}

      {praticien && praticien.echelle_px_par_cm === null && (
        <Alerte ton="info">
          Le calibrage du cabinet n’est pas renseigné : seules les mesures angulaires sont
          calculées. Renseignez-le dans les réglages pour obtenir aussi les déports en
          centimètres.
        </Alerte>
      )}

      <ConfirmationSuppression
        ouverte={suppressionOuverte}
        titre="Supprimer ce bilan"
        description="Les photos, les points et les mesures de ce bilan seront définitivement effacés. Les autres bilans du patient ne sont pas touchés."
        motAttendu="supprimer"
        enCours={supprimerBilan.isPending}
        erreur={supprimerBilan.isError}
        onFermer={() => setSuppressionOuverte(false)}
        onConfirmer={() =>
          supprimerBilan.mutate(bilan.id, {
            onSuccess: () => navigate(`/patients/${bilan.patient_id}`, { replace: true }),
          })
        }
      />
    </div>
  );
}

/** Date et notes du bilan, enregistrées à la sortie du champ. */
function EnteteBilan({ bilan }: { bilan: Bilan }) {
  const majBilan = useMajBilan(bilan.id);
  const [date, setDate] = useState(bilan.date_bilan);
  const [notes, setNotes] = useState(bilan.notes);

  return (
    <div className="grid gap-4 rounded-xl bg-white p-5 shadow-sm sm:grid-cols-[12rem_1fr]">
      <Champ label="Date du bilan">
        {(id) => (
          <Saisie
            id={id}
            type="date"
            max={dateDuJourSql()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            onBlur={() => {
              if (date && date !== bilan.date_bilan) majBilan.mutate({ date_bilan: date });
            }}
          />
        )}
      </Champ>

      <Champ label="Notes de séance">
        {(id) => (
          <ZoneTexte
            id={id}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => {
              if (notes !== bilan.notes) majBilan.mutate({ notes });
            }}
          />
        )}
      </Champ>
    </div>
  );
}
