import type { Rectangle } from './fit';

const COTE = 132;
const MAGNIFICATION = 3;

/**
 * Loupe affichée pendant le déplacement d'un point : sous le doigt, le repère
 * est masqué par la main, et un tragus se place au pixel près.
 *
 * La zone montrée est calculée sur le rectangle « fit », donc indépendamment du
 * zoom courant : la loupe garde le même grossissement que l'image soit ajustée
 * ou déjà agrandie.
 */
export function Loupe({
  url,
  x,
  y,
  fit,
  aDroite,
}: {
  url: string;
  /** Position visée, normalisée entre 0 et 1. */
  x: number;
  y: number;
  fit: Rectangle;
  /** Bascule la loupe dans l'angle opposé quand le doigt approche. */
  aDroite: boolean;
}) {
  const largeurAgrandie = fit.width * MAGNIFICATION;
  const hauteurAgrandie = fit.height * MAGNIFICATION;

  return (
    <div
      aria-hidden
      className="border-ardoise-900/70 pointer-events-none absolute top-3 z-20 overflow-hidden rounded-full border-2 shadow-lg"
      style={{
        width: COTE,
        height: COTE,
        left: aDroite ? undefined : 12,
        right: aDroite ? 12 : undefined,
        backgroundImage: `url(${url})`,
        backgroundSize: `${largeurAgrandie}px ${hauteurAgrandie}px`,
        backgroundPosition: `${COTE / 2 - x * largeurAgrandie}px ${COTE / 2 - y * hauteurAgrandie}px`,
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#e2e8f0',
      }}
    >
      <span className="absolute top-1/2 left-0 h-px w-full bg-red-500/70" />
      <span className="absolute top-0 left-1/2 h-full w-px bg-red-500/70" />
    </div>
  );
}
