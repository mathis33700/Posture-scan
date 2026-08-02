import { useEffect, useState } from 'react';

/** Retarde la propagation d'une valeur, le temps que la frappe se stabilise. */
export function useDebounce<T>(valeur: T, delaiMs = 250): T {
  const [retardee, setRetardee] = useState(valeur);

  useEffect(() => {
    const minuteur = setTimeout(() => setRetardee(valeur), delaiMs);
    return () => clearTimeout(minuteur);
  }, [valeur, delaiMs]);

  return retardee;
}
