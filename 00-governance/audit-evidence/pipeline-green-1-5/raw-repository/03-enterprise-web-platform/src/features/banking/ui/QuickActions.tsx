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

export const QuickActions: React.FC = () => {
  const actions = [
    { label: 'Payments', icon: '📄' },
    { label: 'Cards', icon: '💳' },
    { label: 'Invest', icon: '📈' },
    { label: 'Support', icon: '🎧' },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {actions.map(action => (
        <button key={action.label} className="flex flex-col items-center gap-2 p-4 bg-slate-800/30 hover:bg-slate-800/60 rounded-xl transition-all border border-slate-700/50 group">
          <span className="text-2xl group-hover:scale-110 transition-transform">{action.icon}</span>
          <span className="text-xs text-slate-300">{action.label}</span>
        </button>
      ))}
    </div>
  );
};