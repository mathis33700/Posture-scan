import { cn } from '@/lib/cn';

type Ton = 'erreur' | 'info' | 'succes';

const TONS: Record<Ton, string> = {
  erreur: 'bg-red-50 text-red-800 border-red-200',
  info: 'bg-accent-400/10 text-accent-600 border-accent-400/30',
  succes: 'bg-emerald-50 text-emerald-800 border-emerald-200',
};

export function Alerte({
  ton = 'erreur',
  children,
  className,
}: {
  ton?: Ton;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      role={ton === 'erreur' ? 'alert' : 'status'}
      className={cn('rounded-lg border px-3 py-2 text-sm', TONS[ton], className)}
    >
      {children}
    </p>
  );
}

export function EtatVide({
  titre,
  description,
  action,
}: {
  titre: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="border-ardoise-300 rounded-xl border border-dashed px-6 py-12 text-center">
      <p className="text-ardoise-700 font-medium">{titre}</p>
      {description && <p className="text-ardoise-500 mt-1 text-sm">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
