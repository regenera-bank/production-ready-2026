/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useState, useRef } from 'react';
import { Mic, BrainCircuit, Waves, Settings, Sparkles } from 'lucide-react';
import { OrbTheme } from '../../types';

interface RaphaelaOrbProps {
  isListening: boolean;
  isThinking: boolean;
  isSpeaking: boolean;
  onClick: () => void;
  theme?: OrbTheme;
  onThemeCycle?: () => void;
}

// --- COMPLEX SACRED GEOMETRY COMPONENT ---
const SacredGeometry = ({ color, animate = false }: { color: string, animate?: boolean }) => (
    <svg viewBox="0 0 200 200" className={`w-full h-full absolute inset-0 pointer-events-none opacity-60 ${animate ? 'animate-[spin_60s_linear_infinite]' : ''}`}>
        <defs>
            <filter id="glow-geo" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
        </defs>
        <g stroke={color} strokeWidth="0.5" fill="none" filter="url(#glow-geo)" transform="translate(100, 100)">
             {/* Outer Circles */}
            <circle r="98" className="opacity-30" strokeDasharray="4 4" />
            <circle r="85" className="opacity-50" />
            
            {/* Hexagram (Star of David) Construction */}
            <g className={animate ? 'animate-[spin_20s_linear_infinite_reverse]' : ''}>
                <polygon points="0,-85 73.6,42.5 -73.6,42.5" className="opacity-80" />
                <polygon points="0,85 -73.6,-42.5 73.6,-42.5" className="opacity-80" />
            </g>

            {/* Inner Hexagon connections */}
            <g className={animate ? 'animate-[spin_10s_linear_infinite]' : ''}>
                <line x1="0" y1="-85" x2="0" y2="85" className="opacity-30" />
                <line x1="-73.6" y1="-42.5" x2="73.6" y2="42.5" className="opacity-30" />
                <line x1="-73.6" y1="42.5" x2="73.6" y2="-42.5" className="opacity-30" />
            </g>
        </g>
    </svg>
);

