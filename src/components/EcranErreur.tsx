/**
 * Écran de panne pleine page.
 *
 * Sur un outil utilisé en consultation, une page blanche est le pire des
 * retours : elle ne dit ni ce qui s'est passé, ni s'il faut réessayer ou
 * appeler à l'aide. Cet écran nomme la panne et propose la seule action utile.
 */
export function EcranErreur({
  titre,
  children,
  detail,
}: {
  titre: string;
  children: React.ReactNode;
  /** Message technique, replié : utile à qui dépanne, inutile au praticien. */
  detail?: string;
}) {
  return (
    <div className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold">{titre}</h1>
          <div className="text-ardoise-600 mt-3 space-y-2 text-sm">{children}</div>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="bg-accent-600 hover:bg-accent-500 mt-5 inline-flex h-11 items-center rounded-lg px-4 text-sm font-medium text-white"
          >
            Recharger la page
          </button>

          {detail && (
            <details className="mt-5">
              <summary className="text-ardoise-400 cursor-pointer text-xs">
                Détail technique
              </summary>
              <pre className="bg-ardoise-100 text-ardoise-700 mt-2 overflow-x-auto rounded p-2 text-xs whitespace-pre-wrap">
                {detail}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
