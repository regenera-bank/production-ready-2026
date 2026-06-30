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

export const PixReceiptModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-8 relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">✕</button>
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">✓</div>
          <h3 className="text-xl font-bold">Pix Sent Successfully</h3>
        </div>
        <div className="space-y-3 font-mono text-sm border-y border-slate-800 py-6 mb-6">
          <div className="flex justify-between"><span className="text-slate-500">Amount:</span><span className="text-white font-bold">R$ 150,00</span></div>
          <div className="flex justify-between"><span className="text-slate-500">To:</span><span className="text-white">Cyberdyne Systems</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Date:</span><span className="text-white">Oct 24, 2023 - 14:45</span></div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">ID:</span>
            <span className="text-[10px] text-slate-400 bg-slate-800 px-1 rounded">E12345678901234567890</span>
          </div>
        </div>
        <button className="w-full bg-slate-800 hover:bg-slate-700 py-3 rounded-xl font-bold mb-3 transition-colors">Share Receipt</button>
        <button onClick={onClose} className="w-full text-slate-400 py-2 hover:text-white transition-colors">Close</button>
      </div>
    </div>
  );
};