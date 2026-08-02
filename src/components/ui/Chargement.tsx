import { cn } from '@/lib/cn';

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Chargement"
      className={cn(
        'border-ardoise-300 border-t-accent-500 inline-block animate-spin rounded-full border-2',
        className ?? 'size-5'
      )}
    />
  );
}

export function PleinEcranChargement() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <Spinner className="size-8" />
    </div>
  );
}

export function BlocChargement({ libelle = 'Chargement…' }: { libelle?: string }) {
  return (
    <div className="text-ardoise-500 flex items-center justify-center gap-3 py-12 text-sm">
      <Spinner />
      {libelle}
    </div>
  );
}