const RaphaelaOrb: React.FC<RaphaelaOrbProps> = ({ isListening, isThinking, isSpeaking, onClick, theme = 'cyan', onThemeCycle }) => {
  const [orbState, setOrbState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse Parallax Logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        setMousePos({ 
            x: (e.clientX - window.innerWidth / 2) / 25, 
            y: (e.clientY - window.innerHeight / 2) / 25 
        });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Theme Config Maps - NEON/CYBERPUNK AESTHETIC
  const themeColors = {
      cyan: {
          hex: '#22d3ee',
          glow: 'shadow-[0_0_60px_rgba(34,211,238,0.6)]',
          border: 'border-cyan-400',
          text: 'text-cyan-400',
          coreGradient: 'from-blue-900 via-slate-950 to-black',
      },
      purple: { 
          hex: '#a855f7',
          glow: 'shadow-[0_0_60px_rgba(168,85,247,0.6)]',
          border: 'border-purple-400',
          text: 'text-purple-400',
          coreGradient: 'from-purple-900 via-slate-950 to-black',
      },
      emerald: { 
          hex: '#10b981',
          glow: 'shadow-[0_0_60px_rgba(16,185,129,0.6)]',
          border: 'border-emerald-400',
          text: 'text-emerald-400',
          coreGradient: 'from-emerald-900 via-slate-950 to-black',
      },
      amber: { 
          hex: '#f59e0b',
          glow: 'shadow-[0_0_60px_rgba(245,158,11,0.6)]',
          border: 'border-amber-400',
          text: 'text-amber-400',
          coreGradient: 'from-amber-900 via-slate-950 to-black',
      },
      crimson: { 
          hex: '#f43f5e',
          glow: 'shadow-[0_0_60px_rgba(244,63,94,0.6)]',
          border: 'border-rose-400',
          text: 'text-rose-400',
          coreGradient: 'from-red-900 via-slate-950 to-black',
      }
  };

  const activeTheme = themeColors[theme] || themeColors.cyan;

  useEffect(() => {
    if (isThinking) setOrbState('thinking');
    else if (isSpeaking) setOrbState('speaking');
    else if (isListening) setOrbState('listening');
    else setOrbState('idle');
  }, [isListening, isThinking, isSpeaking]);

  return (
    <div 
        ref={containerRef}
        className="relative flex flex-col items-center gap-6 z-[60]"
        style={{ perspective: '1200px' }}
    >
      
      {/* 1. STATUS LABEL (Floating above) */}
      <div 
        className={`pointer-events-auto transition-all duration-700 transform absolute bottom-24 ${orbState !== 'idle' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
        style={{ transform: `translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px)` }}
      >
         <div className="bg-black/60 backdrop-blur-2xl border border-white/10 px-4 py-1.5 rounded-full shadow-2xl flex items-center gap-3 whitespace-nowrap">
            <span className={`text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 ${activeTheme.text} drop-shadow-[0_0_8px_currentColor]`}>
               {orbState === 'listening' && <><Mic className="w-3 h-3 animate-pulse" /> Ouvindo...</>}
               {orbState === 'thinking' && <><BrainCircuit className="w-3 h-3 animate-spin" /> PROCESSANDO</>}
               {orbState === 'speaking' && <><Waves className="w-3 h-3" /> Raphaela Core</>}
            </span>
            {/* Mini Visualizer */}
            <div className="flex items-center gap-0.5 h-3">
                 {[1,2,3,4].map(i => (
                     <div key={i} className={`w-0.5 bg-current rounded-full ${activeTheme.text} animate-[music_1s_ease-in-out_infinite]`} style={{ height: '100%', animationDelay: `${i*0.1}s`, animationPlayState: orbState !== 'idle' ? 'running' : 'paused' }}></div>
                 ))}
            </div>
         </div>
      </div>

      {/* 2. MAIN ORB ASSEMBLY */}
      <div 
        className="relative w-16 h-16 flex items-center justify-center pointer-events-auto cursor-pointer group animate-[float_4s_ease-in-out_infinite]"
        onClick={onClick}
      >
          {/* A. SATELLITE (Theme Cycle / Settings Gear) */}
          <button 
              onClick={(e) => { e.stopPropagation(); onThemeCycle?.(); }}
              className={`absolute -top-1 -right-1 z-50 p-1 rounded-full bg-black/70 border border-white/10 hover:border-primary/50 transition-all duration-300 group/gear hover:scale-110 shadow-lg`}
              style={{ 
                  transform: `translate(${mousePos.x * 1.2}px, ${mousePos.y * 1.2}px)`
              }}
              aria-label="Change Theme"
          >
              <Settings className={`w-2.5 h-2.5 group-hover/gear:rotate-180 transition-transform duration-700 ${activeTheme.text}`} />
          </button>

          {/* B. SACRED GEOMETRY (Background Layer) */}
          <div 
            className="absolute inset-[-40%] transition-transform duration-200 ease-out opacity-80"
            style={{ transform: `translate(${mousePos.x * -0.5}px, ${mousePos.y * -0.5}px) rotateX(${mousePos.y}deg) rotateY(${mousePos.x}deg)` }}
          >
             <SacredGeometry color={activeTheme.hex} animate={true} />
          </div>

          {/* C. PARTICLE SPHERE AND HOVER RINGS */}
          <div 
            className="absolute inset-0 rounded-full transition-transform duration-200"
            style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }}
          >
                {/* Ring 1 - Vertical Spin */}
                <div className={`absolute inset-0 rounded-full border-[1px] ${activeTheme.border} border-dashed opacity-40 animate-[spin_8s_linear_infinite]`} style={{ transform: 'rotateX(70deg)' }}></div>
                {/* Ring 2 - Horizontal Spin */}
                <div className={`absolute inset-1 rounded-full border-[1px] border-white/30 border-dotted opacity-30 animate-[spin_12s_linear_infinite_reverse]`}></div>
                {/* Ring 3 - Tilted */}
                <div className={`absolute inset-[-5px] rounded-full border-[1px] ${activeTheme.border} border-dotted opacity-20 animate-[spin_15s_linear_infinite]`} style={{ transform: 'rotateX(45deg) rotateY(45deg)' }}></div>
                
                {/* Outer Glow Halo */}
                <div className={`absolute inset-2 rounded-full bg-current opacity-15 blur-xl animate-pulse ${activeTheme.text}`}></div>
          </div>

          {/* D. THE CORE - RE-DESIGNED TO REMOVE THE LETTER 'R' & INTRODUCE FUTURISTIC ABSTRACT ENERGY CORE */}
          <div 
            className={`relative w-11 h-10 rounded-full flex items-center justify-center overflow-hidden backdrop-blur-xl border border-white/20 transition-all duration-500 ${activeTheme.glow}`}
            style={{ 
                transform: `translate(${mousePos.x * 0.2}px, ${mousePos.y * 0.2}px) scale(${orbState !== 'idle' ? 1.15 : 1})`,
                boxShadow: `inset 0 0 20px rgba(0,0,0,0.85), 0 0 30px ${activeTheme.hex}40`
            }}
          >
              {/* Liquid Core Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${activeTheme.coreGradient} opacity-95 animate-[pulse_4s_ease-in-out_infinite]`}></div>
              
              {/* Noise Overlay for organic/glassy texture */}
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-overlay"></div>
              
              {/* Shine/Reflection Overlay */}
              <div className="absolute -top-6 -left-6 w-20 h-20 bg-white/15 rounded-full blur-md transform rotate-45"></div>

              {/* GIF ORBIT CENTER */}
              <div className="relative z-20 flex items-center justify-center w-full h-full rounded-full overflow-hidden">
                  <img src="https://i.pinimg.com/originals/44/a5/2c/44a52caf835ad2d687e4d67ec8016632.gif" alt="Orbit Center" className="w-full h-full object-cover mix-blend-screen" />
              </div>
          </div>

          {/* E. STATE EFFECTS (Shockwaves) */}
          {orbState !== 'idle' && (
             <>
                <div className={`absolute inset-0 rounded-full border ${activeTheme.border} opacity-0 animate-[ping_1.5s_ease-in-out_infinite]`}></div>
                <div className="absolute inset-[-10px] rounded-full border border-dashed border-white/20 opacity-0 animate-[ping_2s_ease-in-out_infinite_delay]"></div>
             </>
          )}

      </div>
    </div>
  );
};

export default RaphaelaOrb;
