import { jsPDF } from 'jspdf';

import type { Ecart } from '@/features/comparaison/ecarts';
import { calculerAge, formaterDate } from '@/lib/format';
import { formaterValeur, libelleNorme, type ResultatMesure } from '@/lib/measures';
import type { Bilan, Patient, Praticien, VuePosturale } from '@/types/domaine';

import type { ClicheRendu } from './rendu';

const PAGE = { largeur: 210, hauteur: 297 };
const MARGE = 14;
const LARGEUR_UTILE = PAGE.largeur - 2 * MARGE;

const ARDOISE_900: [number, number, number] = [15, 23, 42];
const ARDOISE_500: [number, number, number] = [100, 116, 139];
const ARDOISE_200: [number, number, number] = [226, 232, 240];
const VERT: [number, number, number] = [5, 150, 105];
const AMBRE: [number, number, number] = [180, 83, 9];

const LIBELLE_VUE: Record<VuePosturale, string> = {
  face: 'Face',
  dos: 'Dos',
  profil: 'Profil',
};

export type ContenuRapport = {
  praticien: Praticien;
  patient: Patient;
  bilan: Bilan;
  clichesRendus: ClicheRendu[];
  mesures: ResultatMesure[];
  /** Bloc comparatif optionnel, face à un bilan antérieur. */
  comparaison: { bilan: Bilan; ecarts: Ecart[] } | null;
};

/**
 * Compose le rapport PDF.
 *
 * Le contenu exact reste à valider avec la praticienne : ce module concentre
 * toute la mise en page pour qu'un ajustement de maquette n'ait pas à toucher
 * au reste de l'application.
 */
