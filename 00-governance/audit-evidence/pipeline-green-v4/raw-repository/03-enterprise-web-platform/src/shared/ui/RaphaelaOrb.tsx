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

import React, { useEffect, useState, useRef } from 'react';
import { Mic, BrainCircuit, Waves, Settings, Sparkles } from 'lucide-react';

// --- COMPLEX SACRED GEOMETRY COMPONENT ---
const SacredGeometry: React.FC<{ color: string; animate?: boolean }> = ({ color, animate = false }) => (
  <svg
    viewBox="0 0 200 200"
    className={`w-full h-full absolute inset-0 pointer-events-none opacity-60 ${
      animate ? 'animate-[spin_60s_linear_infinite]' : ''
    }`}
  >
    <defs>
      <filter id="glow-geo" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <g
      stroke={color}
      strokeWidth="0.5"
      fill="none"
      filter="url(#glow-geo)"
      transform="translate(100, 100)"
    >
      <circle r="98" className="opacity-30" strokeDasharray="4 4" />
      <circle r="85" className="opacity-50" />
      <g className={animate ? 'animate-[spin_20s_linear_infinite_reverse]' : ''}>
        <polygon points="0,-85 73.6,42.5 -73.6,42.5" className="opacity-80" />
        <polygon points="0,85 -73.6,-42.5 73.6,-42.5" className="opacity-80" />
      </g>
      <g className={animate ? 'animate-[spin_10s_linear_infinite]' : ''}>
        <line x1="0" y1="-85" x2="0" y2="85" className="opacity-30" />
        <line x1="-73.6" y1="-42.5" x2="73.6" y2="42.5" className="opacity-30" />
        <line x1="-73.6" y1="42.5" x2="73.6" y2="-42.5" className="opacity-30" />
        <circle r="42.5" className="opacity-60" />
      </g>
      <g transform="rotate(30)">
        <rect x="-30" y="-30" width="60" height="60" className="opacity-40" />
      </g>
    </g>
  </svg>
);

interface RaphaelaOrbProps {
  isListening: boolean;
  isThinking: boolean;
  isSpeaking: boolean;
  onClick: () => void;
  theme?: 'cyan' | 'purple' | 'emerald' | 'amber' | 'crimson';
  onThemeCycle?: () => void;
}

