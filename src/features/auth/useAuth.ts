import { use } from 'react';

import { AuthContext } from './AuthContext';

export function useAuth() {
  const contexte = use(AuthContext);
  if (!contexte) throw new Error('useAuth doit être utilisé dans un AuthProvider');
  return contexte;
}

/**
 * Identifiant du praticien connecté. Réservé aux écrans situés derrière
 * `ProtectedRoute`, où la session est garantie présente.
 */
export function usePraticienId(): string {
  const { session } = useAuth();
  if (!session) throw new Error('Session absente : écran attendu derrière ProtectedRoute');
  return session.user.id;
}
