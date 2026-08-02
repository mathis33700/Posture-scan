import { useState } from 'react';

import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';

import { Alerte, EtatVide } from '@/components/ui/Alerte';
import { Button } from '@/components/ui/Button';
import { BlocChargement } from '@/components/ui/Chargement';
import { ConfirmationSuppression } from '@/components/ui/ConfirmationSuppression';
import { Modale } from '@/components/ui/Modale';
import { useBilans, useCreerBilan } from '@/features/bilans/hooks';
import { FormulairePatient } from '@/features/patients/FormulairePatient';
import { useMajPatient, usePatient, useSupprimerPatient } from '@/features/patients/hooks';
import { calculerAge, dateDuJourSql, formaterDate } from '@/lib/format';

export function PatientPage() {
  const { patientId } = useParams<{ patientId: string }>();
  if (!patientId) return <Navigate to="/patients" replace />;
  return <ContenuPatient patientId={patientId} />;
}

function ContenuPatient({ patientId }: { patientId: string }) {
  const navigate = useNavigate();
  const { data: patient, isPending, error } = usePatient(patientId);
  const { data: bilans } = useBilans(patientId);
  const majPatient = useMajPatient(patientId);
  const supprimerPatient = useSupprimerPatient();
  const creerBilan = useCreerBilan(patientId);

  const [editionOuverte, setEditionOuverte] = useState(false);
  const [suppressionOuverte, setSuppressionOuverte] = useState(false);

  if (isPending) return <BlocChargement />;
  if (error) return <Alerte>Ce patient est introuvable.</Alerte>;

  const age = calculerAge(patient.date_naissance);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link to="/patients" className="text-ardoise-500 hover:text-ardoise-700 text-sm">
          ‹ Tous les patients
        </Link>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">
            {patient.nom.toUpperCase()} {patient.prenom}
          </h1>
          <p className="text-ardoise-500 mt-1 text-sm">
            {age !== null ? `${age} ans` : 'Âge inconnu'}
            {patient.date_naissance && ` · né(e) le ${formaterDate(patient.date_naissance)}`}
          </p>
        </div>

        <div className="flex gap-2">
          <Button variante="secondaire" taille="sm" onClick={() => setEditionOuverte(true)}>
            Modifier
          </Button>
          <Button variante="discret" taille="sm" onClick={() => setSuppressionOuverte(true)}>
            Supprimer
          </Button>
        </div>
      </header>

      {patient.notes && (
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-ardoise-500 text-xs font-medium tracking-wide uppercase">
            Notes
          </h2>
          <p className="mt-2 text-sm whitespace-pre-wrap">{patient.notes}</p>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-medium">Bilans posturaux</h2>
          <div className="flex gap-2">
            {bilans && bilans.length >= 2 && (
              <Link to={`/patients/${patientId}/comparaison`}>
                <Button variante="secondaire" taille="sm">
                  Comparer
                </Button>
              </Link>
            )}
            <Button
              taille="sm"
              enCours={creerBilan.isPending}
              onClick={() =>
                creerBilan.mutate(
                  { date_bilan: dateDuJourSql(), notes: '' },
                  { onSuccess: (bilan) => navigate(`/bilans/${bilan.id}`) }
                )
              }
            >
              Nouveau bilan
            </Button>
          </div>
        </div>

        {creerBilan.isError && <Alerte>Impossible de créer le bilan.</Alerte>}

        {bilans && bilans.length === 0 && (
          <EtatVide
            titre="Aucun bilan"
            description="Créez un bilan pour photographier les vues de face, de dos et de profil."
          />
        )}

        {bilans && bilans.length > 0 && (
          <ul className="divide-ardoise-200 divide-y overflow-hidden rounded-xl bg-white shadow-sm">
            {bilans.map((bilan) => (
              <li key={bilan.id}>
                <Link
                  to={`/bilans/${bilan.id}`}
                  className="hover:bg-ardoise-50 flex items-center justify-between gap-4 px-4 py-3.5"
                >
                  <span className="min-w-0">
                    <span className="block font-medium">{formaterDate(bilan.date_bilan)}</span>
                    {bilan.notes && (
                      <span className="text-ardoise-500 block truncate text-xs">
                        {bilan.notes}
                      </span>
                    )}
                  </span>
                  <span className="text-ardoise-300" aria-hidden>
                    ›
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Modale
        ouverte={editionOuverte}
        onFermer={() => setEditionOuverte(false)}
        titre="Modifier la fiche"
      >
        <FormulairePatient
          valeursInitiales={{
            nom: patient.nom,
            prenom: patient.prenom,
            date_naissance: patient.date_naissance,
            notes: patient.notes,
          }}
          enCours={majPatient.isPending}
          erreur={majPatient.isError}
          libelleAction="Enregistrer"
          onAnnuler={() => setEditionOuverte(false)}
          onSoumettre={(valeurs) =>
            majPatient.mutate(valeurs, { onSuccess: () => setEditionOuverte(false) })
          }
        />
      </Modale>

      <ConfirmationSuppression
        ouverte={suppressionOuverte}
        titre="Supprimer ce patient"
        description={`Tous les bilans, photos, points et mesures de ${patient.prenom} ${patient.nom.toUpperCase()} seront définitivement effacés. Cette action est irréversible.`}
        motAttendu="supprimer"
        enCours={supprimerPatient.isPending}
        erreur={supprimerPatient.isError}
        onFermer={() => setSuppressionOuverte(false)}
        onConfirmer={() =>
          supprimerPatient.mutate(patientId, {
            onSuccess: () => navigate('/patients', { replace: true }),
          })
        }
      />
    </div>
  );
}
