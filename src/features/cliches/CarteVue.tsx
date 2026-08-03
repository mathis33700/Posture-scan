import { useRef } from 'react';

import { Link } from 'react-router-dom';

import { PhotoAnnotee, type PositionsPoints } from '@/components/PhotoAnnotee';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Chargement';
import type { Cliche, VuePosturale } from '@/types/domaine';

import { LIBELLE_VUE } from './hooks';

export function CarteVue({
  vue,
  cliche,
  url,
  positions,
  bilanId,
  enCours,
  nombrePointsPlaces,
  nombrePointsAttendus,
  onFichier,
  onSupprimer,
}: {
  vue: VuePosturale;
  cliche: Cliche | undefined;
  url: string | undefined;
  positions: PositionsPoints;
  bilanId: string;
  enCours: boolean;
  nombrePointsPlaces: number;
  nombrePointsAttendus: number;
  onFichier: (fichier: File) => void;
  onSupprimer: () => void;
}) {
  const champFichier = useRef<HTMLInputElement>(null);
  const complet = nombrePointsPlaces === nombrePointsAttendus;

  return (
    <section className="overflow-hidden rounded-xl bg-white shadow-sm">
      <header className="flex items-center justify-between gap-3 px-4 py-3">
        <h3 className="font-medium">{LIBELLE_VUE[vue]}</h3>
        {cliche && (
          <span
            className={
              complet
                ? 'rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700'
                : 'bg-ardoise-100 text-ardoise-600 rounded-full px-2 py-0.5 text-xs'
            }
          >
            {nombrePointsPlaces}/{nombrePointsAttendus} points
          </span>
        )}
      </header>

      {/* Le cliché impose son propre rapport d'image ; l'espace réservé garde un
          3:4 arbitraire, faute de photo dont s'inspirer. */}
      {cliche && url && !enCours ? (
        <PhotoAnnotee
          url={url}
          image={{ largeur: cliche.image_largeur, hauteur: cliche.image_hauteur }}
          vue={vue}
          positions={positions}
        />
      ) : (
        <div className="bg-ardoise-100 relative aspect-3/4">
          {enCours && (
            <div className="text-ardoise-500 grid size-full place-items-center gap-3 text-sm">
              <Spinner className="size-6" />
              Envoi en cours…
            </div>
          )}
          {!enCours && cliche && (
            <div className="grid size-full place-items-center">
              <Spinner />
            </div>
          )}
          {!enCours && !cliche && (
            <button
              type="button"
              onClick={() => champFichier.current?.click()}
              className="text-ardoise-500 hover:text-accent-600 grid size-full place-items-center gap-2 text-sm"
            >
              <span className="border-ardoise-400 grid size-12 place-items-center rounded-full border-2 border-dashed text-2xl">
                +
              </span>
              Ajouter la photo
            </button>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 px-4 py-3">
        <input
          ref={champFichier}
          type="file"
          accept="image/*"
          // Ouvre directement l'appareil photo arrière sur iPhone et tablette,
          // tout en laissant le choix d'un fichier existant sur ordinateur.
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const fichier = e.target.files?.[0];
            if (fichier) onFichier(fichier);
            // Réinitialise pour que reprendre deux fois la même photo déclenche
            // bien un second change.
            e.target.value = '';
          }}
        />

        {cliche ? (
          <>
            <Link to={`/bilans/${bilanId}/vues/${vue}`} className="grow">
              <Button taille="sm" className="w-full">
                Placer les points
              </Button>
            </Link>
            <Button
              variante="secondaire"
              taille="sm"
              onClick={() => champFichier.current?.click()}
              disabled={enCours}
            >
              Reprendre
            </Button>
            <Button variante="discret" taille="sm" onClick={onSupprimer} disabled={enCours}>
              Retirer
            </Button>
          </>
        ) : (
          <Button
            taille="sm"
            className="w-full"
            onClick={() => champFichier.current?.click()}
            enCours={enCours}
          >
            Prendre la photo
          </Button>
        )}
      </div>
    </section>
  );
}
