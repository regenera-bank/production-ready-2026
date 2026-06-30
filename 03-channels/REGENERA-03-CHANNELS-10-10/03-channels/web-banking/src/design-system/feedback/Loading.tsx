
import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  status?: string;
  fullScreen?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({ status = 'Sincronizando...', fullScreen = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full border-2 border-cyan-500/20 border-t-cyan-500 animate-spin" />
        <Loader2 className="absolute inset-0 m-auto w-6 h-6 text-cyan-400 animate-pulse" />
      </div>
      <p className="text-[10px] text-cyan-400 font-black tracking-[0.3em] uppercase animate-pulse">
        {status}
      </p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#020617]/90 backdrop-blur-md flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};
