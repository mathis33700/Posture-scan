import { useState } from 'react';

import { Link } from 'react-router-dom';

import { Alerte } from '@/components/ui/Alerte';
import { Button } from '@/components/ui/Button';
import { Champ, Saisie } from '@/components/ui/Champ';
import { BlocChargement } from '@/components/ui/Chargement';
import { useMajPraticien, usePraticien } from '@/features/praticien/usePraticien';
import type { Praticien } from '@/types/database';

export function ReglagesPage() {
  const { data: praticien, isPending, error } = usePraticien();

  if (isPending) return <BlocChargement />;
  if (error) return <Alerte>Impossible de charger votre fiche praticien.</Alerte>;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Réglages</h1>
        <p className="text-ardoise-500 mt-1 text-sm">{praticien.email}</p>
      </header>

      {/* Monté une fois la fiche disponible : le formulaire initialise donc son
          état directement depuis les valeurs enregistrées, sans effet de
          synchronisation. */}
      <FormulaireReglages praticien={praticien} />

      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="font-medium">Sécurité</h2>
        <p className="text-ardoise-500 mt-1 text-sm">
          Les données patients sont des données de santé : utilisez un mot de passe long et
          propre à cet outil.
        </p>
        <Link to="/mot-de-passe" className="mt-3 inline-block">
          <Button variante="secondaire" taille="sm">
            Changer de mot de passe
          </Button>
        </Link>
      </section>
    </div>
  );
}

function FormulaireReglages({ praticien }: { praticien: Praticien }) {
  const majPraticien = useMajPraticien();
  const [nom, setNom] = useState(praticien.nom);
  const [cabinet, setCabinet] = useState(praticien.cabinet);
  const [echelle, setEchelle] = useState(praticien.echelle_px_par_cm?.toString() ?? '');
  const [enregistre, setEnregistre] = useState(false);

  const echelleSaisie = echelle.trim().replace(',', '.');
  // `!(x > 0)` couvre d'un coup NaN, 0 et les valeurs négatives.
  const echelleInvalide = echelleSaisie !== '' && !(Number(echelleSaisie) > 0);

  function soumettre(evenement: React.FormEvent) {
    evenement.preventDefault();
    setEnregistre(false);

    majPraticien.mutate(
      {
        nom: nom.trim(),
        cabinet: cabinet.trim(),
        echelle_px_par_cm: echelleSaisie === '' ? null : Number(echelleSaisie),
      },
      { onSuccess: () => setEnregistre(true) }
    );
  }

  return (
    <form onSubmit={soumettre} className="space-y-5 rounded-xl bg-white p-5 shadow-sm">
      <Champ label="Nom du praticien">
        {(id) => <Saisie id={id} value={nom} onChange={(e) => setNom(e.target.value)} />}
      </Champ>

      <Champ label="Cabinet" aide="Apparaît en en-tête des rapports PDF.">
        {(id) => (
          <Saisie id={id} value={cabinet} onChange={(e) => setCabinet(e.target.value)} />
        )}
      </Champ>

      <Champ
        label="Calibrage : pixels par centimètre"
        aide="Photographiez une règle à l’emplacement habituel du patient, relevez combien de
              pixels couvrent 10 cm, puis divisez par 10. Les photos étant toujours prises au
              même endroit et à la même distance, ce réglage ne se fait qu’une fois. Laissé
              vide, seules les mesures angulaires sont affichées."
        erreur={echelleInvalide ? 'Saisissez un nombre strictement positif.' : undefined}
      >
        {(id) => (
          <Saisie
            id={id}
            inputMode="decimal"
            placeholder="ex. 12.5"
            value={echelle}
            onChange={(e) => setEchelle(e.target.value)}
          />
        )}
      </Champ>

      {majPraticien.isError && <Alerte>Enregistrement impossible. Réessayez.</Alerte>}
      {enregistre && !majPraticien.isPending && (
        <Alerte ton="succes">Réglages enregistrés.</Alerte>
      )}

      <Button type="submit" enCours={majPraticien.isPending} disabled={echelleInvalide}>
        Enregistrer
      </Button>
    </form>
  );
}
