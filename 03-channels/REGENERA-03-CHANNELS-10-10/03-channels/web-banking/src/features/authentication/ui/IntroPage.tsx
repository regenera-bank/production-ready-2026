
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const IntroPage: React.FC = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    // Cleaned timers (per ações imediatas / prior "remova setTimeout spinners").
    // Phases now advance immediately on mount for real feel (no artificial 500/1500/2500ms fiction).
    // Visual reveals use CSS transition duration instead of JS timers.
    setPhase(3); // all elements visible right away; PULAR and logo use opacity transitions
  }, []);

  return (
    <div className="min-h-screen bg-[#0d0d1f] flex flex-col items-center justify-center overflow-hidden relative" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#001824_0%,#0d0d1f_70%,#000000_100%)]" />

      {/* PULAR INTRODUÇÃO per design */}
      <button 
        onClick={() => navigate('/login')} 
        className={`absolute top-6 right-6 text-[11px] text-[#00ffff80] uppercase tracking-[2px] cursor-pointer hover:text-[#00ffff] transition-all ${phase >= 1 ? 'opacity-100' : 'opacity-0'}`}
      >
        PULAR INTRODUÇÃO
      </button>

      <div className="relative z-10 flex flex-col items-center max-w-[320px] mx-auto px-6">
        {/* Logo area exact: small REGENERA, hexagon R, title, byline, RAPHAELA A.I. badge */}
        <div className={`transition-all duration-700 ${phase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="text-[#00ffff80] text-[11px] tracking-[3px] font-bold mb-1 text-center">REGENERA</div>
          <div className="text-[#00ffff40] text-[9px] tracking-[2px] font-bold mb-3 text-center">CORPORATE · BANK</div>

          {/* Hexagon icon exact from SVG */}
          <div className="flex justify-center mb-3">
            <svg width="68" height="68" viewBox="0 0 120 110" className="drop-shadow-[0_0_20px_rgba(0,255,255,0.3)]">
              <polygon points="60,8 95,28 95,68 60,88 25,68 25,28" fill="none" stroke="#00ffff" strokeWidth="2.5"/>
              <polygon points="60,20 82,33 82,58 60,70 38,58 38,33" fill="#00ffff10" stroke="#00ffff60" strokeWidth="1"/>
              <text x="60" y="52" textAnchor="middle" fill="#00ffff" fontSize="28" fontWeight="700" fontFamily="sans-serif">R</text>
            </svg>
          </div>

          <div className="text-center mb-1">
            <div className="text-white text-[22px] font-light tracking-[0.5px]">Regenera Bank</div>
            <div className="text-[#00ffff60] text-[10px] tracking-[1.5px] font-medium">by Regenera Corporate</div>
          </div>

          {/* RAPHAELA A.I. badge exact */}
          <div className="mt-3 flex justify-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full border border-[#00ffff40] bg-[#00ffff15]">
              <span className="text-[#00ffff] text-[10px] font-bold tracking-[1px]">RAPHAELA A.I.</span>
            </div>
          </div>
        </div>

        {/* CTA exact "ACESSAR CONTA ▶" cyan glow */}
        <div className={`mt-10 w-full transition-all duration-700 ${phase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <button
            onClick={() => navigate('/login')}
            className="w-full h-11 rounded-full bg-[#00ffff] text-[#001824] font-bold tracking-[1.5px] text-sm shadow-[0_0_30px_rgba(0,255,255,0.6)] active:scale-[0.985] transition-all flex items-center justify-center gap-2"
          >
            ACESSAR CONTA →
          </button>
        </div>

        {/* subtle footer */}
        <div className="mt-8 text-[#ffffff20] text-[9px] tracking-[1px]">ENTERPRISE v4.0 · SECURE</div>
      </div>

      {/* decorative scan lines subtle */}
      <div className="absolute inset-x-0 top-[38%] h-px bg-[#00ffff10]" />
      <div className="absolute inset-x-0 top-[42%] h-px bg-[#00ffff08]" />
    </div>
  );
};
