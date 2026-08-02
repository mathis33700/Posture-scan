import { LIBELLE_VUE, VUES } from '@/features/cliches/hooks';
import { cn } from '@/lib/cn';
import { formaterValeur, libelleNorme, type ResultatMesure } from '@/lib/measures';

export function TableauMesures({ mesures }: { mesures: ResultatMesure[] }) {
  const parVue = VUES.map((vue) => ({
    vue,
    lignes: mesures.filter((mesure) => mesure.vue === vue),
  })).filter((groupe) => groupe.lignes.length > 0);

  if (parVue.length === 0) return null;

  return (
    <div className="space-y-4">
      {parVue.map(({ vue, lignes }) => (
        <section key={vue} className="overflow-hidden rounded-xl bg-white shadow-sm">
          <h3 className="text-ardoise-500 border-ardoise-200 border-b px-4 py-2.5 text-xs font-medium tracking-wide uppercase">
            {LIBELLE_VUE[vue]}
          </h3>

          {/* Un tableau sur écran large, des cartes empilées sur iPhone : à
              cette largeur, quatre colonnes deviendraient illisibles. */}
          <ul className="divide-ardoise-100 divide-y">
            {lignes.map((mesure) => (
              <li
                key={mesure.type}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3"
              >
                <span className="min-w-0 grow text-sm font-medium">{mesure.libelle}</span>

                <span
                  className={cn(
                    'text-sm font-semibold tabular-nums',
                    mesure.dansLaNorme ? 'text-emerald-600' : 'text-amber-600'
                  )}
                >
                  {formaterValeur(mesure)}
                </span>

                <span className="text-ardoise-400 text-xs whitespace-nowrap">
                  norme {libelleNorme(mesure.norme, mesure.unite)}
                </span>

                <span className="text-ardoise-500 w-full text-xs">
                  {mesure.interpretation}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
