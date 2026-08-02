import { useState } from 'react';

import { Link, Navigate, useParams } from 'react-router-dom';

import { PhotoAnnotee } from '@/components/PhotoAnnotee';
import { Alerte } from '@/components/ui/Alerte';
import { Button } from '@/components/ui/Button';
import { BlocChargement } from '@/components/ui/Chargement';
import { useBilan, useBilans } from '@/features/bilans/hooks';
import { LIBELLE_VUE, VUES } from '@/features/cliches/hooks';
import { calculerEcarts } from '@/features/comparaison/ecarts';
import { TableauEcarts } from '@/features/comparaison/TableauEcarts';
import { positionsDuCliche, useDonneesBilan } from '@/features/comparaison/useDonneesBilan';
import { TableauMesures } from '@/features/mesures/TableauMesures';
import { usePatient } from '@/features/patients/hooks';
import { usePraticien } from '@/features/praticien/usePraticien';
import { rendreClicheAnnote } from '@/features/report/rendu';
import { calculerAge, formaterDate } from '@/lib/format';
import type { Bilan, Patient, Praticien } from '@/types/database';

export function RapportPage() {
  const { bilanId } = useParams<{ bilanId: string }>();
  if (!bilanId) return <Navigate to="/patients" replace />;
  return <ChargeurRapport bilanId={bilanId} />;
}

function ChargeurRapport({ bilanId }: { bilanId: string }) {
  const { data: bilan, isPending, error } = useBilan(bilanId);

  if (isPending) return <BlocChargement />;
  if (error) return <Alerte>Ce bilan est introuvable.</Alerte>;

  return <ContenuRapport bilan={bilan} />;
}

