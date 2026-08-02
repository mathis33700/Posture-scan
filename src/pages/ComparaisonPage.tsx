import { useState } from 'react';

import { Link, Navigate, useParams } from 'react-router-dom';

import { PhotoAnnotee } from '@/components/PhotoAnnotee';
import { ResumePatient } from '@/components/ResumePatient';
import { Alerte, EtatVide } from '@/components/ui/Alerte';
import { BlocChargement } from '@/components/ui/Chargement';
import { useBilans } from '@/features/bilans/hooks';
import { LIBELLE_VUE, VUES } from '@/features/cliches/hooks';
import { calculerEcarts } from '@/features/comparaison/ecarts';
import { TableauEcarts } from '@/features/comparaison/TableauEcarts';
import { positionsDuCliche, useDonneesBilan } from '@/features/comparaison/useDonneesBilan';
import { usePatient } from '@/features/patients/hooks';
import { usePraticien } from '@/features/praticien/usePraticien';
import { cn } from '@/lib/cn';
import { formaterDate } from '@/lib/format';
import type { Bilan, VuePosturale } from '@/types/database';

type Affichage = 'cote-a-cote' | 'superposition';

export function ComparaisonPage() {
  const { patientId } = useParams<{ patientId: string }>();
  if (!patientId) return <Navigate to="/patients" replace />;
  return <ChargeurComparaison patientId={patientId} />;
}

function ChargeurComparaison({ patientId }: { patientId: string }) {
  const { data: bilans, isPending } = useBilans(patientId);

  if (isPending) return <BlocChargement />;

  if (!bilans || bilans.length < 2) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Link to={`/patients/${patientId}`} className="text-ardoise-500 text-sm">
          ‹ Retour à la fiche patient
        </Link>
        <EtatVide
          titre="Pas encore de quoi comparer"
          description="Il faut au moins deux bilans pour suivre une évolution."
        />
      </div>
    );
  }

  // Les bilans arrivent du plus récent au plus ancien : on propose d'emblée le
  // rapprochement le plus fréquent, le dernier bilan face au précédent.
  return <ContenuComparaison patientId={patientId} bilans={bilans} />;
}

function ContenuComparaison({ patientId, bilans }: { patientId: string; bilans: Bilan[] }) {
  const { data: patient } = usePatient(patientId);
  const { data: praticien } = usePraticien();
  const echelle = praticien?.echelle_px_par_cm ?? null;

  const [idAvant, setIdAvant] = useState(() => bilans[1]?.id ?? '');
  const [idApres, setIdApres] = useState(() => bilans[0]?.id ?? '');
  const [affichage, setAffichage] = useState<Affichage>('cote-a-cote');
  const [opacite, setOpacite] = useState(50);

  const avant = useDonneesBilan(idAvant, echelle);
  const apres = useDonneesBilan(idApres, echelle);

  const bilanAvant = bilans.find((bilan) => bilan.id === idAvant);
  const bilanApres = bilans.find((bilan) => bilan.id === idApres);
  const memeBilan = idAvant === idApres;

  const ecarts = calculerEcarts(avant.mesures, apres.mesures);
  const vuesComparables = VUES.filter(
    (vue) => avant.clicheParVue.has(vue) && apres.clicheParVue.has(vue)
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Link
          to={`/patients/${patientId}`}
          className="text-ardoise-500 hover:text-ardoise-700 text-sm"
        >
          ‹ Retour à la fiche patient
        </Link>
      </div>

      <header>
        <h1 className="text-xl font-semibold">Comparaison</h1>
        {patient && <ResumePatient patient={patient} />}
      </header>

      <div className="grid gap-4 rounded-xl bg-white p-5 shadow-sm sm:grid-cols-2">
        <ChoixBilan
          label="Bilan de référence"
          bilans={bilans}
          valeur={idAvant}
          onChange={setIdAvant}
        />
        <ChoixBilan
          label="Bilan comparé"
          bilans={bilans}
          valeur={idApres}
          onChange={setIdApres}
        />
      </div>

      {memeBilan && (
        <Alerte ton="info">
          Sélectionnez deux bilans différents pour voir une évolution.
        </Alerte>
      )}

      {!memeBilan && (avant.chargement || apres.chargement) && <BlocChargement />}

      {!memeBilan && !avant.chargement && !apres.chargement && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-ardoise-100 inline-flex rounded-lg p-1">
              {(['cote-a-cote', 'superposition'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setAffichage(mode)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium',
                    affichage === mode
                      ? 'text-ardoise-900 bg-white shadow-sm'
                      : 'text-ardoise-500'
                  )}
                >
                  {mode === 'cote-a-cote' ? 'Côte à côte' : 'Superposition'}
                </button>
              ))}
            </div>

            {affichage === 'superposition' && (
              <label className="flex grow items-center gap-3 text-sm sm:max-w-xs">
                <span className="text-ardoise-500 whitespace-nowrap">Fondu</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={opacite}
                  onChange={(e) => setOpacite(Number(e.target.value))}
                  className="accent-accent-500 grow"
                  aria-label="Opacité du bilan comparé"
                />
              </label>
            )}
          </div>

          {vuesComparables.length === 0 ? (
            <Alerte ton="info">
              Aucune vue n’est photographiée dans les deux bilans à la fois.
            </Alerte>
          ) : (
            <div
              className={cn(
                'grid gap-4',
                vuesComparables.length > 1 && 'sm:grid-cols-2 lg:grid-cols-3'
              )}
            >
              {vuesComparables.map((vue) => (
                <VueComparee
                  key={vue}
                  vue={vue}
                  avant={avant}
                  apres={apres}
                  dateAvant={bilanAvant?.date_bilan ?? null}
                  dateApres={bilanApres?.date_bilan ?? null}
                  affichage={affichage}
                  opacite={opacite}
                />
              ))}
            </div>
          )}

          <section className="space-y-3">
            <h2 className="font-medium">Évolution des mesures</h2>
            <TableauEcarts ecarts={ecarts} />
          </section>
        </>
      )}
    </div>
  );
}

