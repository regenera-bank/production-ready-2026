import React, { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';

const LINES = [
  'Restaurando sessão criptografada',
  'Validando credenciais com o BFF',
  'Sincronizando jornada multicanal',
] as const;

const SessionBootstrapScreen: React.FC = () => {
  const [line, setLine] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setLine((prev) => (prev + 1) % LINES.length);
    }, 1200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-bg-deep overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1e3a8a_0%,_#020617_70%,_#000000_100%)] opacity-35" />
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(34, 211, 238, 0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 238, 0.12) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="relative z-10 flex flex-col items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-[0_0_32px_rgba(34,211,238,0.35)]">
          <Zap className="w-7 h-7 text-white fill-white animate-pulse" />
        </div>
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-cyan-400/90 mb-2">
            Regenera Bank
          </p>
          <p className="text-xs text-gray-400 uppercase tracking-widest min-h-[1rem] transition-opacity duration-300">
            {LINES[line]}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SessionBootstrapScreen;