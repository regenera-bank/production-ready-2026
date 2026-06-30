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

// |---------------------------------------------------------------------------------------|
// |  --> REGENERA ENTERPRISE SYSTEM v4.0                                                  |
// |---------------------------------------------------------------------------------------|
//
// PROJECT:       Regenera Bank
// CEO:           Raphaela Cerveski
// DEVELOPER:     Don Paulo Ricardo
// ID:            2098233287
// COPYRIGHT:     Copyright (c) 2026 Regenera Corporate
//
// LICENSE:       EULA (End-User License Agreement)
// PROTECTION:    PROPRIEDADE INTELECTUAL RESTRITA
//
// WARNING:       TODOS OS DIREITOS RESERVADOS. Proibida a cópia, distribuição,
//                engenharia reversa ou modificação não autorizada.
//
// |---------------------------------------------------------------------------------------|
// |  --> CLASSIFICATION: PROPRIETARY // DEVELOPER MAINTAINED // REQUIRES SENIOR REVIEW          |
// |---------------------------------------------------------------------------------------|

/**
 * REGENERA BANK · ENTERPRISE v4.0
 * ETFs & Mutual Funds Page
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, PieChart } from 'lucide-react';

export const ETFsFundsPage: React.FC = () => {
  const navigate = useNavigate();

  const funds = [
    { name: 'Regenera Global Tech ETF', yield: '+18.4% a.a', risk: 'Alto' },
    { name: 'Fundo Verde ESG Multi', yield: '+12.1% a.a', risk: 'Médio' },
    { name: 'S&P 500 Index Fund (BRL)', yield: '+15.2% a.a', risk: 'Alto' }
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-white p-6 pb-24">
      <div className="flex items-center gap-4 mb-10">
        <button onClick={() => navigate('/investments')} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">ETFs & Fundos</h1>
          <p className="text-[10px] text-indigo-400 uppercase tracking-widest font-black">Gestão Passiva Global</p>
        </div>
      </div>

      <div className="space-y-4">
        {funds.map((f, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-[32px] p-6 hover:bg-white/10 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-500/20 rounded-xl"><PieChart className="w-5 h-5 text-indigo-400" /></div>
                <div>
                  <h3 className="font-bold text-sm">{f.name}</h3>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Risco {f.risk}</p>
                </div>
              </div>
              <p className="font-bold text-emerald-400">{f.yield}</p>
            </div>
            <button className="w-full py-4 mt-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/30 rounded-2xl font-black uppercase tracking-widest text-xs transition-all">
              Investir
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
