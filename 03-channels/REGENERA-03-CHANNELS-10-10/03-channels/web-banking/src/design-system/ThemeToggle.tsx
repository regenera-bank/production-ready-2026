/**
 * REGENERA BANK
 * Module: ThemeToggle
 *
 * Purpose:
 * Componente de alternância entre temas (AppTheme) com persistência.
 *
 * Developer Signature:
 * Author : Paulo Ricardo de Leão <RG-2098233287>
 *
 * License: UNLICENSED
 */

import React from 'react';
import { useStore } from '@/foundation/store';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useStore();

  const toggleTheme = () => {
    setTheme(theme === 'cyan' ? 'purple' : 'cyan');
  };

  return (
    <button
      onClick={toggleTheme}
      className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors text-white text-sm font-bold"
    >
      {theme === 'cyan' ? '💜 Purple Theme' : '🩵 Cyan Theme'}
    </button>
  );
};