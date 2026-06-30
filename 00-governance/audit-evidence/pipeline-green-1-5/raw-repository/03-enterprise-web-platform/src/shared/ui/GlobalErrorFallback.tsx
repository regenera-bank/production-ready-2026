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

export const GlobalErrorFallback: React.FC<{ error: Error }> = ({ error }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
      <div className="w-20 h-20 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-6 text-4xl animate-pulse">!</div>
      <h2 className="text-2xl font-bold mb-4">Neural Link Severed</h2>
      <pre className="bg-red-900/20 border border-red-500/50 p-4 rounded text-sm text-red-400 mb-6 max-w-lg overflow-auto">
        {error.message}
      </pre>
      <button 
        onClick={() => window.location.reload()}
        className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 rounded font-bold transition-colors"
      >
        Re-establish Connection
      </button>
    </div>
  );
};