import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg-deep flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-white/5 border border-red-500/20 rounded-[3rem] p-10 text-center backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-4 tracking-tight">Interface Neural Comprometida</h1>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
              Detectamos uma anomalia crítica no núcleo do sistema. A Raphaela está tentando restaurar a integridade dos dados.
            </p>
            <div className="bg-black/40 rounded-2xl p-4 mb-8 text-left border border-white/5">
              <p className="text-[10px] font-mono text-red-400 uppercase tracking-widest mb-2 font-bold">Log de Erro:</p>
              <p className="text-xs font-mono text-gray-500 break-words">
                {this.state.error?.message || 'Erro desconhecido'}
              </p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-3 hover:bg-white hover:text-primary transition-all active:scale-95 shadow-lg shadow-primary/20"
            >
              <RefreshCcw className="w-4 h-4" />
              Reiniciar Núcleo
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
