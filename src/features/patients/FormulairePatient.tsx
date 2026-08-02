import { useState } from 'react';

import { Alerte } from '@/components/ui/Alerte';
import { Button } from '@/components/ui/Button';
import { Champ, Saisie, ZoneTexte } from '@/components/ui/Champ';
import { dateDuJourSql } from '@/lib/format';

import type { SaisiePatient } from './hooks';

export function FormulairePatient({
  valeursInitiales,
  enCours,
  erreur,
  libelleAction,
  onAnnuler,
  onSoumettre,
}: {
  valeursInitiales?: SaisiePatient;
  enCours: boolean;
  erreur: boolean;
  libelleAction: string;
  onAnnuler: () => void;
  onSoumettre: (valeurs: SaisiePatient) => void;
}) {
  const [nom, setNom] = useState(valeursInitiales?.nom ?? '');
  const [prenom, setPrenom] = useState(valeursInitiales?.prenom ?? '');
  const [dateNaissance, setDateNaissance] = useState(valeursInitiales?.date_naissance ?? '');
  const [notes, setNotes] = useState(valeursInitiales?.notes ?? '');

  const complet = nom.trim() !== '' && prenom.trim() !== '';

  function soumettre(evenement: React.FormEvent) {
    evenement.preventDefault();
    if (!complet) return;

    onSoumettre({
      nom: nom.trim(),
      prenom: prenom.trim(),
      date_naissance: dateNaissance || null,
      notes: notes.trim(),
    });
  }

  return (
    <form onSubmit={soumettre} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Champ label="Nom">
          {(id) => (
            <Saisie
              id={id}
              required
              autoComplete="family-name"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
            />
          )}
        </Champ>

        <Champ label="Prénom">
          {(id) => (
            <Saisie
              id={id}
              required
              autoComplete="given-name"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
            />
          )}
        </Champ>
      </div>

      <Champ label="Date de naissance">
        {(id) => (
          <Saisie
            id={id}
            type="date"
            max={dateDuJourSql()}
            value={dateNaissance}
            onChange={(e) => setDateNaissance(e.target.value)}
          />
        )}
      </Champ>

      <Champ label="Notes" aide="Antécédents, motif de consultation, remarques.">
        {(id) => (
          <ZoneTexte id={id} value={notes} onChange={(e) => setNotes(e.target.value)} />
        )}
      </Champ>

      {erreur && <Alerte>Enregistrement impossible. Réessayez.</Alerte>}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variante="secondaire" onClick={onAnnuler}>
          Annuler
        </Button>
        <Button type="submit" enCours={enCours} disabled={!complet}>
          {libelleAction}
        </Button>
      </div>
    </form>
  );
}
