
import React, { useEffect, useState } from 'react';
import { AppRouter } from '@/app/navigation/AppRouter';
import { useStore } from '@/foundation/store';
import { AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { api } from '@/platform/http/api-client';
import { io, Socket } from 'socket.io-client';

const RootAppContent: React.FC = () => {
  const toast = useStore((state: any) => state.toast);
  const { setAuthenticated, setUser, isAuthenticated } = useStore();
  const [isHydrating, setIsHydrating] = useState(true);

  // Hidratação de autenticação robusta (Fase 1)
  useEffect(() => {
    const hydrate = async () => {
      const token = sessionStorage.getItem('neural_token');

      if (!token) {
        setIsHydrating(false);
        return;
      }

      try {
        // Valida o token chamando /auth/me
        const user = await api.url('/auth/me').get().json<any>();
        
        if (user) {
          setUser(user);
          setAuthenticated(true);
        } else {
          sessionStorage.removeItem('neural_token');
          setAuthenticated(false);
        }
      } catch (error) {
        console.warn('[Auth] Falha na hidratação. Token inválido.');
        sessionStorage.removeItem('neural_token');
        setAuthenticated(false);
      } finally {
        setIsHydrating(false);
      }
    };

    hydrate();
  }, [setAuthenticated, setUser]);

  // Real-time Pix listener via Socket.IO (same pattern as InvestmentTerminal for /market-data)
  // Connects to /pix-events namespace and listens for PIX_RECEIVED to update balance live.
  // Backend PixEventsGateway broadcasts on 'PIX_RECEIVED' when PixService publishes.
  useEffect(() => {
    let pixSocket: Socket | undefined;

    if (isAuthenticated) {
      const pixWsUrl = (import.meta as any).env['VITE_PIX_WS_URL'] || 'https://regenera-core-api-520859662036.southamerica-east1.run.app';
      // Connect to the exact namespace used by PixEventsGateway for reliable PIX_RECEIVED delivery
      pixSocket = io(`${pixWsUrl}/pix-events`);

      pixSocket.on('connect', () => {
        console.log('Connected to Regenera Pix Events Stream');
      });

      pixSocket.on('PIX_RECEIVED', (data: { amount: number; from?: string; timestamp?: string }) => {
        console.log('Real-time PIX received:', data);
        const { updateBalanceCents } = useStore.getState();
        if (data.amount) {
          // Convert incoming float amount (from backend) to cents
          updateBalanceCents(Math.round(data.amount * 100));
        }
      });

      // Also listen to generic if used
      pixSocket.on('pix_event', (event: { type: string; payload: any }) => {
        if (event.type === 'PIX_RECEIVED' && event.payload?.amount) {
          const { updateBalanceCents } = useStore.getState();
          updateBalanceCents(Math.round(event.payload.amount * 100));
        }
      });
    }

    return () => {
      if (pixSocket) {
        pixSocket.disconnect();
      }
    };
  }, [isAuthenticated]);

  // Enquanto hidrata, podemos mostrar um loader sutil (opcional)
  if (isHydrating) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-cyan-500/30 font-sans antialiased selection:text-white">
      <AppRouter />

      {toast && (
        <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 backdrop-blur-xl border px-6 py-4 rounded-3xl flex items-center gap-4 z-[9999] shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in duration-300 ${
          toast.type === 'alert' ? 'bg-red-950/90 border-red-500/50 text-red-100 shadow-red-500/10' :
          toast.type === 'security' ? 'bg-amber-950/90 border-amber-500/50 text-amber-100 shadow-amber-500/10' :
          'bg-emerald-950/90 border-emerald-500/50 text-emerald-100 shadow-emerald-500/10'
        }`}>
          {toast.type === 'alert' && <AlertTriangle className="w-5 h-5 text-red-400" />}
          {toast.type === 'security' && <ShieldCheck className="w-5 h-5 text-amber-400" />}
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          
          <span className="text-sm font-semibold tracking-wide">{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return <RootAppContent />;
}
