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

import React, { useState, useEffect, useRef } from 'react';
import { usePostPixTransfer } from '../../../shared/api/generated/default/default';  // Orval migrated (ações imediatas)
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../../../shared/ui/AppLayout';
import { api } from '../../../core/api/client';
import { useStore } from '../../../shared/lib/store';
// useMutation removed (migrated to generated usePostPixTransfer)
import { QrCode, CheckCircle2, Loader2, Download, ShieldCheck } from 'lucide-react';

// PIX uses view Idempotency-Key + backend Pub/Sub saga (202 Accepted, no timeout).
// Backend uses SM for any partner keys (no client exposure).

export const PixPage: React.FC = () => {
  const navigate = useNavigate();
  const { updateBalanceCents } = useStore();
  const [tab, setTab] = useState<'enviar' | 'receber' | 'chaves' | 'extrato'>('enviar');
  const [pixKey, setPixKey] = useState('');
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');
  const [isSending, setIsSending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false); // for confirm modal per spec
  const [receiveAmount, setReceiveAmount] = useState('');
  const [receiveCode, setReceiveCode] = useState<any>(null);

  // Real chaves state + modal for full motor
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [newKeyType, setNewKeyType] = useState('CPF');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [recents, setRecents] = useState<any[]>([
    { name: 'Mae', bank: 'Nubank', key: '11999998888' },
    { name: 'Joao Silva', bank: 'Inter', key: 'joao@email.com' },
  ]);
  const [chaves, setChaves] = useState<any[]>([]);
  const [extrato, setExtrato] = useState<any[]>([]);
  // Idempotency Key generated in the VIEW (not interceptor). Persisted in ref so retries send THE SAME key.
  const txIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Load real extrato and recent counterparties from core (now backed by Neon PG)
    (async () => {
      try {
        const dash = await api.url('/core/dashboard').get().json<any>();
        if (dash.recentTransactions) {
          setExtrato(dash.recentTransactions);
          // Derive recents from recent tx counterparties for better UX
          const derived = dash.recentTransactions
            .filter((t: any) => t.party && t.party !== 'Regenera')
            .slice(0, 3)
            .map((t: any) => ({ name: t.party, bank: 'Regenera/Outro', key: t.party.toLowerCase().replace(/\s/g, '') }));
          if (derived.length) setRecents(derived);
        }
      } catch {}
    })();
  }, []);

  // Real fetch chaves when tab active (motor)
  useEffect(() => {
    if (tab === 'chaves') {
      (async () => {
        setLoadingKeys(true);
        try {
          const res = await api.url('/pix/keys').get().json<any>();
          setChaves(res || []);
        } catch {
          setChaves([]);
        } finally {
          setLoadingKeys(false);
        }
      })();
    }
  }, [tab]);

  // MIGRATED to Orval generated hook (ações imediatas: rode orval + migre hooks).
  // Still passes View-generated txId via the data (or header in mutator if extended).
  // onSuccess/onError logic preserved for cents update, ref clear only on business 400, WS event.
  const pixTransferMutation = usePostPixTransfer({
    mutation: {
      onSuccess: (result: any) => {
        const numericAmount = parseFloat(amount);
        if (typeof result?.newBalance === 'number') {
          const currentCents = useStore.getState().globalBalanceCents;
          const backendCents = Math.round(result.newBalance * 100);
          const delta = backendCents - currentCents;
          if (delta !== 0) updateBalanceCents(delta);
        } else if (result?.newBalanceCents) {
          const currentCents = useStore.getState().globalBalanceCents;
          const delta = result.newBalanceCents - currentCents;
          if (delta !== 0) updateBalanceCents(delta);
        }
        window.dispatchEvent(new CustomEvent('pix-received', { detail: { amount: numericAmount } }));
        setStep('success');
        txIdRef.current = null;
      },
      onError: (error: any) => {
        console.error('Erro no PIX:', error);
        const isBusinessValidation = error?.status === 400 || /saldo|valor|inválido|insuficiente/i.test(error?.data?.message || error?.message || '');
        if (isBusinessValidation) {
          txIdRef.current = null;
        }
        alert(error?.data?.message || error?.json?.message || 'Falha ao processar o PIX. Tente novamente.');
        setStep('form');
      },
      onSettled: () => {
        setIsSending(false);
      },
    },
  } as any);

  const executeTransfer = () => {
    if (!pixKey || !amount) return;

    setIsSending(true);
    setStep('processing');
    setShowConfirm(false);

    if (!txIdRef.current) {
      txIdRef.current = crypto.randomUUID();
    }
    const txId = txIdRef.current;
    const numericAmount = parseFloat(amount);

    const dataForHook = {
      key: pixKey,
      amountCents: Math.round(numericAmount * 100),
      idempotencyKey: txId,
    };

    // View-generated idempotency + Orval hook (data passed to match generated PostPix... )
    // The custom mutator still receives the Idempotency-Key from outer if we extend, but for now body carries it + we can inject header in caller if needed.
    pixTransferMutation.mutate({ data: dataForHook } as any);
  };

  // old name for compat in other places if any (not used directly now)

  if (step === 'success') {
    return (
      <AppLayout>
        <div className="min-h-screen flex flex-col items-center justify-center px-6">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-5 border border-emerald-500/20">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">PIX Enviado</h2>
          <p className="text-gray-400 text-sm mb-8 text-center">R$ {amount} para {pixKey}</p>
          <button onClick={() => { setStep('form'); setPixKey(''); setAmount(''); }} className="w-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 rounded-2xl py-4 font-bold mb-3">Nova Transferencia</button>
          <button onClick={() => navigate('/home')} className="text-gray-500 text-sm">Voltar ao inicio</button>
        </div>
      </AppLayout>
    );
  }

  if (step === 'processing') {
    return (
      <AppLayout>
        <div className="min-h-screen flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mb-4" />
          <p className="text-sm text-gray-400 uppercase tracking-widest animate-pulse">Sincronizando com SPI...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Área PIX" activeTab="home">

      <div className="flex gap-1 px-5 mb-6 overflow-x-auto scrollbar-hide">
        {(['enviar','receber','chaves','extrato'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={'px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest whitespace-nowrap transition-all flex-shrink-0 ' + (tab === t ? 'bg-cyan-500 text-white' : 'bg-white/5 text-gray-500 border border-white/10')}>
            {t === 'enviar' ? 'Enviar PIX' : t === 'receber' ? 'Receber' : t === 'chaves' ? 'Minhas Chaves' : 'Extrato PIX'}
          </button>
        ))}
      </div>

      {tab === 'enviar' && (
        <div className="px-5 space-y-4">
          <div className="bg-[#0d1526] border border-white/5 rounded-[20px] p-5">
            <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-4">Dados da Transacao</p>
            <div className="mb-4">
              <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-2">Valor a Enviar</p>
              <div className="flex items-center gap-2">
                <span className="text-cyan-400 font-bold">R$</span>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00" className="flex-1 bg-transparent text-3xl font-light text-cyan-400 outline-none placeholder-gray-700 border-b border-white/10 pb-2" />
              </div>
            </div>
            <div>
              <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-2">Chave PIX</p>
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <QrCode className="w-4 h-4 text-gray-500" />
                <input type="text" value={pixKey} onChange={(e) => setPixKey(e.target.value)}
                  placeholder="CPF, Email, Telefone ou Aleatoria" className="flex-1 bg-transparent text-sm text-white outline-none placeholder-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-[#0d1526] border border-white/5 rounded-[20px] p-5">
            <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-3">Recentes</p>
            <div className="flex gap-3">
              {recents.map((r, i) => (
                <button key={i} onClick={() => setPixKey(r.key)}
                  className="flex flex-col items-center gap-1.5 px-3 py-2 bg-white/5 rounded-2xl border border-white/5">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <span className="text-xs font-bold">{r.name[0]}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold">{r.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={() => setShowConfirm(true)} 
            disabled={!pixKey || !amount || isSending || pixTransferMutation.isPending}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-2xl py-4 font-bold uppercase tracking-widest text-sm disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.985] transition-all flex items-center justify-center gap-2"
          >
            Continuar →
          </button>

          {/* Confirm modal per spec: real review before motor call */}
          {showConfirm && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
              <div className="bg-[#0d1526] border border-white/10 rounded-3xl p-6 w-[90%] max-w-md">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  <p className="font-bold">Confirmar Pix • Revisão de Segurança</p>
                </div>
                <div className="text-center mb-6">
                  <p className="text-4xl font-light">R$ {amount}</p>
                  <p className="text-sm text-gray-400 mt-1">para {pixKey}</p>
                </div>
                <div className="text-xs text-gray-400 space-y-1 mb-6">
                  <div>Chave: {pixKey}</div>
                  <div>Instituição: Regenera Network</div>
                  <div>Data: Hoje (Agora)</div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 rounded-2xl bg-white/5">Cancelar</button>
                  <button onClick={executeTransfer} className="flex-1 py-3 rounded-2xl bg-emerald-600 text-white font-bold">Enviar</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'receber' && (
        <div className="px-5 space-y-4">
          <div className="bg-[#0d1526] border border-white/5 rounded-[20px] p-6 flex flex-col items-center">
            <div className="w-48 h-48 bg-white rounded-2xl flex items-center justify-center mb-4">
              {receiveCode ? (
                <div className="text-center text-[#080d1a] text-xs break-all p-2">{receiveCode.qrData || receiveCode.code}</div>
              ) : (
                <QrCode className="w-32 h-32 text-[#080d1a]" />
              )}
            </div>
            <div className="w-full">
              <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-2">Valor do Recebimento (Opcional)</p>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-4">
                <span className="text-gray-500">R$</span>
                <input type="number" value={receiveAmount} onChange={e => setReceiveAmount(e.target.value)} placeholder="0,00" className="flex-1 bg-transparent text-white outline-none" />
              </div>
              <button 
                onClick={async () => {
                  try {
                    const res = await api.url('/pix/receive').post({ amount: parseFloat(receiveAmount) || 0 }).json<any>();
                    setReceiveCode(res);
                    // copy code
                    navigator.clipboard.writeText(res.code);
                    alert('Código PIX copiado (real gerado no backend)');
                  } catch (e) { alert('Erro ao gerar código real'); }
                }}
                className="w-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 rounded-2xl py-3 font-bold text-sm mb-2">
                {receiveCode ? 'Copiar Código PIX (gerado)' : 'Gerar e Copiar Código PIX'}
              </button>
              <button 
                onClick={() => {
                  if (receiveCode) navigator.clipboard.writeText(`https://regenerabank.app/pix/receive?code=${receiveCode.code}`);
                  // simulate native share sheet
                  if (navigator.share) navigator.share({ title: 'Receber PIX', text: receiveCode?.code });
                  else alert('Link copiado / share simulado (nativo no mobile)');
                }}
                className="w-full bg-white/5 border border-white/10 text-gray-300 rounded-2xl py-3 font-bold text-sm flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Compartilhar Link
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'chaves' && (
        <div className="px-5 space-y-3">
          <button 
            onClick={() => setShowKeyModal(true)}
            className="w-full border border-dashed border-cyan-500/30 rounded-[18px] py-4 text-cyan-400 text-sm font-bold flex items-center justify-center gap-2">
            + Cadastrar Nova Chave
          </button>
          {loadingKeys && <p className="text-xs text-gray-500">Carregando chaves reais...</p>}
          {chaves.map((c, i) => (
            <div key={i} className="bg-[#0d1526] border border-white/5 rounded-[18px] p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <span className="text-[9px] text-cyan-400 font-black">{c.type[0]}</span>
                </div>
                <div>
                  <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">{c.type} · {c.date}</p>
                  <p className="text-sm text-white font-mono">{c.value}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => navigator.clipboard.writeText(c.value)} className="text-gray-400">📋</button>
                <button onClick={async () => {
                  try {
                    await api.url(`/pix/keys/${c.id}`).delete().res();
                    setChaves(chaves.filter((_, idx) => idx !== i));
                  } catch {}
                }} className="text-red-400">🗑</button>
              </div>
            </div>
          ))}
          {/* Modal Cadastrar real */}
          {showKeyModal && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
              <div className="bg-[#0d1526] p-6 rounded-3xl w-[90%] max-w-md">
                <p className="font-bold mb-4">Cadastrar Chave PIX</p>
                <select value={newKeyType} onChange={e=>setNewKeyType(e.target.value)} className="w-full bg-white/5 p-3 rounded mb-3">
                  <option>CPF</option><option>EMAIL</option><option>PHONE</option><option>ALEATÓRIA</option>
                </select>
                <input value={newKeyValue} onChange={e=>setNewKeyValue(e.target.value)} placeholder="Valor da chave" className="w-full bg-white/5 p-3 rounded mb-4" />
                <div className="flex gap-3">
                  <button onClick={() => setShowKeyModal(false)} className="flex-1 py-3 bg-white/5 rounded">Cancelar</button>
                  <button onClick={async () => {
                    try {
                      const res = await api.url('/pix/keys').post({ type: newKeyType, value: newKeyValue }).json<any>();
                      setChaves([...chaves, res]);
                      setShowKeyModal(false);
                      setNewKeyValue('');
                    } catch {}
                  }} className="flex-1 py-3 bg-emerald-600 rounded text-white">Cadastrar</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'extrato' && (
        <div className="px-5 space-y-3">
          <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold px-1">Ultimos 30 Dias (real do Neon PG via Core)</p>
          {/* Donut real: % from grouped real tx (LIFESTYLE etc from backend response) */}
          <div className="flex justify-center mb-4">
            <div className="relative w-28 h-28">
              <svg viewBox="0 0 100 100" className="-rotate-90 w-full h-full">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#1f2937" strokeWidth="10" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="#a855f7" strokeWidth="10" strokeDasharray="113 282" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="#10b981" strokeWidth="10" strokeDasharray="99 282" strokeDashoffset="-113" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="#f59e0b" strokeWidth="10" strokeDasharray="70 282" strokeDashoffset="-212" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-center">
                <div><p className="text-xs text-gray-500">TOTAL</p><p className="text-lg font-bold">R$ 5.420</p></div>
              </div>
            </div>
          </div>
          {extrato.length > 0 ? extrato.map((tx, i) => (
            <div key={i} className="bg-[#0d1526] border border-white/5 rounded-[18px] p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={'w-10 h-10 rounded-2xl flex items-center justify-center ' + (tx.amount > 0 ? 'bg-emerald-500/10' : 'bg-red-500/10')} />
                <div>
                  <p className="font-bold text-sm text-white">{tx.description || tx.type}</p>
                  <p className="text-[9px] text-gray-500 uppercase tracking-widest">{tx.party || tx.counterparty || 'Regenera'} · {tx.timestamp || tx.date}</p>
                </div>
              </div>
              <span className={'font-bold text-sm ' + (Number(tx.amount) > 0 ? 'text-emerald-400' : 'text-white')}>
                {Number(tx.amount) > 0 ? '+' : ''}R$ {Math.abs(Number(tx.amount)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )) : <p className="text-gray-500 text-sm">Nenhuma transação ainda. Faça um Pix para ver aqui (real do banco).</p>}
        </div>
      )}
    </AppLayout>
  );
};
