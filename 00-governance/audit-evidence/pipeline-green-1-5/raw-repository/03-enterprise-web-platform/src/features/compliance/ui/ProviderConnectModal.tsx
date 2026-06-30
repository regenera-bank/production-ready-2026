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

export const ProviderConnectModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl p-10 shadow-2xl">
        <h3 className="text-2xl font-bold mb-8 text-center text-white">Connect Institution</h3>
        <div className="grid grid-cols-2 gap-4 mb-10">
          {['Bradesco', 'Santander', 'Inter', 'BTG Pactual'].map(bank => (
            <button key={bank} className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700 hover:border-cyan-500 hover:bg-slate-800 text-center transition-all group">
              <div className="w-10 h-10 bg-slate-700 rounded-full mx-auto mb-3 flex items-center justify-center font-bold text-white group-hover:bg-cyan-900/30 transition-colors">{bank[0]}</div>
              <span className="text-sm font-medium text-slate-300">{bank}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 text-slate-400 font-bold hover:text-white transition-colors">Cancel</button>
          <button className="flex-1 py-4 bg-cyan-600 hover:bg-cyan-500 rounded-2xl font-bold text-white transition-all shadow-lg shadow-cyan-900/20">Continue</button>
        </div>
      </div>
    </div>
  );
};