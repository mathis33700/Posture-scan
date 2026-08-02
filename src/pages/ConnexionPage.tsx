import { useState } from 'react';

import { Navigate, useLocation } from 'react-router-dom';

import { Alerte } from '@/components/ui/Alerte';
import { Button } from '@/components/ui/Button';
import { Champ, Saisie } from '@/components/ui/Champ';
import { PleinEcranChargement } from '@/components/ui/Chargement';
import { messageErreurAuth } from '@/features/auth/messages';
import { useAuth } from '@/features/auth/useAuth';
import { supabase } from '@/lib/supabase';

type Mode = 'connexion' | 'oubli';

export function ConnexionPage() {
  const { session, chargement } = useAuth();
  const location = useLocation();
  const [mode, setMode] = useState<Mode>('connexion');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  if (chargement) return <PleinEcranChargement />;

  if (session) {
    const depuis = (location.state as { depuis?: string } | null)?.depuis;
    return <Navigate to={depuis ?? '/patients'} replace />;
  }

  async function soumettre(evenement: React.FormEvent) {
    evenement.preventDefault();
    setErreur(null);
    setInfo(null);
    setEnCours(true);

    try {
      if (mode === 'connexion') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: motDePasse,
        });
        if (error) throw error;
        // La redirection est prise en charge par le `Navigate` ci-dessus, une
        // fois que onAuthStateChange a propagé la nouvelle session.
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/mot-de-passe`,
        });
        if (error) throw error;
        setInfo(
          'Si un compte existe pour cette adresse, un lien de réinitialisation vient d’être envoyé.'
        );
      }
    } catch (e) {
      setErreur(messageErreurAuth(e as Error));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <img src="/favicon.svg" alt="" className="mx-auto size-14" />
          <h1 className="mt-4 text-xl font-semibold">Posture Scan</h1>
          <p className="text-ardoise-500 mt-1 text-sm">Relevés posturaux et suivi patient</p>
        </div>

        <form onSubmit={soumettre} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
          <Champ label="Adresse e-mail">
            {(id) => (
              <Saisie
                id={id}
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            )}
          </Champ>

          {mode === 'connexion' && (
            <Champ label="Mot de passe">
              {(id) => (
                <Saisie
                  id={id}
                  type="password"
                  autoComplete="current-password"
                  required
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                />
              )}
            </Champ>
          )}

          {erreur && <Alerte>{erreur}</Alerte>}
          {info && <Alerte ton="succes">{info}</Alerte>}

          <Button type="submit" className="w-full" enCours={enCours}>
            {mode === 'connexion' ? 'Se connecter' : 'Envoyer le lien'}
          </Button>

          <button
            type="button"
            className="text-ardoise-500 hover:text-ardoise-700 w-full text-center text-sm"
            onClick={() => {
              setMode(mode === 'connexion' ? 'oubli' : 'connexion');
              setErreur(null);
              setInfo(null);
            }}
          >
            {mode === 'connexion' ? 'Mot de passe oublié ?' : 'Revenir à la connexion'}
          </button>
        </form>

        <p className="text-ardoise-400 mt-6 text-center text-xs">
          Les comptes praticiens sont créés depuis la console Supabase du cabinet :
          l’application n’expose volontairement pas d’inscription publique.
        </p>
      </div>
    </div>
  );
}
