import {
  construireAnnotations,
  COULEUR_PLOMB,
  COULEUR_POINT,
  COULEUR_SEGMENT,
  type PositionsPoints,
} from '@/lib/annotation-render';
import { chargerImage } from '@/lib/image';
import type { VuePosturale } from '@/types/database';

/** Largeur du rendu destiné au PDF : au-delà, le fichier grossit pour rien. */
const LARGEUR_RENDU = 900;

export type ClicheRendu = {
  vue: VuePosturale;
  dataUrl: string;
  largeur: number;
  hauteur: number;
};

/**
 * Dessine une photo et ses annotations sur un canvas, et renvoie un JPEG
 * encodé en base64, prêt pour jsPDF.
 *
 * Les tracés proviennent du même calcul que l'aperçu à l'écran : seul le mode
 * de rendu change, de SVG à canvas.
 */
export async function rendreClicheAnnote(params: {
  url: string;
  image: { largeur: number; hauteur: number };
  vue: VuePosturale;
  positions: PositionsPoints;
}): Promise<ClicheRendu> {
  const photo = await chargerImage(params.url);

  const facteur = Math.min(1, LARGEUR_RENDU / params.image.largeur);
  const largeur = Math.round(params.image.largeur * facteur);
  const hauteur = Math.round(params.image.hauteur * facteur);

  const canvas = document.createElement('canvas');
  canvas.width = largeur;
  canvas.height = hauteur;

  const contexte = canvas.getContext('2d');
  if (!contexte) throw new Error("Le canvas 2D n'est pas disponible sur cet appareil.");

  contexte.drawImage(photo, 0, 0, largeur, hauteur);

  // Les annotations sont calculées dans le repère d'origine du cliché, puis
  // ramenées à l'échelle du rendu : elles restent alignées sur les pixels de la
  // photo quelle que soit la réduction appliquée.
  const annotations = construireAnnotations({
    vue: params.vue,
    positions: params.positions,
    image: params.image,
  });
  const epaisseur = annotations.epaisseur * facteur;

  if (annotations.abscisseFilAPlomb !== null) {
    contexte.save();
    contexte.strokeStyle = COULEUR_PLOMB;
    contexte.lineWidth = epaisseur;
    contexte.globalAlpha = 0.8;
    contexte.setLineDash([epaisseur * 6, epaisseur * 4]);
    contexte.beginPath();
    contexte.moveTo(annotations.abscisseFilAPlomb * facteur, 0);
    contexte.lineTo(annotations.abscisseFilAPlomb * facteur, hauteur);
    contexte.stroke();
    contexte.restore();
  }

  contexte.save();
  contexte.strokeStyle = COULEUR_SEGMENT;
  contexte.lineWidth = epaisseur * 1.6;
  contexte.lineCap = 'round';
  contexte.globalAlpha = 0.9;
  for (const segment of annotations.segments) {
    contexte.beginPath();
    contexte.moveTo(segment.a.x * facteur, segment.a.y * facteur);
    contexte.lineTo(segment.b.x * facteur, segment.b.y * facteur);
    contexte.stroke();
  }
  contexte.restore();

  contexte.save();
  contexte.fillStyle = COULEUR_POINT;
  contexte.strokeStyle = '#ffffff';
  contexte.lineWidth = epaisseur * 0.8;
  for (const point of annotations.points) {
    contexte.beginPath();
    contexte.arc(
      point.position.x * facteur,
      point.position.y * facteur,
      epaisseur * 2.4,
      0,
      Math.PI * 2
    );
    contexte.fill();
    contexte.stroke();
  }
  contexte.restore();

  return {
    vue: params.vue,
    dataUrl: canvas.toDataURL('image/jpeg', 0.85),
    largeur,
    hauteur,
  };
}
