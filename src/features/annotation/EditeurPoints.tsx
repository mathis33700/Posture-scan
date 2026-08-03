import { useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import {
  IndicateurEnregistrement,
  type EtatEnregistrement,
} from '@/components/ui/IndicateurEnregistrement';
import {
  construireAnnotations,
  COULEUR_PLOMB,
  COULEUR_SEGMENT,
} from '@/lib/annotation-render';
import { cn } from '@/lib/cn';
import type { DefinitionPoint } from '@/lib/points-catalog';
import type { VuePosturale } from '@/types/domaine';

import { calculerFit } from './fit';
import { Loupe } from './Loupe';
import { useTailleElement } from './useTailleElement';
import { usePanZoom, ZOOM_MAX, ZOOM_MIN } from './usePanZoom';

export type Position = { x: number; y: number };

/** Déplacement au-delà duquel un appui devient un glissement et non un tap. */
const SEUIL_TAP_PX = 8;

type Annulation = { code: string; precedent: Position | null };

export function EditeurPoints({
  url,
  image,
  vue,
  definitions,
  positionsInitiales,
  etatEnregistrement,
  onEnregistrer,
  onEffacer,
  onTerminer,
}: {
  url: string;
  image: { largeur: number; hauteur: number };
  vue: VuePosturale;
  definitions: readonly DefinitionPoint[];
  positionsInitiales: Map<string, Position>;
  etatEnregistrement: EtatEnregistrement;
  onEnregistrer: (code: string, position: Position) => void;
  onEffacer: (code: string) => void;
  onTerminer: () => void;
}) {
  const conteneur = useRef<HTMLDivElement>(null);
  const cadre = useRef<HTMLDivElement>(null);
  const pointeurs = useRef(new Map<number, { x: number; y: number }>());
  const glissement = useRef<{ code: string; origine: Position | null } | null>(null);
  const appui = useRef<{ x: number; y: number; deplace: boolean } | null>(null);

  // Seedé au montage : le composant n'est monté qu'une fois la photo et les
  // points chargés, et il est remonté (via `key`) si l'on change de cliché.
  const [positions, setPositions] = useState(() => new Map(positionsInitiales));
  const [codeActif, setCodeActif] = useState<string | null>(
    () => definitions.find((d) => !positionsInitiales.has(d.code))?.code ?? null
  );
  const [pileAnnulation, setPileAnnulation] = useState<Annulation[]>([]);
  const [loupe, setLoupe] = useState<Position | null>(null);
  const [afficherLignes, setAfficherLignes] = useState(true);

  const taille = useTailleElement(conteneur);
  const fit = calculerFit(taille, image);
  const { transformation, deplacer, zoomer, pincer, finPincement, reinitialiser } =
    usePanZoom();

  const placés = definitions.filter((d) => positions.has(d.code)).length;
  const complet = placés === definitions.length;

  // Tracés calculés sur l'état local, donc redessinés pendant le glissement :
  // la bascule d'épaules se voit s'incliner en direct, sans attendre le rapport.
  // Même calcul que l'aperçu et le PDF, pour que les trois montrent la même chose.
  const annotations = construireAnnotations({ vue, positions, image });

  // Les traits sont exprimés dans le repère pixel du cliché, lui-même agrandi
  // par le zoom : on divise par l'échelle pour qu'ils gardent la même finesse
  // à l'écran, comme les repères.
  const epaisseurTrait = annotations.epaisseur / transformation.echelle;

  function versNormalise(clientX: number, clientY: number): Position {
    // Le rectangle du cadre intègre déjà la transformation courante : inutile
    // de défaire le zoom et le déplacement à la main.
    const rect = cadre.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return { x: 0, y: 0 };

    return {
      x: Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (clientY - rect.top) / rect.height)),
    };
  }

  function appliquer(code: string, position: Position) {
    setPileAnnulation((pile) => [...pile, { code, precedent: positions.get(code) ?? null }]);
    setPositions((precedentes) => new Map(precedentes).set(code, position));
    onEnregistrer(code, position);
  }

  function effacer(code: string) {
    const precedent = positions.get(code);
    if (!precedent) return;

    setPileAnnulation((pile) => [...pile, { code, precedent }]);
    setPositions((precedentes) => {
      const suivantes = new Map(precedentes);
      suivantes.delete(code);
      return suivantes;
    });
    setCodeActif(code);
    onEffacer(code);
  }

  function annuler() {
    const derniere = pileAnnulation.at(-1);
    if (!derniere) return;

    setPileAnnulation((pile) => pile.slice(0, -1));
    setPositions((precedentes) => {
      const suivantes = new Map(precedentes);
      if (derniere.precedent) suivantes.set(derniere.code, derniere.precedent);
      else suivantes.delete(derniere.code);
      return suivantes;
    });

    if (derniere.precedent) onEnregistrer(derniere.code, derniere.precedent);
    else onEffacer(derniere.code);
  }

  /** Après une pose, on enchaîne sur le premier point encore libre. */
  function avancer(codePose: string) {
    const suivant = definitions.find((d) => d.code !== codePose && !positions.has(d.code));
    setCodeActif(suivant?.code ?? null);
  }

  function surPointerDown(evenement: React.PointerEvent) {
    conteneur.current?.setPointerCapture(evenement.pointerId);
    pointeurs.current.set(evenement.pointerId, {
      x: evenement.clientX,
      y: evenement.clientY,
    });

    if (pointeurs.current.size === 2) {
      // Un pincement démarre : ce n'est plus ni un tap ni un glissement de point.
      appui.current = null;
      glissement.current = null;
      setLoupe(null);
      finPincement();
      return;
    }

    if (glissement.current) {
      setLoupe(versNormalise(evenement.clientX, evenement.clientY));
      return;
    }

    appui.current = { x: evenement.clientX, y: evenement.clientY, deplace: false };
  }

  function surPointerMove(evenement: React.PointerEvent) {
    const precedent = pointeurs.current.get(evenement.pointerId);
    if (!precedent) return;
    pointeurs.current.set(evenement.pointerId, {
      x: evenement.clientX,
      y: evenement.clientY,
    });

    if (pointeurs.current.size >= 2) {
      const [a, b] = [...pointeurs.current.values()];
      if (!a || !b) return;

      const rectConteneur = conteneur.current?.getBoundingClientRect();
      if (!rectConteneur) return;

      pincer(
        Math.hypot(a.x - b.x, a.y - b.y),
        (a.x + b.x) / 2 - rectConteneur.left - fit.left,
        (a.y + b.y) / 2 - rectConteneur.top - fit.top
      );
      return;
    }

    const enCours = glissement.current;
    if (enCours) {
      const position = versNormalise(evenement.clientX, evenement.clientY);
      setPositions((precedentes) => new Map(precedentes).set(enCours.code, position));
      setLoupe(position);
      return;
    }

    if (appui.current) {
      const distance = Math.hypot(
        evenement.clientX - appui.current.x,
        evenement.clientY - appui.current.y
      );
      if (distance > SEUIL_TAP_PX) appui.current.deplace = true;
    }

    // Le déplacement n'a de sens qu'agrandi : à l'échelle 1 l'image tient
    // entièrement dans le cadre et la faire glisser ne ferait que la perdre.
    if (transformation.echelle > 1) {
      deplacer(evenement.clientX - precedent.x, evenement.clientY - precedent.y);
    }
  }

  function surPointerUp(evenement: React.PointerEvent) {
    pointeurs.current.delete(evenement.pointerId);
    if (pointeurs.current.size < 2) finPincement();

    const enCours = glissement.current;
    if (enCours) {
      glissement.current = null;
      setLoupe(null);

      const position = positions.get(enCours.code);
      if (!position) return;

      // L'entrée d'annulation n'est empilée qu'ici : un simple appui sur un
      // repère, pour le sélectionner, ne doit pas laisser de trace annulable.
      const inchange =
        enCours.origine !== null &&
        enCours.origine.x === position.x &&
        enCours.origine.y === position.y;
      if (inchange) return;

      setPileAnnulation((pile) => [
        ...pile,
        { code: enCours.code, precedent: enCours.origine },
      ]);
      onEnregistrer(enCours.code, position);
      return;
    }

    const debut = appui.current;
    appui.current = null;
    if (!debut || debut.deplace || !codeActif) return;

    // Appui bref sur la photo : on pose le point courant.
    const position = versNormalise(evenement.clientX, evenement.clientY);
    appliquer(codeActif, position);
    avancer(codeActif);
  }

  function commencerGlissement(code: string, evenement: React.PointerEvent) {
    glissement.current = { code, origine: positions.get(code) ?? null };
    setCodeActif(code);
    setLoupe(versNormalise(evenement.clientX, evenement.clientY));
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
      <div className="space-y-3">
        <div
          ref={conteneur}
          onPointerDown={surPointerDown}
          onPointerMove={surPointerMove}
          onPointerUp={surPointerUp}
          onPointerCancel={surPointerUp}
          // Sans cela, iOS intercepte le geste pour faire défiler la page.
          style={{ touchAction: 'none' }}
          className="bg-ardoise-900 relative h-[60dvh] touch-none overflow-hidden rounded-xl select-none lg:h-[72dvh]"
        >
          <div
            ref={cadre}
            className="absolute origin-top-left"
            style={{
              left: fit.left,
              top: fit.top,
              width: fit.width,
              height: fit.height,
              transform: `translate(${transformation.tx}px, ${transformation.ty}px) scale(${transformation.echelle})`,
            }}
          >
            <img
              src={url}
              alt="Photo posturale"
              draggable={false}
              className="pointer-events-none size-full"
            />

            {afficherLignes && (
              <svg
                viewBox={`0 0 ${image.largeur} ${image.hauteur}`}
                className="pointer-events-none absolute inset-0 size-full"
                aria-hidden
              >
                {annotations.abscisseFilAPlomb !== null && (
                  <line
                    x1={annotations.abscisseFilAPlomb}
                    y1={0}
                    x2={annotations.abscisseFilAPlomb}
                    y2={image.hauteur}
                    stroke={COULEUR_PLOMB}
                    strokeWidth={epaisseurTrait}
                    strokeDasharray={`${epaisseurTrait * 6} ${epaisseurTrait * 4}`}
                    opacity={0.75}
                  />
                )}

                {annotations.segments.map((segment) => (
                  <line
                    key={segment.cle}
                    x1={segment.a.x}
                    y1={segment.a.y}
                    x2={segment.b.x}
                    y2={segment.b.y}
                    stroke={COULEUR_SEGMENT}
                    strokeWidth={epaisseurTrait * 1.4}
                    strokeLinecap="round"
                    opacity={0.75}
                  />
                ))}
              </svg>
            )}

            {definitions.map((definition) => {
              const position = positions.get(definition.code);
              if (!position) return null;

              const actif = definition.code === codeActif;
              return (
                <button
                  key={definition.code}
                  type="button"
                  aria-label={definition.libelle}
                  onPointerDown={(e) => commencerGlissement(definition.code, e)}
                  className="absolute grid size-11 place-items-center"
                  style={{
                    left: `${position.x * 100}%`,
                    top: `${position.y * 100}%`,
                    // L'échelle inverse garde le repère à taille constante à
                    // l'écran : au zoom 6, un marqueur agrandi masquerait le
                    // détail anatomique qu'on cherche justement à viser.
                    transform: `translate(-50%, -50%) scale(${1 / transformation.echelle})`,
                  }}
                >
                  <span
                    className={cn(
                      'absolute size-4 rounded-full border-2 border-white shadow',
                      actif ? 'bg-red-500' : 'bg-accent-500'
                    )}
                  />
                  {actif && (
                    <span className="absolute size-8 rounded-full border border-red-400/80" />
                  )}
                </button>
              );
            })}
          </div>

          {loupe && fit.width > 0 && (
            <Loupe url={url} x={loupe.x} y={loupe.y} fit={fit} aDroite={loupe.x < 0.5} />
          )}

          <div className="absolute right-3 bottom-3 flex gap-1.5">
            <BoutonZoom
              libelle={afficherLignes ? 'Masquer les lignes' : 'Afficher les lignes'}
              onClick={() => setAfficherLignes((visible) => !visible)}
              desactive={false}
              actif={afficherLignes}
            >
              {/* Les lignes aident à lire la posture, mais peuvent masquer le
                  repère anatomique que l'on cherche à viser : on peut les ôter. */}
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor">
                <path
                  d="M4 8h16M4 16h16"
                  strokeWidth="2"
                  strokeLinecap="round"
                  transform="rotate(-8 12 12)"
                />
              </svg>
            </BoutonZoom>
            <BoutonZoom
              libelle="Dézoomer"
              onClick={() =>
                zoomer(1 / 1.4, taille.largeur / 2 - fit.left, taille.hauteur / 2 - fit.top)
              }
              desactive={transformation.echelle <= ZOOM_MIN}
            >
              −
            </BoutonZoom>
            <BoutonZoom
              libelle="Zoomer"
              onClick={() =>
                zoomer(1.4, taille.largeur / 2 - fit.left, taille.hauteur / 2 - fit.top)
              }
              desactive={transformation.echelle >= ZOOM_MAX}
            >
              +
            </BoutonZoom>
            <BoutonZoom
              libelle="Réinitialiser la vue"
              onClick={reinitialiser}
              desactive={transformation.echelle === ZOOM_MIN}
            >
              ⤢
            </BoutonZoom>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span
            className={cn(
              'text-sm font-medium',
              complet ? 'text-emerald-600' : 'text-ardoise-500'
            )}
          >
            {placés}/{definitions.length} points placés
          </span>

          <IndicateurEnregistrement etat={etatEnregistrement} />

          <span className="grow" />

          <Button
            variante="secondaire"
            taille="sm"
            onClick={annuler}
            disabled={pileAnnulation.length === 0}
          >
            Annuler
          </Button>
          {codeActif && positions.has(codeActif) && (
            <Button variante="discret" taille="sm" onClick={() => effacer(codeActif)}>
              Effacer ce point
            </Button>
          )}

          {/* Rien n'est à valider — tout est déjà enregistré. Ce bouton ne sert
              qu'à clore le geste et à ramener au bilan : sans lui, on cherche
              instinctivement un « Valider » qui n'existe pas. */}
          <Button taille="sm" onClick={onTerminer}>
            Terminer
          </Button>
        </div>
      </div>

      <ListePoints
        definitions={definitions}
        positions={positions}
        codeActif={codeActif}
        onSelectionner={setCodeActif}
      />
    </div>
  );
}

