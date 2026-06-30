
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
  const [phase, setPhase] = useState(0); 

  useEffect(() => {
    // Sequence timing
    const timer1 = setTimeout(() => setPhase(1), 500);  // Reveal Card
    const timer2 = setTimeout(() => setPhase(2), 1500); // Expand Rays/Details
    const timer3 = setTimeout(() => setPhase(3), 2500); // Show UI

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div id="screen-intro" className="fixed inset-0 z-[100] bg-[#020617] flex flex-col items-center justify-center overflow-hidden font-sans select-none">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1e3a8a_0%,_#020617_70%,_#000000_100%)] opacity-40"></div>
      
      {/* Grid Overlay */}
      <div className="absolute inset-0 opacity-20" 
           style={{ 
             backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)', 
             backgroundSize: '50px 50px' 
           }}>
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-lg mx-auto p-6">
        
        {/* Skip Intro (Top Right) */}
        <div 
            className={`absolute top-0 right-6 text-[10px] text-gray-500 uppercase tracking-widest cursor-pointer hover:text-white transition-opacity duration-1000 ${phase >= 1 ? 'opacity-100' : 'opacity-0'}`} 
            onClick={onComplete}
        >
             Pular Introdução
        </div>

        {/* CENTRAL SYMBOL */}
        <div className="relative mb-12 mt-10">
             
             {/* Radiating Lines/Dots (Sunburst Effect) */}
             <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none transition-all duration-1000 ease-out ${phase >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                 {/* Radial Lines */}
                 {[...Array(12)].map((_, i) => (
                     <div key={i} className="absolute top-1/2 left-1/2 w-[1px] h-[50%] bg-gradient-to-t from-transparent via-cyan-500/10 to-transparent origin-bottom" style={{ transform: `translateX(-50%) rotate(${i * 30}deg)` }}></div>
                 ))}
                 {/* Orbiting Dots */}
                  {[...Array(8)].map((_, i) => (
                     <div key={i} className="absolute top-1/2 left-1/2 w-1 h-1 bg-cyan-500/50 rounded-full" style={{ transform: `rotate(${i * 45}deg) translateY(-140px)` }}></div>
                 ))}
             </div>

             {/* The Card Device */}
             <div id="intro-card" className={`relative w-40 h-56 rounded-3xl bg-[#0a0f1e] border border-white/10 shadow-2xl flex flex-col items-center justify-center overflow-hidden transition-all duration-1000 transform ${phase >= 1 ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                 
                 {/* Card Texture & Scanline */}
                 <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.03)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%] animate-[shimmer_8s_infinite_linear]"></div>
                 <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                 
                 {/* Grid on Card */}
                 <div className="absolute inset-0 opacity-10" 
                    style={{ 
                        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.2) 1px, transparent 1px)', 
                        backgroundSize: '20px 20px' 
                    }}>
                 </div>

                 {/* Top Status Light */}
                 <div className="absolute top-4 left-4 w-1.5 h-1.5 bg-yellow-500 rounded-full shadow-[0_0_10px_#eab308] animate-pulse"></div>

                 {/* Center Icon Box */}
                 <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(34,211,238,0.3)] relative z-10 mb-4 transform transition-transform duration-700 hover:scale-105">
                     <Zap className="w-8 h-8 text-white fill-white" />
                 </div>

                 {/* Loading/Status Bars */}
                 <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                     <div className={`h-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] transition-all duration-1000 delay-500 ${phase >= 2 ? 'w-[70%]' : 'w-0'}`}></div>
                 </div>
                 <div className="w-10 h-1 bg-white/10 rounded-full mt-2">
                     <div className={`h-full bg-purple-500 shadow-[0_0_10px_#a855f7] transition-all duration-1000 delay-700 ${phase >= 2 ? 'w-[40%]' : 'w-0'}`}></div>
                 </div>
             </div>

             {/* Glow Behind */}
             <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-cyan-500/20 rounded-full blur-[60px] transition-opacity duration-1000 ${phase >= 1 ? 'opacity-100' : 'opacity-0'}`}></div>
        </div>

        {/* TEXT & UI */}
        <div className={`flex flex-col items-center transition-all duration-1000 delay-300 transform ${phase >= 3 ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight text-center">
                Regenera <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Bank</span>
            </h1>
            
            <p className="text-[10px] md:text-xs text-gray-500 font-bold tracking-[0.3em] uppercase mb-8">
                By Regenera Corporate.
            </p>

            {/* Raphaela Badge */}
            <div className="mb-8 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/30 flex items-center gap-2 backdrop-blur-md shadow-[0_0_20px_rgba(8,145,178,0.2)]">
                <Globe className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-widest">Raphaela A.I</span>
            </div>

            {/* Main Button */}
            <button 
                onClick={onComplete}
                className="group relative px-8 py-4 bg-[#0f172a] border border-white/10 rounded-full overflow-hidden hover:border-cyan-500/50 transition-all duration-300 shadow-lg hover:shadow-cyan-500/20 w-64"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <div className="flex items-center justify-center gap-3">
                    <span className="text-sm font-bold text-white tracking-[0.2em] uppercase group-hover:text-cyan-400 transition-colors">
                        Acessar Conta
                    </span>
                    <Play className="w-3 h-3 text-cyan-500 fill-cyan-500" />
                </div>
            </button>

        </div>

      </div>
    </div>
  );
};

export default IntroScreen;
