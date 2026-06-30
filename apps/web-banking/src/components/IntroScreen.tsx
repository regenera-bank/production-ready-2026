
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { Zap, Globe, Play } from 'lucide-react';

interface IntroScreenProps {
  onComplete: () => void;
}

const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState(1);

  useEffect(() => {
    const timer2 = setTimeout(() => setPhase(2), 800);
    const timer3 = setTimeout(() => setPhase(3), 1400);
    return () => {
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div id="screen-intro" className="absolute inset-0 z-[100] bg-[#020617] flex flex-col items-center justify-center overflow-hidden font-sans select-none safe-top safe-bottom">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1e3a8a_0%,_#020617_70%,_#000000_100%)] opacity-40"></div>
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(34, 211, 238, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 238, 0.1) 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-lg mx-auto p-6">
        <button
          type="button"
          className="absolute top-[max(1.5rem,env(safe-area-inset-top))] right-6 text-[10px] text-cyan-400/90 uppercase tracking-widest hover:text-white z-20"
          onClick={onComplete}
        >
          Pular → Login
        </button>
        <div className="relative mb-12 mt-10">
             <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none transition-all duration-1000 ease-out ${phase >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                 {[...Array(12)].map((_, i) => (
                     <div key={i} className="absolute top-1/2 left-1/2 w-[1px] h-[50%] bg-gradient-to-t from-transparent via-cyan-500/10 to-transparent origin-bottom" style={{ transform: `translateX(-50%) rotate(${i * 30}deg)` }}></div>
                 ))}
                  {[...Array(8)].map((_, i) => (
                     <div key={i} className="absolute top-1/2 left-1/2 w-1 h-1 bg-cyan-500/50 rounded-full" style={{ transform: `rotate(${i * 45}deg) translateY(-140px)` }}></div>
                 ))}
             </div>
             <div id="intro-card" className="relative w-36 h-52 sm:w-40 sm:h-56 rounded-[2rem] bg-[#090f23] border border-cyan-500/20 shadow-2xl flex flex-col items-center justify-center overflow-hidden transition-all duration-700 transform translate-y-0 opacity-100">
                 <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.03)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%] animate-[shimmer_8s_infinite_linear]"></div>
                 <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                 <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(34,211,238,0.3)] relative z-10 mb-4">
                     <Zap className="w-8 h-8 text-white fill-white" />
                 </div>
                 <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                     <div className={`h-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] transition-all duration-1000 delay-500 ${phase >= 2 ? 'w-[70%]' : 'w-0'}`}></div>
                 </div>
             </div>
        </div>
        <div className={`flex flex-col items-center transition-all duration-700 transform ${phase >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-80'}`}>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight text-center">Regenera <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Bank</span></h1>
            <p className="text-[10px] md:text-xs text-gray-500 font-bold tracking-[0.3em] uppercase mb-8">By Regenera Corporate.</p>
            <div className="mb-8 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/30 flex items-center gap-2 backdrop-blur-md">
                <Globe className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-widest">Raphaela A.I</span>
            </div>
            <button onClick={onComplete} className="group relative px-8 py-4 bg-[#0f172a] border border-white/10 rounded-full overflow-hidden hover:border-cyan-500/50 transition-all duration-300 shadow-lg w-64">
                <div className="flex items-center justify-center gap-3">
                    <span className="text-sm font-bold text-white tracking-[0.2em] uppercase group-hover:text-cyan-400 transition-colors">Acessar Conta</span>
                    <Play className="w-3 h-3 text-cyan-500 fill-cyan-500" />
                </div>
            </button>
        </div>
      </div>
    </div>
  );
};

export default IntroScreen;