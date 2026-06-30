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

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Shield, Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '../lib/store';

interface HeaderNavigationProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightContent?: React.ReactNode;
}

/**
 * HeaderNavigation - Global top navigation for private screens.
 * Provides consistent Back button (Nielsen Heuristic: User Control & Freedom).
 * Injected into AppLayout for all screens using the layout.
 * Mathematically aligned with 8px grid, cyberpunk enterprise aesthetics.
 */
export const HeaderNavigation: React.FC<HeaderNavigationProps> = ({
  title,
  showBack = true,
  onBack,
  rightContent,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleSidebar } = useStore();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      // Smart back: prefer -1, but never leave the app shell for public
      if (location.pathname === '/home') {
        return;
      }
      navigate(-1);
    }
  };

  // Derive a fallback title from path for consistency when not provided
  const derivedTitle = title || (() => {
    const path = location.pathname.replace('/', '');
    if (path.includes('pix')) return 'Área PIX';
    if (path.includes('invest')) return 'Investimentos';
    if (path.includes('cloud')) return 'Regenera Cloud';
    if (path.includes('generations')) return 'Contas Gerações';
    if (path.includes('cards')) return 'Carteira Digital';
    if (path.includes('transfer')) return 'Transferências';
    if (path.includes('profile')) return 'Perfil';
    if (path.includes('security')) return 'Centro de Segurança';
    if (path.includes('open-finance')) return 'Open Finance';
    return 'Regenera';
  })();

  const isHome = location.pathname === '/home';

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 w-full bg-[#080d1a]/95 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center justify-between"
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => toggleSidebar()}
          className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center active:scale-90 transition-all group flex-shrink-0"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition-colors" />
        </button>
        {showBack && !isHome && (
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center active:scale-90 transition-all group flex-shrink-0"
            aria-label="Voltar"
          >
            <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition-colors" />
          </button>
        )}
        <h1 className="text-sm font-bold text-white uppercase tracking-[0.2em] truncate">
          {derivedTitle}
        </h1>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {rightContent ? (
          rightContent
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <Shield className="w-3 h-3 text-emerald-400" />
            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Secure</span>
          </div>
        )}
      </div>
    </motion.header>
  );
};
