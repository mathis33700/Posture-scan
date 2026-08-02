import { useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { Alerte } from '@/components/ui/Alerte';
import { Button } from '@/components/ui/Button';
import { Champ, Saisie } from '@/components/ui/Champ';
import { messageErreurAuth } from '@/features/auth/messages';
import { supabase } from '@/lib/supabase';

const LONGUEUR_MINIMALE = 8;

/**
 * Sert à la fois au changement volontaire depuis les réglages et à l'arrivée
 * par un lien de réinitialisation : dans les deux cas Supabase a déjà ouvert
 * une session, il ne reste qu'à poser le nouveau mot de passe.
 */
export function MotDePassePage() {
  const navigate = useNavigate();
  const [motDePasse, setMotDePasse] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const tropCourt = motDePasse.length > 0 && motDePasse.length < LONGUEUR_MINIMALE;
  const discordant = confirmation.length > 0 && confirmation !== motDePasse;
  const soumissionPossible =
    motDePasse.length >= LONGUEUR_MINIMALE && confirmation === motDePasse;

  async function soumettre(evenement: React.FormEvent) {
    evenement.preventDefault();
    setErreur(null);
    setEnCours(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: motDePasse });
      if (error) throw error;
      navigate('/reglages', { replace: true });
    } catch (e) {
      setErreur(messageErreurAuth(e as Error));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-xl font-semibold">Nouveau mot de passe</h1>

      <form onSubmit={soumettre} className="mt-6 space-y-4 rounded-xl bg-white p-5 shadow-sm">
        <Champ
          label="Nouveau mot de passe"
          aide={`${LONGUEUR_MINIMALE} caractères minimum.`}
          erreur={tropCourt ? `Au moins ${LONGUEUR_MINIMALE} caractères.` : undefined}
        >
          {(id) => (
            <Saisie
              id={id}
              type="password"
              autoComplete="new-password"
              required
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
            />
          )}
        </Champ>

        <Champ
          label="Confirmation"
          erreur={discordant ? 'Les deux saisies diffèrent.' : undefined}
        >
          {(id) => (
            <Saisie
              id={id}
              type="password"
              autoComplete="new-password"
              required
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
            />
          )}
        </Champ>

        {erreur && <Alerte>{erreur}</Alerte>}

        <Button
          type="submit"
          className="w-full"
          enCours={enCours}
          disabled={!soumissionPossible}
        >
          Enregistrer
        </Button>
      </form>
    </div>
  );
}
