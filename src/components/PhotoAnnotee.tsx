import {
  construireAnnotations,
  COULEUR_PLOMB,
  COULEUR_POINT,
  COULEUR_SEGMENT,
  type PositionsPoints,
} from '@/lib/annotation-render';
import type { VuePosturale } from '@/types/database';

export type { PositionsPoints };

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
  const annotations = construireAnnotations({ vue, positions, image });

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
          {annotations.abscisseFilAPlomb !== null && (
            <line
              x1={annotations.abscisseFilAPlomb}
              y1={0}
              x2={annotations.abscisseFilAPlomb}
              y2={image.hauteur}
              stroke={COULEUR_PLOMB}
              strokeWidth={annotations.epaisseur}
              strokeDasharray={`${annotations.epaisseur * 6} ${annotations.epaisseur * 4}`}
              opacity={0.8}
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
              strokeWidth={annotations.epaisseur * 1.6}
              strokeLinecap="round"
              opacity={0.9}
            />
          ))}

          {annotations.points.map((point) => (
            <circle
              key={point.cle}
              cx={point.position.x}
              cy={point.position.y}
              r={annotations.epaisseur * 2.4}
              fill={COULEUR_POINT}
              stroke="#ffffff"
              strokeWidth={annotations.epaisseur * 0.8}
            />
          ))}
        </svg>
      )}
    </div>
  );
}
