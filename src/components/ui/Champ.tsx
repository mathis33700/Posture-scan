import { useId } from 'react';

import { cn } from '@/lib/cn';

const STYLE_SAISIE =
  'w-full rounded-lg border border-ardoise-300 bg-white px-3 py-2.5 ' +
  // 16 px minimum : en dessous, iOS zoome automatiquement à la mise au point.
  'text-base placeholder:text-ardoise-400 ' +
  'focus:border-accent-500 focus:outline-2 focus:outline-offset-0 focus:outline-accent-500/40 ' +
  'disabled:bg-ardoise-100 disabled:text-ardoise-500';

type ChampProps = {
  label: string;
  aide?: string;
  erreur?: string;
  children: (id: string) => React.ReactNode;
};

/** Enveloppe accessible : relie le label, l'aide et l'erreur au contrôle. */
export function Champ({ label, aide, erreur, children }: ChampProps) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-ardoise-700 block text-sm font-medium">
        {label}
      </label>
      {children(id)}
      {aide && !erreur && <p className="text-ardoise-500 text-xs">{aide}</p>}
      {erreur && (
        <p role="alert" className="text-xs text-red-600">
          {erreur}
        </p>
      )}
    </div>
  );
}

export function Saisie({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(STYLE_SAISIE, className)} />;
}

export function ZoneTexte({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(STYLE_SAISIE, 'min-h-24 resize-y', className)} />;
}