function BoutonZoom({
  libelle,
  onClick,
  desactive,
  actif = false,
  children,
}: {
  actif?: boolean;
  libelle: string;
  onClick: () => void;
  desactive: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={libelle}
      aria-pressed={actif}
      onClick={onClick}
      disabled={desactive}
      // Le conteneur capte les pointeurs : sans cela, appuyer sur le bouton
      // poserait aussi un point derrière lui.
      onPointerDown={(e) => e.stopPropagation()}
      className={cn(
        'grid size-9 place-items-center rounded-lg text-lg shadow disabled:opacity-40',
        actif ? 'bg-accent-600 text-white' : 'text-ardoise-800 bg-white/90'
      )}
    >
      {children}
    </button>
  );
}

function ListePoints({
  definitions,
  positions,
  codeActif,
  onSelectionner,
}: {
  definitions: readonly DefinitionPoint[];
  positions: Map<string, Position>;
  codeActif: string | null;
  onSelectionner: (code: string) => void;
}) {
  const active = definitions.find((d) => d.code === codeActif);

  return (
    <aside className="space-y-3">
      {active && (
        <div className="bg-accent-400/10 text-accent-600 rounded-xl px-4 py-3 text-sm">
          <p className="font-medium">{active.libelle}</p>
          <p className="text-ardoise-600 mt-1 text-xs">{active.aide}</p>
          <p className="text-ardoise-500 mt-2 text-xs">
            {positions.has(active.code)
              ? 'Faites glisser le repère pour l’ajuster.'
              : 'Touchez la photo pour poser ce point.'}
          </p>
        </div>
      )}

      <ul className="divide-ardoise-200 max-h-72 divide-y overflow-y-auto rounded-xl bg-white shadow-sm lg:max-h-none">
        {definitions.map((definition) => {
          const place = positions.has(definition.code);
          return (
            <li key={definition.code}>
              <button
                type="button"
                onClick={() => onSelectionner(definition.code)}
                className={cn(
                  'flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm',
                  definition.code === codeActif ? 'bg-accent-400/10' : 'hover:bg-ardoise-50'
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'size-2.5 shrink-0 rounded-full',
                    place ? 'bg-accent-500' : 'bg-ardoise-300'
                  )}
                />
                <span className={cn('grow', place ? '' : 'text-ardoise-500')}>
                  {definition.libelle}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
