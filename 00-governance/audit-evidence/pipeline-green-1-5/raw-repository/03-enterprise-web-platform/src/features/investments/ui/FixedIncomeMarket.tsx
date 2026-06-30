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
 * Fixed Income Market
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../../shared/lib/store';
import { ArrowLeft, ShieldCheck, Lock } from 'lucide-react';

export const FixedIncomeMarket: React.FC = () => {
  const navigate = useNavigate();
  const showFeedback = useStore((state) => state.showFeedback);

  const products = [
    { name: 'CDB Banco Master', rate: '115% CDI', maturity: '2026', risk: 'Baixo' },
    { name: 'LCI Banco Inter', rate: '98% CDI', maturity: '2025', risk: 'Baixo', taxFree: true },
    { name: 'CRI Caixa', rate: 'IPCA + 6.5%', maturity: '2028', risk: 'Médio', taxFree: true }
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-white p-6 pb-24">
      <div className="flex items-center gap-4 mb-10">
        <button onClick={() => navigate('/investments')} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Renda Fixa</h1>
          <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-black">CDB, LCI, LCA & Tesouro</p>
        </div>
      </div>

      <div className="space-y-4">
        {products.map((p, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-[32px] p-6 hover:bg-white/10 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg mb-1">{p.name}</h3>
                <div className="flex gap-2">
                  {p.taxFree && <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-widest font-black">Isento IR</span>}
                  <span className="text-[8px] bg-white/10 text-gray-400 px-2 py-0.5 rounded-full uppercase tracking-widest font-black flex items-center gap-1">
                    <ShieldCheck className="w-2 h-2" /> FGC
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-light text-emerald-400">{p.rate}</p>
              </div>
            </div>

            <div className="flex justify-between items-center py-4 border-t border-b border-white/5 mb-4">
              <div className="text-center">
                <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black mb-1">Vencimento</p>
                <p className="font-bold flex items-center gap-1 justify-center"><Lock className="w-3 h-3 text-gray-400" /> {p.maturity}</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black mb-1">Risco</p>
                <p className="font-bold text-cyan-400">{p.risk}</p>
              </div>
            </div>

            <button 
              onClick={() => showFeedback('Direcionando para tela de aporte...', 'alert')}
              className="w-full py-4 bg-white/5 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-2xl font-black uppercase tracking-widest text-xs transition-all"
            >
              Investir
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
