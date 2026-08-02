import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { PleinEcranChargement } from '@/components/ui/Chargement';

import { useAuth } from './useAuth';

export function ProtectedRoute() {
  const { session, chargement } = useAuth();
  const location = useLocation();

  if (chargement) return <PleinEcranChargement />;

  if (!session) {
    // `state` permet de revenir à l'écran demandé après connexion.
    return <Navigate to="/connexion" replace state={{ depuis: location.pathname }} />;
  }

  return <Outlet />;
}
