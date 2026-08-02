import { cn } from '@/lib/cn';

import { Spinner } from './Chargement';

type Variante = 'primaire' | 'secondaire' | 'discret' | 'danger';
type Taille = 'md' | 'sm';

const VARIANTES: Record<Variante, string> = {
  primaire: 'bg-accent-600 text-white hover:bg-accent-500 focus-visible:outline-accent-600',
  secondaire:
    'bg-white text-ardoise-800 border border-ardoise-300 hover:bg-ardoise-50 focus-visible:outline-ardoise-400',
  discret: 'text-ardoise-600 hover:bg-ardoise-100 focus-visible:outline-ardoise-400',
  danger: 'bg-red-600 text-white hover:bg-red-500 focus-visible:outline-red-600',
};

const TAILLES: Record<Taille, string> = {
  // 44 px de haut : cible tactile confortable sur iPhone comme sur tablette.
  md: 'h-11 px-4 text-sm',
  sm: 'h-9 px-3 text-sm',
};

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: Variante;
  taille?: Taille;
  enCours?: boolean;
};

export function Button({
  variante = 'primaire',
  taille = 'md',
  enCours = false,
  disabled,
  className,
  children,
  ...props
}: Props) {
  return (
    <button
      {...props}
      disabled={disabled || enCours}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTES[variante],
        TAILLES[taille],
        className
      )}
    >
      {enCours && <Spinner className="size-4" />}
      {children}
    </button>
  );
}
