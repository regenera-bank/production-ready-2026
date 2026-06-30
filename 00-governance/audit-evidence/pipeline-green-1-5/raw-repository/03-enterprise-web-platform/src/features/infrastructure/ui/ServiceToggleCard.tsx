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

import React, { useState } from 'react';

export const ServiceToggleCard: React.FC<{ name: string; status: string; region: string }> = ({ name, status, region }) => {
  const [active, setActive] = useState(status === 'active' || status === 'RUNNING' || status === 'healthy' || status === 'online');
  return (
    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 hover:border-slate-600 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-slate-100">{name}</h3>
          <p className="text-[10px] text-slate-500 font-mono mt-1">{region.toUpperCase()}</p>
        </div>
        <div className={`w-2 h-2 rounded-full ${active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
        <span className="text-xs text-slate-400">Node Status</span>
        <button 
          onClick={() => setActive(!active)}
          className={`relative w-10 h-5 rounded-full transition-colors ${active ? 'bg-cyan-600' : 'bg-slate-600'}`}
        >
          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${active ? 'left-6' : 'left-1'}`} />
        </button>
      </div>
    </div>
  );
};