export function genererRapportPdf(contenu: ContenuRapport): Blob {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  let y = MARGE;

  /** Réserve la place demandée, en passant à la page suivante si besoin. */
  function assurerPlace(hauteur: number) {
    if (y + hauteur <= PAGE.hauteur - MARGE - 10) return;
    doc.addPage();
    y = MARGE;
  }

  function titreSection(texte: string) {
    assurerPlace(12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...ARDOISE_900);
    doc.text(texte, MARGE, y);
    y += 5;
    doc.setDrawColor(...ARDOISE_200);
    doc.setLineWidth(0.3);
    doc.line(MARGE, y, MARGE + LARGEUR_UTILE, y);
    y += 5;
  }

  // ------------------------------------------------------------- en-tête
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...ARDOISE_900);
  doc.text(contenu.praticien.cabinet || 'Bilan postural', MARGE, y + 2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...ARDOISE_500);
  if (contenu.praticien.nom) doc.text(contenu.praticien.nom, MARGE, y + 7);

  doc.setFontSize(10);
  doc.setTextColor(...ARDOISE_900);
  doc.text(`Bilan du ${formaterDate(contenu.bilan.date_bilan)}`, PAGE.largeur - MARGE, y + 2, {
    align: 'right',
  });

  y += 12;
  doc.setDrawColor(...ARDOISE_900);
  doc.setLineWidth(0.5);
  doc.line(MARGE, y, MARGE + LARGEUR_UTILE, y);
  y += 8;

  // ------------------------------------------------------------- patient
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...ARDOISE_900);
  doc.text(`${contenu.patient.nom.toUpperCase()} ${contenu.patient.prenom}`, MARGE, y);
  y += 5;

  const age = calculerAge(contenu.patient.date_naissance);
  const identite = [
    contenu.patient.date_naissance
      ? `Né(e) le ${formaterDate(contenu.patient.date_naissance)}`
      : null,
    age !== null ? `${age} ans` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  if (identite) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...ARDOISE_500);
    doc.text(identite, MARGE, y);
    y += 5;
  }

  if (contenu.bilan.notes.trim()) {
    doc.setFontSize(9);
    doc.setTextColor(...ARDOISE_900);
    const lignes = doc.splitTextToSize(contenu.bilan.notes.trim(), LARGEUR_UTILE);
    assurerPlace(lignes.length * 4 + 4);
    doc.text(lignes, MARGE, y);
    y += lignes.length * 4 + 2;
  }

  y += 4;

  // -------------------------------------------------------------- photos
  if (contenu.clichesRendus.length > 0) {
    titreSection('Clichés annotés');

    const espace = 5;
    const colonnes = contenu.clichesRendus.length;
    const largeurVignette = (LARGEUR_UTILE - espace * (colonnes - 1)) / colonnes;
    const hauteurMax = Math.max(
      ...contenu.clichesRendus.map(
        (cliche) => (largeurVignette * cliche.hauteur) / cliche.largeur
      )
    );

    assurerPlace(hauteurMax + 10);

    contenu.clichesRendus.forEach((cliche, index) => {
      const x = MARGE + index * (largeurVignette + espace);
      const hauteur = (largeurVignette * cliche.hauteur) / cliche.largeur;

      doc.addImage(cliche.dataUrl, 'JPEG', x, y, largeurVignette, hauteur);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...ARDOISE_500);
      doc.text(LIBELLE_VUE[cliche.vue], x + largeurVignette / 2, y + hauteur + 4, {
        align: 'center',
      });
    });

    y += hauteurMax + 10;
  }

  // ------------------------------------------------------------- mesures
  const vues: VuePosturale[] = ['face', 'dos', 'profil'];
  const mesuresParVue = vues
    .map((vue) => ({ vue, lignes: contenu.mesures.filter((mesure) => mesure.vue === vue) }))
    .filter((groupe) => groupe.lignes.length > 0);

  if (mesuresParVue.length > 0) {
    titreSection('Mesures');

    for (const groupe of mesuresParVue) {
      assurerPlace(12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...ARDOISE_500);
      doc.text(LIBELLE_VUE[groupe.vue].toUpperCase(), MARGE, y);
      y += 5;

      for (const mesure of groupe.lignes) {
        assurerPlace(9);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...ARDOISE_900);
        doc.text(mesure.libelle, MARGE, y);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...(mesure.dansLaNorme ? VERT : AMBRE));
        doc.text(formaterValeur(mesure), MARGE + 105, y, { align: 'right' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...ARDOISE_500);
        doc.text(`norme ${libelleNorme(mesure.norme, mesure.unite)}`, MARGE + 112, y);
        doc.text(mesure.interpretation, MARGE + LARGEUR_UTILE, y, { align: 'right' });

        y += 4;
        doc.setDrawColor(...ARDOISE_200);
        doc.setLineWidth(0.1);
        doc.line(MARGE, y, MARGE + LARGEUR_UTILE, y);
        y += 3.5;
      }

      y += 3;
    }
  }

  // --------------------------------------------------------- comparaison
  if (contenu.comparaison && contenu.comparaison.ecarts.length > 0) {
    titreSection(`Évolution depuis le ${formaterDate(contenu.comparaison.bilan.date_bilan)}`);

    for (const ecart of contenu.comparaison.ecarts) {
      assurerPlace(9);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...ARDOISE_900);
      doc.text(`${LIBELLE_VUE[ecart.mesure.vue]} · ${ecart.mesure.libelle}`, MARGE, y);

      const transition = `${formaterValeur({ valeur: ecart.avant, unite: ecart.mesure.unite })}  ->  ${formaterValeur(
        { valeur: ecart.apres, unite: ecart.mesure.unite }
      )}`;
      doc.setTextColor(...ARDOISE_500);
      doc.text(transition, MARGE + 130, y, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(
        ...(ecart.evolution === 'amelioration'
          ? VERT
          : ecart.evolution === 'degradation'
            ? AMBRE
            : ARDOISE_500)
      );
      doc.text(
        ecart.evolution === 'amelioration'
          ? 'amélioration'
          : ecart.evolution === 'degradation'
            ? 'dégradation'
            : 'stable',
        MARGE + LARGEUR_UTILE,
        y,
        { align: 'right' }
      );

      y += 4;
      doc.setDrawColor(...ARDOISE_200);
      doc.setLineWidth(0.1);
      doc.line(MARGE, y, MARGE + LARGEUR_UTILE, y);
      y += 3.5;
    }
  }

  // -------------------------------------------------------------- pieds
  const total = doc.getNumberOfPages();
  for (let page = 1; page <= total; page++) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...ARDOISE_500);
    doc.text(
      `Document à usage professionnel — édité le ${formaterDate(dateDuJourIso())}`,
      MARGE,
      PAGE.hauteur - 10
    );
    doc.text(`${page} / ${total}`, PAGE.largeur - MARGE, PAGE.hauteur - 10, {
      align: 'right',
    });
  }

  return doc.output('blob');
}

function dateDuJourIso(): string {
  const maintenant = new Date();
  const mois = String(maintenant.getMonth() + 1).padStart(2, '0');
  const jour = String(maintenant.getDate()).padStart(2, '0');
  return `${maintenant.getFullYear()}-${mois}-${jour}`;
}

/** Nom de fichier lisible et trié naturellement par date. */
export function nomFichierRapport(patient: Patient, bilan: Bilan): string {
  const sansAccent = (texte: string) =>
    texte
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // marques diacritiques combinantes
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  return `bilan-${bilan.date_bilan}-${sansAccent(patient.nom)}-${sansAccent(patient.prenom)}.pdf`.toLowerCase();
}