function ContenuRapport({ bilan }: { bilan: Bilan }) {
  const { data: patient } = usePatient(bilan.patient_id);
  const { data: praticien } = usePraticien();
  const { data: bilans } = useBilans(bilan.patient_id);
  const echelle = praticien?.echelle_px_par_cm ?? null;

  const donnees = useDonneesBilan(bilan.id, echelle);

  // Bilan de référence : le plus récent antérieur à celui-ci. `useBilans` les
  // trie du plus récent au plus ancien, le premier qui suit est donc le bon.
  const indexCourant = (bilans ?? []).findIndex((candidat) => candidat.id === bilan.id);
  const bilanPrecedent = indexCourant >= 0 ? (bilans?.[indexCourant + 1] ?? null) : null;

  const precedent = useDonneesBilan(bilanPrecedent?.id ?? '', echelle);
  const [avecComparaison, setAvecComparaison] = useState(true);

  const comparaisonActive = Boolean(bilanPrecedent) && avecComparaison;
  const ecarts = comparaisonActive ? calculerEcarts(precedent.mesures, donnees.mesures) : [];

  if (donnees.chargement || !patient || !praticien) return <BlocChargement />;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to={`/bilans/${bilan.id}`}
          className="text-ardoise-500 hover:text-ardoise-700 text-sm"
        >
          ‹ Retour au bilan
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          {bilanPrecedent && (
            <label className="text-ardoise-600 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={avecComparaison}
                onChange={(e) => setAvecComparaison(e.target.checked)}
                className="accent-accent-500 size-4"
              />
              Inclure l’évolution depuis le {formaterDate(bilanPrecedent.date_bilan)}
            </label>
          )}

          <BoutonExport
            bilan={bilan}
            patient={patient}
            praticien={praticien}
            donnees={donnees}
            ecarts={ecarts}
            bilanPrecedent={comparaisonActive ? bilanPrecedent : null}
          />
        </div>
      </div>

      <article className="space-y-6 rounded-xl bg-white p-6 shadow-sm">
        <header className="border-ardoise-900 space-y-1 border-b pb-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h1 className="text-lg font-semibold">{praticien.cabinet || 'Bilan postural'}</h1>
            <p className="text-sm">Bilan du {formaterDate(bilan.date_bilan)}</p>
          </div>
          {praticien.nom && <p className="text-ardoise-500 text-xs">{praticien.nom}</p>}
        </header>

        <section>
          <h2 className="font-semibold">
            {patient.nom.toUpperCase()} {patient.prenom}
          </h2>
          <p className="text-ardoise-500 mt-0.5 text-sm">
            {patient.date_naissance && `Né(e) le ${formaterDate(patient.date_naissance)}`}
            {calculerAge(patient.date_naissance) !== null &&
              ` · ${calculerAge(patient.date_naissance)} ans`}
          </p>
          {bilan.notes.trim() && (
            <p className="mt-3 text-sm whitespace-pre-wrap">{bilan.notes.trim()}</p>
          )}
        </section>

        {donnees.cliches.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-ardoise-500 text-xs font-medium tracking-wide uppercase">
              Clichés annotés
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {VUES.map((vue) => {
                const cliche = donnees.clicheParVue.get(vue);
                const url = cliche ? donnees.urls.get(cliche.photo_path) : undefined;
                if (!cliche || !url) return null;

                return (
                  <figure key={vue} className="space-y-1">
                    <PhotoAnnotee
                      url={url}
                      image={{
                        largeur: cliche.image_largeur,
                        hauteur: cliche.image_hauteur,
                      }}
                      vue={vue}
                      positions={positionsDuCliche(donnees, cliche)}
                    />
                    <figcaption className="text-ardoise-500 text-center text-xs">
                      {LIBELLE_VUE[vue]}
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          </section>
        )}

        {donnees.mesures.length > 0 ? (
          <section className="space-y-2">
            <h3 className="text-ardoise-500 text-xs font-medium tracking-wide uppercase">
              Mesures
            </h3>
            <TableauMesures mesures={donnees.mesures} />
          </section>
        ) : (
          <Alerte ton="info">
            Aucune mesure calculable : placez les points anatomiques sur les clichés.
          </Alerte>
        )}

        {comparaisonActive && ecarts.length > 0 && bilanPrecedent && (
          <section className="space-y-2">
            <h3 className="text-ardoise-500 text-xs font-medium tracking-wide uppercase">
              Évolution depuis le {formaterDate(bilanPrecedent.date_bilan)}
            </h3>
            <TableauEcarts ecarts={ecarts} />
          </section>
        )}
      </article>

      <p className="text-ardoise-400 text-xs">
        Le contenu de ce rapport reste à ajuster avec la praticienne : la mise en page est
        isolée dans un seul module, elle peut évoluer sans toucher au reste de l’application.
      </p>
    </div>
  );
}

function BoutonExport({
  bilan,
  patient,
  praticien,
  donnees,
  ecarts,
  bilanPrecedent,
}: {
  bilan: Bilan;
  patient: Patient;
  praticien: Praticien;
  donnees: ReturnType<typeof useDonneesBilan>;
  ecarts: ReturnType<typeof calculerEcarts>;
  bilanPrecedent: Bilan | null;
}) {
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function exporter() {
    setEnCours(true);
    setErreur(null);

    try {
      // jsPDF pèse près d'un mégaoctet et ne sert qu'ici : le charger à la
      // demande évite de l'imposer à chaque ouverture de l'application, sur un
      // iPhone en 4G au cabinet.
      const { genererRapportPdf, nomFichierRapport } = await import('@/features/report/pdf');

      // Les clichés sont rasterisés avec leurs annotations avant d'entrer dans
      // le PDF : jsPDF n'embarque que des images, pas du SVG.
      const clichesRendus = [];
      for (const vue of VUES) {
        const cliche = donnees.clicheParVue.get(vue);
        const url = cliche ? donnees.urls.get(cliche.photo_path) : undefined;
        if (!cliche || !url) continue;

        clichesRendus.push(
          await rendreClicheAnnote({
            url,
            image: { largeur: cliche.image_largeur, hauteur: cliche.image_hauteur },
            vue,
            positions: positionsDuCliche(donnees, cliche),
          })
        );
      }

      const blob = genererRapportPdf({
        praticien,
        patient,
        bilan,
        clichesRendus,
        mesures: donnees.mesures,
        comparaison: bilanPrecedent ? { bilan: bilanPrecedent, ecarts } : null,
      });

      const lien = document.createElement('a');
      lien.href = URL.createObjectURL(blob);
      lien.download = nomFichierRapport(patient, bilan);
      lien.click();
      // Libère l'objet une fois le téléchargement amorcé par le navigateur.
      setTimeout(() => URL.revokeObjectURL(lien.href), 10_000);
    } catch {
      setErreur("L'export a échoué. Rechargez la page et réessayez.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {erreur && <span className="text-xs text-red-600">{erreur}</span>}
      <Button onClick={() => void exporter()} enCours={enCours}>
        Exporter en PDF
      </Button>
    </div>
  );
}
