/**
 * @file AppRouter.tsx
 * @description Client-side routing — React Router v6 with protected routes
 *
 * Route groups:
 *   Public  — intro, login, onboarding
 *   Private — all authenticated pages (guarded by PrivateRoute)
 *
 * @author    Paulo Ricardo de Leão  <paulo@regenerabank.app>
 * @id        RG-2098233287
 * @maintainer Raphaela Cerveski    <ceo@regenerabank.app>
 * @copyright 2026 Regenera Corporate Ltd. — All rights reserved.
 * @license   UNLICENSED
 */

/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from '@/foundation/store';

// ── Eager (small, always needed) ────────────────────────────────────────────
import { IntroPage }    from '@/features/authentication/ui/IntroPage';
import { LoginPage }    from '@/features/authentication/ui/LoginPage';
import { HomeScreen }   from '@/features/account-banking/ui/HomeScreen';

// ── Lazy (loaded only when the user navigates there) ─────────────────────────
const OnboardingPage     = lazy(() => import('@/features/authentication/ui/OnboardingPage').then(m => ({ default: m.OnboardingPage })));
const NeuralCorePage     = lazy(() => import('@/pages/NeuralCorePage').then(m => ({ default: m.NeuralCorePage })));
const CardsPage          = lazy(() => import('@/features/cards/ui/CardsPage').then(m => ({ default: m.CardsPage })));
const PixPage            = lazy(() => import('@/features/payments/pix/ui/PixPage').then(m => ({ default: m.PixPage })));
const TransferPage       = lazy(() => import('@/features/transfer/ui/TransferPage').then(m => ({ default: m.TransferPage })));
const InvestmentTerminal = lazy(() => import('@/features/wealth-management/ui/InvestmentTerminal').then(m => ({ default: m.InvestmentTerminal })));
const ProfilePage        = lazy(() => import('@/features/account-banking/ui/ProfilePage').then(m => ({ default: m.ProfilePage })));
const NotificationsPage  = lazy(() => import('@/features/account-banking/ui/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const OpenFinancePage    = lazy(() => import('@/features/security-and-consent/ui/OpenFinancePage').then(m => ({ default: m.OpenFinancePage })));
const SecurityCenterPage = lazy(() => import('@/features/security-and-consent/ui/SecurityCenterPage').then(m => ({ default: m.SecurityCenterPage })));
const DreamVaultPage     = lazy(() => import('@/features/marketplace/ui/DreamVaultPage').then(m => ({ default: m.DreamVaultPage })));
const MarketplacePage    = lazy(() => import('@/features/marketplace/ui/MarketplacePage').then(m => ({ default: m.MarketplacePage })));
const VIPLoungesPage     = lazy(() => import('@/features/marketplace/ui/VIPLoungesPage').then(m => ({ default: m.VIPLoungesPage })));
const DocumentsPage      = lazy(() => import('@/features/account-banking/ui/DocumentsPage').then(m => ({ default: m.DocumentsPage })));
const TaxReportPage      = lazy(() => import('@/features/account-banking/ui/TaxReportPage').then(m => ({ default: m.TaxReportPage })));
const MultiCurrencyPage  = lazy(() => import('@/features/account-banking/ui/MultiCurrencyPage').then(m => ({ default: m.MultiCurrencyPage })));
const ETFsFunds          = lazy(() => import('@/features/wealth-management/ui/ETFsFunds').then(m => ({ default: m.ETFsFunds })));
const FixedIncomeMarket  = lazy(() => import('@/features/wealth-management/ui/FixedIncomeMarket').then(m => ({ default: m.FixedIncomeMarket })));
const GenerationsPage    = lazy(() => import('@/features/family-banking/ui/GenerationsPage').then(m => ({ default: m.GenerationsPage })));
const FaceRegistration   = lazy(() => import('@/features/authentication/ui/FaceRegistrationPage').then(m => ({ default: m.FaceRegistrationPage })));
const EducationPage      = lazy(() => import('@/features/financial-education/ui/EducationPage').then(m => ({ default: m.EducationPage })));
const EmpregosPage       = lazy(() => import('@/features/careers/ui/EmpregosPage').then(m => ({ default: m.EmpregosPage })));
const SustentabilidadePage = lazy(() => import('@/features/sustainability/ui/SustentabilidadePage').then(m => ({ default: m.SustentabilidadePage })));

// ── Guards ───────────────────────────────────────────────────────────────────

const PrivateRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const authenticated = useStore(s => s.isAuthenticated);
  return authenticated ? children : <Navigate to="/login" replace />;
};

function Loading() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-screen bg-[#080d1a]">
      <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// ── Router ───────────────────────────────────────────────────────────────────

import { GlobalErrorBoundary } from '@/app/errors/ErrorBoundary';

// ... importações existentes ...

export const AppRouter: React.FC = () => (
  <GlobalErrorBoundary>
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Public */}
        <Route path="/"           element={<IntroPage />} />
        <Route path="/login"      element={<LoginPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/onboarding/face-registration" element={<FaceRegistration />} />

        {/* Private */}
        <Route path="/home"          element={<PrivateRoute><HomeScreen /></PrivateRoute>} />
        <Route path="/neural-core"   element={<PrivateRoute><NeuralCorePage /></PrivateRoute>} />
        <Route path="/pix"           element={<PrivateRoute><PixPage /></PrivateRoute>} />
        <Route path="/transfer"      element={<PrivateRoute><TransferPage /></PrivateRoute>} />
        <Route path="/cards"         element={<PrivateRoute><CardsPage /></PrivateRoute>} />
        <Route path="/investments"   element={<PrivateRoute><InvestmentTerminal /></PrivateRoute>} />
        <Route path="/fixed-income"  element={<PrivateRoute><FixedIncomeMarket /></PrivateRoute>} />
        <Route path="/etfs-funds"    element={<PrivateRoute><ETFsFunds /></PrivateRoute>} />
        <Route path="/security"      element={<PrivateRoute><SecurityCenterPage /></PrivateRoute>} />
        <Route path="/profile"       element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
        <Route path="/open-finance"  element={<PrivateRoute><OpenFinancePage /></PrivateRoute>} />
        <Route path="/dream-vault"   element={<PrivateRoute><DreamVaultPage /></PrivateRoute>} />
        <Route path="/marketplace"   element={<PrivateRoute><MarketplacePage /></PrivateRoute>} />
        <Route path="/vip-lounges"   element={<PrivateRoute><VIPLoungesPage /></PrivateRoute>} />
        <Route path="/documents"     element={<PrivateRoute><DocumentsPage /></PrivateRoute>} />
        <Route path="/tax-report"    element={<PrivateRoute><TaxReportPage /></PrivateRoute>} />
        <Route path="/multi-currency"element={<PrivateRoute><MultiCurrencyPage /></PrivateRoute>} />
        <Route path="/generations/:type" element={<PrivateRoute><GenerationsPage /></PrivateRoute>} />
        <Route path="/education"     element={<PrivateRoute><EducationPage /></PrivateRoute>} />
        <Route path="/educacao"      element={<PrivateRoute><EducationPage /></PrivateRoute>} />
        <Route path="/careers"       element={<PrivateRoute><EmpregosPage /></PrivateRoute>} />
        <Route path="/empregos"      element={<PrivateRoute><EmpregosPage /></PrivateRoute>} />
        <Route path="/sustainability" element={<PrivateRoute><SustentabilidadePage /></PrivateRoute>} />
        <Route path="/sustentabilidade" element={<PrivateRoute><SustentabilidadePage /></PrivateRoute>} />
        <Route path="/concierge"     element={<PrivateRoute><VIPLoungesPage /></PrivateRoute>} />
        <Route path="/eventos"       element={<PrivateRoute><VIPLoungesPage /></PrivateRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Suspense>
  </GlobalErrorBoundary>
);
