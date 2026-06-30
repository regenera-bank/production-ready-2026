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

import React from 'react';
import { Sparkles, Loader2, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';

interface Insight {
  type: 'alerta' | 'sucesso' | 'info';
  message: string;
}

interface SmartStatementProps {
  insights: Insight[];
  isAnalyzing: boolean;
}

export const SmartStatement: React.FC<SmartStatementProps> = ({ insights, isAnalyzing }) => {
  return (
    <div className="bg-gradient-to-br from-indigo-950/40 to-[#0a0f1e] border border-indigo-500/20 rounded-[40px] p-8 relative overflow-hidden">
      <div className="relative z-10">
        <h3 className="text-xl font-bold mb-6 tracking-tight flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          Smart Statement
        </h3>
        
        {isAnalyzing ? (
          <div className="flex flex-col items-center py-10 gap-4">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-[10px] text-indigo-400 uppercase tracking-widest font-black">Sincronizando Neural Insights...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {insights.map((insight, idx) => (
              <div 
                key={idx} 
                className={`p-5 rounded-3xl border-l-4 flex gap-4 transition-all ${
                  insight.type === 'alerta' ? 'bg-amber-500/5 border-amber-500/50' :
                  insight.type === 'sucesso' ? 'bg-emerald-500/5 border-emerald-500/50' :
                  'bg-cyan-500/5 border-cyan-500/50'
                }`}
              >
                <div className="shrink-0 mt-1">
                  {insight.type === 'alerta' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                  {insight.type === 'sucesso' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {insight.type === 'info' && <TrendingUp className="w-4 h-4 text-cyan-500" />}
                </div>
                <p className="text-sm text-gray-300 leading-relaxed font-medium">
                  {insight.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
