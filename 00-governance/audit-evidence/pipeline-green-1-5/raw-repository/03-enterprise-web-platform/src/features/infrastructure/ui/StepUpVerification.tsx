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

export const StepUpVerification: React.FC<{ onVerified: () => void }> = ({ onVerified }) => {
  return (
    <div className="p-8 bg-slate-900 border border-yellow-500/30 rounded-2xl text-center shadow-xl">
      <div className="text-5xl mb-6">🔐</div>
      <h3 className="text-xl font-bold mb-3">Elevated Security Required</h3>
      <p className="text-slate-400 mb-8 max-w-xs mx-auto text-sm leading-relaxed">
        You are attempting to modify core infrastructure parameters. Please confirm your identity via Neural Biometric Handshake.
      </p>
      <button 
        onClick={onVerified}
        className="bg-yellow-600 hover:bg-yellow-500 text-yellow-50 px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-yellow-900/20 active:scale-95"
      >
        Request Neural Handshake
      </button>
    </div>
  );
};