import { useState } from 'react';

import { Link, useNavigate } from 'react-router-dom';

import { Alerte, EtatVide } from '@/components/ui/Alerte';
import { Button } from '@/components/ui/Button';
import { Saisie } from '@/components/ui/Champ';
import { BlocChargement } from '@/components/ui/Chargement';
import { Modale } from '@/components/ui/Modale';
import { FormulairePatient } from '@/features/patients/FormulairePatient';
import { useCreerPatient, usePatients } from '@/features/patients/hooks';
import { calculerAge, formaterDateCourte } from '@/lib/format';
import { useDebounce } from '@/lib/useDebounce';

export function PatientsPage() {
  const [recherche, setRecherche] = useState('');
  const [creationOuverte, setCreationOuverte] = useState(false);
  const rechercheRetardee = useDebounce(recherche);
  const { data: patients, isPending, error } = usePatients(rechercheRetardee);
  const creerPatient = useCreerPatient();
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Patients</h1>
        <Button onClick={() => setCreationOuverte(true)}>Nouveau patient</Button>
      </header>

      <Saisie
        type="search"
        placeholder="Rechercher un nom ou un prénom…"
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
        aria-label="Rechercher un patient"
      />

      {isPending && <BlocChargement />}
      {error && <Alerte>Impossible de charger la liste des patients.</Alerte>}

      {patients && patients.length === 0 && (
        <EtatVide
          titre={rechercheRetardee ? 'Aucun résultat' : 'Aucun patient pour le moment'}
          description={
            rechercheRetardee
              ? 'Essayez avec une autre orthographe.'
              : 'Créez une première fiche pour commencer un suivi postural.'
          }
          action={
            !rechercheRetardee && (
              <Button onClick={() => setCreationOuverte(true)}>Nouveau patient</Button>
            )
          }
        />
      )}

      {patients && patients.length > 0 && (
        <ul className="divide-ardoise-200 divide-y overflow-hidden rounded-xl bg-white shadow-sm">
          {patients.map((patient) => {
            const age = calculerAge(patient.date_naissance);
            return (
              <li key={patient.id}>
                <Link
                  to={`/patients/${patient.id}`}
                  className="hover:bg-ardoise-50 flex items-center justify-between gap-4 px-4 py-3.5"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {patient.nom.toUpperCase()} {patient.prenom}
                    </span>
                    <span className="text-ardoise-500 block text-xs">
                      {age !== null ? `${age} ans` : 'Âge inconnu'}
                      {patient.date_naissance &&
                        ` · né(e) le ${formaterDateCourte(patient.date_naissance)}`}
                    </span>
                  </span>
                  <span className="text-ardoise-300" aria-hidden>
                    ›
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Modale
        ouverte={creationOuverte}
        onFermer={() => setCreationOuverte(false)}
        titre="Nouveau patient"
      >
        <FormulairePatient
          enCours={creerPatient.isPending}
          erreur={creerPatient.isError}
          libelleAction="Créer la fiche"
          onAnnuler={() => setCreationOuverte(false)}
          onSoumettre={(valeurs) =>
            creerPatient.mutate(valeurs, {
              onSuccess: (patient) => {
                setCreationOuverte(false);
                navigate(`/patients/${patient.id}`);
              },
            })
          }
        />
      </Modale>
    </div>
  );
}
