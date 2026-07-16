import React from 'react';
import { CheckCircle } from 'lucide-react';

interface AuthSuccessOverlayProps {
  message: string;
}

const AuthSuccessOverlay: React.FC<AuthSuccessOverlayProps> = ({ message }) => (
  <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-bg-deep/92 backdrop-blur-md animate-in fade-in duration-300">
    <div className="relative mb-6">
      <div className="absolute inset-0 rounded-full bg-cyan-500/20 animate-ping [animation-duration:1.5s]" />
      <div className="relative w-20 h-20 rounded-full border border-cyan-500/40 bg-cyan-950/40 flex items-center justify-center">
        <CheckCircle className="w-10 h-10 text-cyan-400" />
      </div>
    </div>
    <p className="text-sm font-bold uppercase tracking-[0.25em] text-white text-center px-6">
      {message}
    </p>
    <p className="text-[9px] font-mono text-gray-500 uppercase tracking-[0.3em] mt-3">
      Entrando no terminal…
    </p>
  </div>
);

export default AuthSuccessOverlay;