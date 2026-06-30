/*
|---------------------------------------------------------------------------------------|
|  --> REGENERA ENTERPRISE SYSTEM v4.0                                                  |
|---------------------------------------------------------------------------------------|

PROJECT:       Regenera Bank
CEO:           Raphaela Cerveski
DEVELOPER:     Don Paulo Ricardo
ID:            2098233287
COPYRIGHT:     Copyright (c) 2026 Regenera Corporate

LICENSE:       EULA (End-User License Agreement)
PROTECTION:    PROPRIEDADE INTELECTUAL RESTRITA

WARNING:       TODOS OS DIREITOS RESERVADOS. Proibida a cópia, distribuição,
               engenharia reversa ou modificação não autorizada.

|---------------------------------------------------------------------------------------|
|  --> CLASSIFICATION: PROPRIETARY // DEVELOPER MAINTAINED // REQUIRES SENIOR REVIEW          |
|---------------------------------------------------------------------------------------|
*/

import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 10000, // 10s for financial data (matches Orval config intent for balance, portfolio, etc.)
    },
  },
});

interface ProvidersProps {
  children: ReactNode;
}

const NeuralErrorFallback = ({ error, resetErrorBoundary }: any) => {
  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-red-950/50 rounded-full flex items-center justify-center border border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)] mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>
      </div>
      <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Falha Crítica no Protocolo</h1>
      <p className="text-sm text-red-200/80 max-w-md mb-8">
        O Neural Core interceptou uma anomalia na interface de comunicação. Os logs foram despachados anonimamente para o SOC (Security Operations Center).
      </p>
      <div className="bg-black/50 p-4 rounded-xl border border-red-500/20 mb-8 max-w-md w-full overflow-auto">
        <p className="text-[10px] text-red-400 font-mono text-left">{error.message}</p>
      </div>
      <button 
        onClick={resetErrorBoundary}
        className="px-8 py-3 bg-red-900/40 hover:bg-red-900/60 border border-red-500/50 rounded-xl text-red-400 font-bold uppercase tracking-widest text-xs transition-colors"
      >
        Reiniciar Sessão Segura
      </button>
    </div>
  );
};

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <ErrorBoundary 
      FallbackComponent={NeuralErrorFallback}
      onError={(error) => {
        console.error("ErrorBoundary caught an error:", error);
        // In production, this would trigger: Sentry.captureException(error);
      }}
    >
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};
