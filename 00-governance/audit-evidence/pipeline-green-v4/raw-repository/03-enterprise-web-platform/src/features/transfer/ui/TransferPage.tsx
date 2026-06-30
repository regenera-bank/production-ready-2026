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

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../../../shared/ui/AppLayout';
import { api } from '../../../core/api/client';
import { useStore } from '../../../shared/lib/store';
import { CheckCircle2, Loader2 } from 'lucide-react';

export const TransferPage: React.FC = () => {
  const navigate = useNavigate();
  const { updateBalanceCents } = useStore();

  const [bank, setBank] = useState('');
  const [agency, setAgency] = useState('');
  const [account, setAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');

  const handleConfirm = async () => {
    if (!bank || !amount) return;

    setStep('processing');

    try {
      const numericAmount = parseFloat(amount);

      // Idempotency generated in View
      const txId = crypto.randomUUID();

      // Dedicated transfer endpoint (not reusing Pix)
      const result = await api
        .url('/core/transfer')
        .headers({ 'Idempotency-Key': txId })
        .post({
          receiverId: `${bank}-${agency}-${account}`,
          amount: numericAmount,
          idempotencyKey: txId,
        })
        .json<any>();

      // Trust backend only
      if (typeof result?.newBalance === 'number') {
        const currentCents = useStore.getState().globalBalanceCents;
        const backendCents = Math.round(result.newBalance * 100);
        updateBalanceCents(backendCents - currentCents);
      } else if (result?.newBalanceCents != null) {
        const currentCents = useStore.getState().globalBalanceCents;
        updateBalanceCents(result.newBalanceCents - currentCents);
      }
      // No blind optimistic on error path.

      setStep('success');
    } catch (error: any) {
      alert(error?.json?.message || 'Falha na transferência.');
      setStep('form');
    }
  };

  if (step === 'success') {
    return (
      <AppLayout title="Transferências">
        <div className="min-h-screen flex flex-col items-center justify-center px-6">
          <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-6" />
          <h2 className="text-2xl font-bold mb-2">Transferência Realizada</h2>
          <p className="text-gray-400 mb-8">R$ {amount} enviados para {bank}</p>
          <button onClick={() => { setStep('form'); setBank(''); setAgency(''); setAccount(''); setAmount(''); }} className="w-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 rounded-2xl py-4 font-bold mb-3">Nova Transferência</button>
          <button onClick={() => navigate('/home')} className="text-gray-500">Voltar ao início</button>
        </div>
      </AppLayout>
    );
  }

  if (step === 'processing') {
    return (
      <AppLayout title="Transferências">
        <div className="min-h-screen flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mb-4" />
          <p className="text-sm text-gray-400 uppercase tracking-widest">Processando via SPI / TED...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Transferências">

      <div className="px-5 space-y-4">
        <div className="bg-[#0d1526] border border-white/5 rounded-2xl p-5">
          <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-4">Dados do Destinatário</p>

          <input 
            placeholder="Banco" 
            value={bank} 
            onChange={e => setBank(e.target.value)} 
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-3 text-sm" 
          />
          <div className="flex gap-3 mb-3">
            <input placeholder="Agência" value={agency} onChange={e => setAgency(e.target.value)} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm" />
            <input placeholder="Conta" value={account} onChange={e => setAccount(e.target.value)} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm" />
          </div>

          <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-2 mt-4">Valor</p>
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 font-bold">R$</span>
            <input 
              type="number" 
              value={amount} 
              onChange={e => setAmount(e.target.value)} 
              placeholder="0,00" 
              className="flex-1 bg-transparent text-3xl font-light text-cyan-400 outline-none placeholder-gray-700 border-b border-white/10 pb-2" 
            />
          </div>
        </div>

        <button 
          onClick={handleConfirm} 
          disabled={!bank || !amount}
          className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl font-bold disabled:opacity-50"
        >
          Confirmar Transferência
        </button>
      </div>
    </AppLayout>
  );
};
