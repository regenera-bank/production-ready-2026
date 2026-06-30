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

/**
 * REGENERA BANK · ENTERPRISE v4.0
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
import { useStore } from '../lib/store';

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