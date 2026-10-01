import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Layout & Auth
import { AppShell } from '@/components/layout/AppShell';
import { LoginPage } from '@/pages/auth/Login';
import { HomePage } from '@/pages/home/HomePage';
import { useAuthStore } from '@/stores/auth.store';

// Pages
import { DashboardPage } from '@/pages/dashboard';
import { LoadsPage } from '@/pages/loads';
import { LrNumbersPage } from '@/pages/lr-numbers';
import { BiltiesPage } from '@/pages/bilties';
import { VehiclesPage } from '@/pages/vehicles';
import { DriversPage } from '@/pages/drivers';
import { DocumentsPage } from '@/pages/documents';
import { CustomersPage } from '@/pages/customers';
import { FreightPage } from '@/pages/freight';
import { DeliveryChallansPage } from '@/pages/delivery-challans';
import { GatePassesPage } from '@/pages/gate-passes';
import { PodManagementPage } from '@/pages/pod';
import { ReportsPage } from '@/pages/reports';
import { WhatsAppSettingsPage } from '@/pages/settings/whatsapp';
import { PdfTemplatesPage } from '@/pages/settings/pdf-templates';
import { PublicVerifyPage } from '@/pages/verify/PublicVerifyPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 30, // 30 seconds
    },
  },
});

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/home" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Landing & Auth Routes */}
          <Route path="/home" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify/:token" element={<PublicVerifyPage />} />

          {/* Protected Application Routes inside AppShell */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="loads" element={<LoadsPage />} />
            <Route path="lr-numbers" element={<LrNumbersPage />} />
            <Route path="bilties" element={<BiltiesPage />} />
            <Route path="vehicles" element={<VehiclesPage />} />
            <Route path="drivers" element={<DriversPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="freight" element={<FreightPage />} />
            <Route path="delivery-challans" element={<DeliveryChallansPage />} />
            <Route path="gate-passes" element={<GatePassesPage />} />
            <Route path="pod" element={<PodManagementPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings/whatsapp" element={<WhatsAppSettingsPage />} />
            <Route path="settings/pdf-templates" element={<PdfTemplatesPage />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
