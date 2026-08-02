import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { usePraticien } from '@/features/praticien/usePraticien';
import { cn } from '@/lib/cn';
import { supabase } from '@/lib/supabase';

const LIENS = [
  { to: '/patients', libelle: 'Patients', icone: IconePatients },
  { to: '/reglages', libelle: 'Réglages', icone: IconeReglages },
];

/**
 * Deux dispositions pour un même contenu : barre de navigation basse sur
 * iPhone (pouce), rail latéral persistant dès la tablette. Le brief insiste
 * sur les deux usages, on ne se contente donc pas d'un mobile-first étiré.
 */
export function AppLayout() {
  const { data: praticien } = usePraticien();
  const navigate = useNavigate();

  async function deconnecter() {
    await supabase.auth.signOut();
    navigate('/connexion', { replace: true });
  }

  return (
    <div className="min-h-dvh md:flex">
      <aside className="border-ardoise-200 hidden w-60 shrink-0 border-r bg-white md:flex md:flex-col">
        <div className="px-5 py-6">
          <p className="text-lg font-semibold">Posture Scan</p>
          {praticien?.cabinet && (
            <p className="text-ardoise-500 mt-0.5 text-xs">{praticien.cabinet}</p>
          )}
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {LIENS.map(({ to, libelle, icone: Icone }) => (
            <NavLink key={to} to={to} className={lienLateral}>
              <Icone className="size-5" />
              {libelle}
            </NavLink>
          ))}
        </nav>

        <div className="border-ardoise-200 border-t px-3 py-4">
          <p className="text-ardoise-500 truncate px-2 pb-2 text-xs">{praticien?.email}</p>
          <Button variante="discret" taille="sm" className="w-full" onClick={deconnecter}>
            Se déconnecter
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 px-4 py-5 pb-24 md:px-8 md:py-8 md:pb-8">
          <Outlet />
        </main>

        <nav className="border-ardoise-200 fixed inset-x-0 bottom-0 z-20 flex border-t bg-white/95 backdrop-blur md:hidden">
          {LIENS.map(({ to, libelle, icone: Icone }) => (
            <NavLink key={to} to={to} className={lienBas}>
              <Icone className="size-5" />
              {libelle}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={deconnecter}
            className="text-ardoise-500 flex flex-1 flex-col items-center gap-1 py-2.5 text-xs"
          >
            <IconeSortie className="size-5" />
            Quitter
          </button>
        </nav>
      </div>
    </div>
  );
}

function lienLateral({ isActive }: { isActive: boolean }) {
  return cn(
    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
    isActive ? 'bg-accent-400/15 text-accent-600' : 'text-ardoise-600 hover:bg-ardoise-100'
  );
}

function lienBas({ isActive }: { isActive: boolean }) {
  return cn(
    'flex flex-1 flex-col items-center gap-1 py-2.5 text-xs',
    isActive ? 'text-accent-600' : 'text-ardoise-500'
  );
}

function IconePatients({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden
    >
      <circle cx="12" cy="8" r="3.5" strokeWidth="1.8" />
      <path d="M5 20a7 7 0 0 1 14 0" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconeReglages({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden
    >
      <circle cx="12" cy="12" r="3" strokeWidth="1.8" />
      <path
        d="M12 3v2.2M12 18.8V21M21 12h-2.2M5.2 12H3m13.4-6.4-1.6 1.6M9.2 14.8l-1.6 1.6m0-11.2 1.6 1.6m5.6 5.6 1.6 1.6"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconeSortie({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden
    >
      <path
        d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h11"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
