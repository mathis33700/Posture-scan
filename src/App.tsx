import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AppLayout } from '@/components/AppLayout';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { AnnotationPage } from '@/pages/AnnotationPage';
import { BilanPage } from '@/pages/BilanPage';
import { ComparaisonPage } from '@/pages/ComparaisonPage';
import { ConnexionPage } from '@/pages/ConnexionPage';
import { MotDePassePage } from '@/pages/MotDePassePage';
import { PatientPage } from '@/pages/PatientPage';
import { PatientsPage } from '@/pages/PatientsPage';
import { RapportPage } from '@/pages/RapportPage';
import { ReglagesPage } from '@/pages/ReglagesPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Le cabinet a un réseau stable et les données changent peu pendant une
      // consultation : on évite les rechargements au moindre retour d'onglet.
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/connexion" element={<ConnexionPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route index element={<Navigate to="/patients" replace />} />
                <Route path="/patients" element={<PatientsPage />} />
                <Route path="/patients/:patientId" element={<PatientPage />} />
                <Route path="/patients/:patientId/comparaison" element={<ComparaisonPage />} />
                <Route path="/bilans/:bilanId" element={<BilanPage />} />
                <Route path="/bilans/:bilanId/vues/:vue" element={<AnnotationPage />} />
                <Route path="/bilans/:bilanId/rapport" element={<RapportPage />} />
                <Route path="/reglages" element={<ReglagesPage />} />
                <Route path="/mot-de-passe" element={<MotDePassePage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/patients" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
