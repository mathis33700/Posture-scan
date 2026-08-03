import { cn } from '@/lib/cn';

import { Spinner } from './Chargement';

export type EtatEnregistrement = 'enregistre' | 'en-cours' | 'erreur';

/**
 * État de sauvegarde, affiché en permanence.
 *
 * L'application enregistre au fil de l'eau, sans bouton de validation. Sans
 * retour visible, le praticien cherche ce bouton et doute d'avoir perdu son
 * travail : ce n'est pas le bouton qui manquait, c'est la confirmation. Le
 * libellé reste donc affiché en continu plutôt que de disparaître après
 * quelques secondes — c'est justement au moment où l'on doute qu'on le
 * cherche des yeux.
 */
export function IndicateurEnregistrement({
  etat,
  className,
}: {
  etat: EtatEnregistrement;
  className?: string;
}) {
  if (etat === 'en-cours') {
    return (
      <span className={cn('text-ardoise-500 flex items-center gap-1.5 text-sm', className)}>
        <Spinner className="size-3.5" />
        Enregistrement…
      </span>
    );
  }

  if (etat === 'erreur') {
    return (
      <span
        role="alert"
        className={cn('flex items-center gap-1.5 text-sm font-medium text-red-600', className)}
      >
        <svg viewBox="0 0 20 20" className="size-4" fill="currentColor" aria-hidden>
          <path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 4a1 1 0 0 1 1 1v4a1 1 0 1 1-2 0V7a1 1 0 0 1 1-1Zm0 9.5a1.15 1.15 0 1 1 0-2.3 1.15 1.15 0 0 1 0 2.3Z" />
        </svg>
        Non enregistré — vérifiez le réseau
      </span>
    );
  }

  return (
    <span className={cn('flex items-center gap-1.5 text-sm text-emerald-600', className)}>
      <svg viewBox="0 0 20 20" className="size-4" fill="currentColor" aria-hidden>
        <path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm3.7 6.1-4.2 4.6a1 1 0 0 1-1.45.03L6.3 10.98a1 1 0 1 1 1.4-1.42l1 .99 3.52-3.85a1 1 0 0 1 1.48 1.35Z" />
      </svg>
      Enregistré
    </span>
  );
}