export const RaphaelaOrb: React.FC<RaphaelaOrbProps> = ({
  isListening,
  isThinking,
  isSpeaking,
  onClick,
  theme = 'cyan',
  onThemeCycle,
}) => {
  const [orbState, setOrbState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse Parallax Logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX - window.innerWidth / 2) / 25,
        y: (e.clientY - window.innerHeight / 2) / 25,
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
    },
  };

  const activeTheme = themeColors[theme] || themeColors.cyan;

  useEffect(() => {
    if (isThinking) setOrbState('thinking');
    else if (isSpeaking) setOrbState('speaking');
    else if (isListening) setOrbState('listening');
    else setOrbState('idle');
  }, [isListening, isThinking, isSpeaking]);

  const handleInteraction = () => {
    if (navigator.vibrate) navigator.vibrate(20);
    onClick();
  };

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center gap-6 z-[60]"
      style={{ perspective: '1200px' }}
    >
      {/* Dynamic Status Indicator Overlay */}
      <div
        className={`pointer-events-auto transition-all duration-700 transform absolute bottom-24 ${
          orbState !== 'idle' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5 pointer-events-none'
        }`}
        style={{ transform: `translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px)` }}
      >
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 px-4 py-1.5 rounded-full shadow-2xl flex items-center gap-3 whitespace-nowrap">
          <span
            className={`text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 ${activeTheme.text} drop-shadow-[0_0_8px_currentColor]`}
          >
            {orbState === 'listening' && (
              <>
                <Mic className="w-3 h-3 animate-pulse" /> Listening
              </>
            )}
            {orbState === 'thinking' && (
              <>
                <BrainCircuit className="w-3 h-3 animate-spin" /> QUANTUM PROCESSING
              </>
            )}
            {orbState === 'speaking' && (
              <>
                <Waves className="w-3 h-3 animate-pulse" /> Raphaela Core
              </>
            )}
          </span>
          <div className="flex items-center gap-0.5 h-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`w-0.5 bg-current rounded-full ${activeTheme.text} animate-[music_1s_ease-in-out_infinite]`}
                style={{
                  height: '100%',
                  animationDelay: `${i * 0.1}s`,
                  animationPlayState: orbState !== 'idle' ? 'running' : 'paused',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Interactive Orb */}
      <div
        className="relative w-16 h-16 flex items-center justify-center pointer-events-auto cursor-pointer group"
        onClick={handleInteraction}
        title="Ativar Raphaela AI"
      >
        {/* Settings gear to cycle themes */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (navigator.vibrate) navigator.vibrate(10);
            onThemeCycle?.();
          }}
          className="absolute top-0 right-0 z-50 p-1 rounded-full bg-black/60 border border-white/20 hover:bg-white/10 backdrop-blur-md text-white/50 hover:text-white transition-all duration-300 group/gear hover:scale-110 shadow-lg"
          style={{
            transform: `translate(${mousePos.x * 1.2}px, ${mousePos.y * 1.2}px) rotate(0deg)`,
          }}
          aria-label="Change Theme"
        >
          <Settings className={`w-2.5 h-2.5 transition-transform duration-700 ${activeTheme.text}`} />
        </button>

        {/* Sacred Geometry Background layer */}
        <div
          className="absolute inset-[-40%] transition-transform duration-200 ease-out opacity-80"
          style={{
            transform: `translate(${mousePos.x * -0.5}px, ${mousePos.y * -0.5}px) rotateX(${mousePos.y}deg) rotateY(${mousePos.x}deg)`,
          }}
        >
          <SacredGeometry color={activeTheme.hex} animate={orbState !== 'idle'} />
        </div>

        {/* Rings */}
        <div
          className="absolute inset-0 rounded-full transition-transform duration-200"
          style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }}
        >
          <div
            className={`absolute inset-0 rounded-full border-[1px] ${activeTheme.border} border-dashed opacity-40 animate-[spin_8s_linear_infinite]`}
            style={{ transform: 'rotateX(70deg)' }}
          />
          <div className="absolute inset-1 rounded-full border-[1px] border-white/30 border-dotted opacity-30 animate-[spin_12s_linear_infinite_reverse]" />
          <div
            className={`absolute inset-[-5px] rounded-full border-[1px] ${activeTheme.border} border-dotted opacity-20 animate-[spin_15s_linear_infinite]`}
            style={{ transform: 'rotateX(45deg) rotateY(45deg)' }}
          />
          <div className={`absolute inset-2 rounded-full bg-current opacity-10 blur-xl animate-pulse ${activeTheme.text}`} />
        </div>

        {/* Sphere Core */}
        <div
          className={`relative w-10 h-10 rounded-full flex items-center justify-center overflow-hidden backdrop-blur-sm border border-white/20 transition-all duration-500 ${activeTheme.glow}`}
          style={{
            transform: `translate(${mousePos.x * 0.2}px, ${mousePos.y * 0.2}px) scale(${orbState !== 'idle' ? 1.15 : 1})`,
            boxShadow: `inset 0 0 20px rgba(0,0,0,0.8), 0 0 30px ${activeTheme.hex}20`,
          }}
        >
          <div
            className={`absolute inset-0 bg-gradient-to-br ${activeTheme.coreGradient} opacity-90 mix-blend-normal`}
          />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40 mix-blend-overlay" />
          <div className="absolute -top-6 -left-6 w-20 h-20 bg-white/10 rounded-full blur-xl transform rotate-45" />

          {/* Core Emblem */}
          <div className="relative z-20">
            {orbState === 'thinking' ? (
              <div className="relative">
                <Sparkles className="w-4 h-4 text-white animate-spin drop-shadow-[0_0_10px_white]" />
                <div className="absolute inset-0 animate-ping opacity-50 bg-white rounded-full" />
              </div>
            ) : (
              <span
                className={`text-xl font-serif font-bold italic drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] relative z-10 ${activeTheme.text}`}
                style={{ fontFamily: '"Playfair Display", serif' }}
              >
                R
                <span className={`absolute inset-0 blur-sm opacity-80 ${activeTheme.text}`}>R</span>
              </span>
            )}
          </div>
        </div>

        {/* Pulse Waves */}
        {orbState !== 'idle' && (
          <>
            <div className={`absolute inset-0 rounded-full border ${activeTheme.border} opacity-0 animate-ping`} style={{ animationDuration: '1.5s' }} />
            <div className="absolute inset-[-10px] rounded-full border border-white/20 opacity-0 animate-ping" style={{ animationDuration: '2s', animationDelay: '300ms' }} />
          </>
        )}
      </div>
    </div>
  );
};
