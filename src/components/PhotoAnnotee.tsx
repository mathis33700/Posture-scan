import { BASE_FIL_A_PLOMB, SEGMENTS_PAR_VUE } from '@/lib/points-catalog';
import type { VuePosturale } from '@/types/database';

export type PositionsPoints = Map<string, { x: number; y: number }>;

/**
 * Photo avec ses repères, ses segments et son fil à plomb, en lecture seule.
 *
 * Le conteneur adopte exactement le rapport de l'image, si bien que le SVG
 * superposé peut travailler dans le repère pixel du cliché : les cercles
 * restent des cercles et les épaisseurs de trait sont uniformes, ce qui ne
 * serait pas le cas avec un `viewBox` étiré sur un conteneur d'un autre format.
 */
export function PhotoAnnotee({
  url,
  image,
  vue,
  positions,
  opacite = 1,
  afficherReperes = true,
}: {
  url: string;
  image: { largeur: number; hauteur: number };
  vue: VuePosturale;
  positions: PositionsPoints;
  opacite?: number;
  afficherReperes?: boolean;
}) {
  const enPixels = (code: string) => {
    const point = positions.get(code);
    return point ? { x: point.x * image.largeur, y: point.y * image.hauteur } : null;
  };

  const basesFilAPlomb = BASE_FIL_A_PLOMB[vue]
    .map(enPixels)
    .filter((point): point is { x: number; y: number } => point !== null);

  const abscisseFilAPlomb =
    basesFilAPlomb.length > 0
      ? basesFilAPlomb.reduce((somme, point) => somme + point.x, 0) / basesFilAPlomb.length
      : null;

  // Le trait est proportionné à l'image pour rester lisible quelle que soit sa
  // définition, du rendu écran à l'export PDF.
  const epaisseur = Math.max(image.largeur, image.hauteur) / 400;

  return (
    <div
      className="bg-ardoise-100 relative w-full overflow-hidden rounded-lg"
      style={{ aspectRatio: `${image.largeur} / ${image.hauteur}`, opacity: opacite }}
    >
      <img src={url} alt={`Vue de ${vue}`} className="size-full object-cover" />

      {afficherReperes && (
        <svg
          viewBox={`0 0 ${image.largeur} ${image.hauteur}`}
          className="pointer-events-none absolute inset-0 size-full"
          aria-hidden
        >
          {abscisseFilAPlomb !== null && (
            <line
              x1={abscisseFilAPlomb}
              y1={0}
              x2={abscisseFilAPlomb}
              y2={image.hauteur}
              stroke="#38bdf8"
              strokeWidth={epaisseur}
              strokeDasharray={`${epaisseur * 6} ${epaisseur * 4}`}
              opacity={0.8}
            />
          )}

          {SEGMENTS_PAR_VUE[vue].map(([codeA, codeB]) => {
            const a = enPixels(codeA);
            const b = enPixels(codeB);
            if (!a || !b) return null;

            return (
              <line
                key={`${codeA}-${codeB}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#f8fafc"
                strokeWidth={epaisseur * 1.6}
                strokeLinecap="round"
                opacity={0.9}
              />
            );
          })}

          {[...positions.entries()].map(([code, point]) => (
            <circle
              key={code}
              cx={point.x * image.largeur}
              cy={point.y * image.hauteur}
              r={epaisseur * 2.4}
              fill="#0ea5e9"
              stroke="#ffffff"
              strokeWidth={epaisseur * 0.8}
            />
          ))}
        </svg>
      )}
    </div>
  );
}
