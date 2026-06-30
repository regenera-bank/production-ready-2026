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

export const PixKeyForm: React.FC = () => {
  return (
    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
      <h3 className="font-bold mb-4">Transfer by Key</h3>
      <form className="space-y-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1 uppercase tracking-tighter">Select Key Type</label>
          <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 focus:ring-1 focus:ring-cyan-500 outline-none appearance-none">
            <option>CPF / CNPJ</option>
            <option>E-mail</option>
            <option>Phone Number</option>
            <option>Random Key</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1 uppercase tracking-tighter">Key Value</label>
          <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 focus:ring-1 focus:ring-cyan-500 outline-none" placeholder="000.000.000-00" />
        </div>
        <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 py-4 rounded-xl font-bold transition-all shadow-lg shadow-cyan-900/20">
          Verify Receiver
        </button>
      </form>
    </div>
  );
};