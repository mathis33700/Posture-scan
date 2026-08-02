import { useEffect, useRef } from 'react';

/**
 * S'appuie sur `<dialog>` natif : piégeage du focus, inertie de l'arrière-plan
 * et fermeture par Échap sont gérés par le navigateur, ce qu'une div avec
 * `role="dialog"` obligerait à réimplémenter.
 */
export function Modale({
  ouverte,
  onFermer,
  titre,
  children,
}: {
  ouverte: boolean;
  onFermer: () => void;
  titre: string;
  children: React.ReactNode;
}) {
  const dialogue = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialogue.current;
    if (!element) return;

    if (ouverte && !element.open) element.showModal();
    if (!ouverte && element.open) element.close();
  }, [ouverte]);

  return (
    <dialog
      ref={dialogue}
      onCancel={(e) => {
        // Échap : on laisse React piloter l'état plutôt que le DOM.
        e.preventDefault();
        onFermer();
      }}
      onClick={(e) => {
        // Clic sur le fond : la cible est le dialogue lui-même, jamais son contenu.
        if (e.target === dialogue.current) onFermer();
      }}
      className="bg-ardoise-900/40 m-0 h-full max-h-none w-full max-w-none justify-items-center bg-transparent p-0 backdrop:bg-black/40 open:grid open:items-end sm:open:items-center"
    >
      <div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:max-w-lg sm:rounded-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold">{titre}</h2>
          <button
            type="button"
            onClick={onFermer}
            aria-label="Fermer"
            className="text-ardoise-400 hover:text-ardoise-700 -m-2 p-2 text-xl leading-none"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
