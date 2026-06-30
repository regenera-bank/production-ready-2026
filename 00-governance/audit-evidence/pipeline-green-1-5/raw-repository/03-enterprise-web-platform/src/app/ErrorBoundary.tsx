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

import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Global Error Boundary
 * Catch dynamic import failures (chunk loading errors) after new deployments.
 */
export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Detect chunk loading errors and return error state
    if (error.message.includes('Failed to fetch dynamically imported module') || 
        error.message.includes('loading chunk')) {
      return { hasError: true };
    }
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Anomalia Neural detectada:', error, errorInfo);
    
    // Auto-recovery for chunk errors: force a clean reload from the server
    if (error.message.includes('Failed to fetch dynamically imported module') || 
        error.message.includes('loading chunk')) {
      window.location.reload();
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#080d1a] flex flex-col items-center justify-center p-8 text-center font-sans">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
            <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2 uppercase tracking-widest">Sincronizando Protocolos</h2>
          <p className="text-gray-500 text-sm max-w-xs leading-relaxed uppercase tracking-wider">
            Detectamos uma atualização crítica na rede. Recarregando módulos neurais...
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-8 px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white/10 transition-all"
          >
            Reiniciar Manualmente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
