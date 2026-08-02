import { LIBELLE_VUE, VUES } from '@/features/cliches/hooks';
import { cn } from '@/lib/cn';
import { formaterValeur } from '@/lib/measures';

import type { Ecart, Evolution } from './ecarts';

const LIBELLE_EVOLUTION: Record<Evolution, string> = {
  amelioration: 'amélioration',
  degradation: 'dégradation',
  stable: 'stable',
};

const STYLE_EVOLUTION: Record<Evolution, string> = {
  amelioration: 'bg-emerald-50 text-emerald-700',
  degradation: 'bg-amber-50 text-amber-700',
  stable: 'bg-ardoise-100 text-ardoise-500',
};

export function TableauEcarts({ ecarts }: { ecarts: Ecart[] }) {
  const parVue = VUES.map((vue) => ({
    vue,
    lignes: ecarts.filter((ecart) => ecart.mesure.vue === vue),
  })).filter((groupe) => groupe.lignes.length > 0);

  if (parVue.length === 0) {
    return (
      <p className="text-ardoise-500 text-sm">
        Aucune mesure commune aux deux bilans : les mêmes points doivent être placés de part et
        d’autre pour pouvoir les rapprocher.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {parVue.map(({ vue, lignes }) => (
        <section key={vue} className="overflow-hidden rounded-xl bg-white shadow-sm">
          <h3 className="text-ardoise-500 border-ardoise-200 border-b px-4 py-2.5 text-xs font-medium tracking-wide uppercase">
            {LIBELLE_VUE[vue]}
          </h3>

          <ul className="divide-ardoise-100 divide-y">
            {lignes.map((ecart) => (
              <li
                key={ecart.mesure.type}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3"
              >
                <span className="min-w-0 grow text-sm font-medium">
                  {ecart.mesure.libelle}
                </span>

                <span className="text-ardoise-500 text-sm tabular-nums">
                  {formaterValeur({ valeur: ecart.avant, unite: ecart.mesure.unite })}
                  <span className="text-ardoise-300 mx-1.5">→</span>
                  <span className="text-ardoise-800 font-semibold">
                    {formaterValeur({ valeur: ecart.apres, unite: ecart.mesure.unite })}
                  </span>
                </span>

                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-medium tabular-nums',
                    STYLE_EVOLUTION[ecart.evolution]
                  )}
                >
                  {ecart.delta > 0 ? '+' : ''}
                  {ecart.delta}
                  {ecart.mesure.unite === 'deg' ? '°' : ' cm'} ·{' '}
                  {LIBELLE_EVOLUTION[ecart.evolution]}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
