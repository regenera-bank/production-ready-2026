import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
}

/**
 * GlobalHeader Component
 * Implements precise alignment based on 8px grid system.
 * Uses Framer Motion for neural-state transitions.
 */
export const Header: React.FC<HeaderProps> = ({ title, showBack = true }) => {
  const navigate = useNavigate();

  return (
    <motion.header 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 w-full bg-[#080d1a]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between"
    >
      <div className="flex items-center gap-4">
        {showBack && (
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center active:scale-90 transition-all group"
          >
            <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition-colors" />
          </button>
        )}
        {title && (
          <h1 className="text-sm font-bold text-white uppercase tracking-[0.2em]">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
        <Shield className="w-3 h-3 text-emerald-400" />
        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Secure</span>
      </div>
    </motion.header>
  );
};