function ChoixBilan({
  label,
  bilans,
  valeur,
  onChange,
}: {
  label: string;
  bilans: Bilan[];
  valeur: string;
  onChange: (id: string) => void;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-ardoise-700 block text-sm font-medium">{label}</span>
      <select
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        className="border-ardoise-300 focus:border-accent-500 focus:outline-accent-500/40 w-full rounded-lg border bg-white px-3 py-2.5 text-base focus:outline-2"
      >
        {bilans.map((bilan) => (
          <option key={bilan.id} value={bilan.id}>
            {formaterDate(bilan.date_bilan)}
          </option>
        ))}
      </select>
    </label>
  );
}

function VueComparee({
  vue,
  avant,
  apres,
  dateAvant,
  dateApres,
  affichage,
  opacite,
}: {
  vue: VuePosturale;
  avant: ReturnType<typeof useDonneesBilan>;
  apres: ReturnType<typeof useDonneesBilan>;
  dateAvant: string | null;
  dateApres: string | null;
  affichage: Affichage;
  opacite: number;
}) {
  const clicheAvant = avant.clicheParVue.get(vue);
  const clicheApres = apres.clicheParVue.get(vue);
  if (!clicheAvant || !clicheApres) return null;

  const urlAvant = avant.urls.get(clicheAvant.photo_path);
  const urlApres = apres.urls.get(clicheApres.photo_path);
  if (!urlAvant || !urlApres) return <BlocChargement libelle="Chargement des photos…" />;

  return (
    <section className="space-y-2 rounded-xl bg-white p-3 shadow-sm">
      <h3 className="text-ardoise-500 text-xs font-medium tracking-wide uppercase">
        {LIBELLE_VUE[vue]}
      </h3>

      {affichage === 'cote-a-cote' ? (
        <div className="grid grid-cols-2 gap-2">
          <figure className="space-y-1">
            <PhotoAnnotee
              url={urlAvant}
              image={{
                largeur: clicheAvant.image_largeur,
                hauteur: clicheAvant.image_hauteur,
              }}
              vue={vue}
              positions={positionsDuCliche(avant, clicheAvant)}
            />
            <figcaption className="text-ardoise-500 text-center text-xs">
              {formaterDate(dateAvant)}
            </figcaption>
          </figure>

          <figure className="space-y-1">
            <PhotoAnnotee
              url={urlApres}
              image={{
                largeur: clicheApres.image_largeur,
                hauteur: clicheApres.image_hauteur,
              }}
              vue={vue}
              positions={positionsDuCliche(apres, clicheApres)}
            />
            <figcaption className="text-ardoise-500 text-center text-xs">
              {formaterDate(dateApres)}
            </figcaption>
          </figure>
        </div>
      ) : (
        <figure className="space-y-1">
          {/* Les deux clichés se superposent dans le format du plus récent : le
              cadrage étant identique d'une séance à l'autre, le patient se
              recale de lui-même. */}
          <div className="relative">
            <PhotoAnnotee
              url={urlAvant}
              image={{
                largeur: clicheApres.image_largeur,
                hauteur: clicheApres.image_hauteur,
              }}
              vue={vue}
              positions={positionsDuCliche(avant, clicheAvant)}
            />
            <div className="absolute inset-0">
              <PhotoAnnotee
                url={urlApres}
                image={{
                  largeur: clicheApres.image_largeur,
                  hauteur: clicheApres.image_hauteur,
                }}
                vue={vue}
                positions={positionsDuCliche(apres, clicheApres)}
                opacite={opacite / 100}
              />
            </div>
          </div>
          <figcaption className="text-ardoise-500 text-center text-xs">
            {formaterDate(dateAvant)} sous {formaterDate(dateApres)}
          </figcaption>
        </figure>
      )}
    </section>
  );
}
