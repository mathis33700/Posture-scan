import { useState } from 'react';

import { Alerte } from './Alerte';
import { Button } from './Button';
import { Champ, Saisie } from './Champ';
import { Modale } from './Modale';

/**
 * Suppression définitive : on demande de retaper un mot de confirmation.
 * La conservation des données patients est illimitée par choix, donc une
 * suppression est toujours volontaire et jamais un accident de manipulation.
 */
export function ConfirmationSuppression({
  ouverte,
  titre,
  description,
  motAttendu,
  enCours,
  erreur,
  onFermer,
  onConfirmer,
}: {
  ouverte: boolean;
  titre: string;
  description: string;
  motAttendu: string;
  enCours: boolean;
  erreur: boolean;
  onFermer: () => void;
  onConfirmer: () => void;
}) {
  const [saisie, setSaisie] = useState('');
  const correspond = saisie.trim().toLowerCase() === motAttendu.toLowerCase();

  function fermer() {
    setSaisie('');
    onFermer();
  }

  return (
    <Modale ouverte={ouverte} onFermer={fermer} titre={titre}>
      <div className="space-y-4">
        <p className="text-ardoise-600 text-sm">{description}</p>

        <Champ label={`Tapez « ${motAttendu} » pour confirmer`}>
          {(id) => (
            <Saisie
              id={id}
              value={saisie}
              autoComplete="off"
              onChange={(e) => setSaisie(e.target.value)}
            />
          )}
        </Champ>

        {erreur && <Alerte>La suppression a échoué. Réessayez.</Alerte>}

        <div className="flex justify-end gap-2">
          <Button type="button" variante="secondaire" onClick={fermer}>
            Annuler
          </Button>
          <Button
            type="button"
            variante="danger"
            enCours={enCours}
            disabled={!correspond}
            onClick={onConfirmer}
          >
            Supprimer définitivement
          </Button>
        </div>
      </div>
    </Modale>
  );
}
