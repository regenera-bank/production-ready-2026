
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, CheckCircle, FileText, Loader2, XCircle } from 'lucide-react';
import { Transaction } from '../../types';
import { sendTransfer } from '../../platform/bff-client';
import {
  compareCents,
  createIdempotencyKey,
  formatCentsBrl,
  formatCentsCurrency,
  MoneyParseError,
  parseMaskedCentsInput,
} from '../../platform/money';

interface TransferAreaProps {
    initialAction?: {
        type: 'send';
        value?: number;
        to?: string;
    } | null;
    accessToken: string;
    availableBalanceCents: string;
    transactions: Transaction[];
    onOperationComplete: () => void;
}

type TransferOperationStatus = 'form' | 'pending' | 'settled' | 'rejected';

const TransferArea: React.FC<TransferAreaProps> = ({
  initialAction,
  accessToken,
  availableBalanceCents,
  transactions,
  onOperationComplete,
}) => {
    const [cpf, setCpf] = useState(initialAction?.to ?? '');
    const [displayAmount, setDisplayAmount] = useState('');
    const [amountCents, setAmountCents] = useState<string | null>(null);
    const [operationStatus, setOperationStatus] = useState<TransferOperationStatus>('form');
    const [operationId, setOperationId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [view, setView] = useState<'new' | 'receipts'>('new');
    const idempotencyKeyRef = useRef<string | null>(null);
    const transferIntentRef = useRef<string | null>(null);
    const isSubmittingRef = useRef(false);

    const receipts = transactions.filter(
      (tx) => tx.channel === 'transfer' && tx.type === 'outflow',
    );

    useEffect(() => {
      if (initialAction?.to) setCpf(initialAction.to);
      if (initialAction?.value) {
        const cents = Math.round(initialAction.value * 100).toString();
        setAmountCents(cents);
        setDisplayAmount(formatCentsBrl(cents));
      }
    }, [initialAction]);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/\D/g, '');
      if (!raw) {
        setAmountCents(null);
        setDisplayAmount('');
        return;
      }
      setAmountCents(raw);
      setDisplayAmount(formatCentsBrl(raw));
    };

    const handleTransfer = async () => {
      if (isSubmittingRef.current) return;
      setError(null);
      const doc = cpf.trim();
      if (!doc || !amountCents) {
        setError('Informe CPF do destinatário e valor válido');
        return;
      }
      try {
        const cents = parseMaskedCentsInput(amountCents);
        if (compareCents(cents, availableBalanceCents) > 0) {
          setError('Saldo insuficiente');
          return;
        }
        const intent = `${doc}:${cents}`;
        if (transferIntentRef.current !== intent || !idempotencyKeyRef.current) {
          idempotencyKeyRef.current = createIdempotencyKey('transfer');
          transferIntentRef.current = intent;
        }
        const idempotencyKey = idempotencyKeyRef.current;
        isSubmittingRef.current = true;
        setOperationStatus('pending');
        setOperationId(null);
        const result = await sendTransfer(
          accessToken,
          doc,
          cents,
          idempotencyKey,
        );
        setOperationId(result.paymentId);
        await onOperationComplete();
        setOperationStatus('settled');
      } catch (err) {
        setError(err instanceof MoneyParseError || err instanceof Error
          ? err.message
          : 'Falha na transferência');
        setOperationStatus('rejected');
      } finally {
        isSubmittingRef.current = false;
      }
    };

    const resetForm = () => {
      setOperationStatus('form');
      setOperationId(null);
      setAmountCents(null);
      idempotencyKeyRef.current = null;
      transferIntentRef.current = null;
      setCpf('');
      setDisplayAmount('');
      setError(null);
    };

    if (operationStatus === 'pending') {
      return (
        <div className="p-6 flex flex-col items-center justify-center min-h-[50vh] text-center animate-in fade-in">
          <Loader2 className="w-16 h-16 text-primary mb-4 animate-spin" />
          <h2 className="text-xl font-bold text-white mb-2">Pendente</h2>
          <p className="text-gray-400 text-sm">Transferência em processamento no BFF...</p>
          {idempotencyKeyRef.current && (
            <p className="text-[10px] text-gray-600 font-mono mt-4 break-all px-6">
              idempotency: {idempotencyKeyRef.current}
            </p>
          )}
        </div>
      );
    }

    if (operationStatus === 'settled') {
      return (
        <div className="p-6 flex flex-col items-center justify-center min-h-[50vh] text-center animate-in zoom-in">
          <CheckCircle className="w-16 h-16 text-emerald-400 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Liquidado</h2>
          <p className="text-gray-400 text-sm mb-2">
            {amountCents ? formatCentsCurrency(amountCents) : '—'} para conta Regenera (CPF informado)
          </p>
          {operationId && (
            <p className="text-[10px] text-cyan-400/80 font-mono mb-6 break-all px-4">
              operação: {operationId}
            </p>
          )}
          <button
            type="button"
            onClick={resetForm}
            className="px-6 py-3 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-widest"
          >
            Nova transferência
          </button>
        </div>
      );
    }

    return (
      <div className="p-6 space-y-6 animate-in fade-in pb-32">
        <div className="flex gap-2">
          {[
            { id: 'new' as const, label: 'Nova transferência' },
            { id: 'receipts' as const, label: 'Comprovantes' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setView(tab.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider ${
                view === tab.id
                  ? 'bg-primary text-white'
                  : 'bg-white/5 text-gray-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {view === 'new' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 text-xs text-primary/90">
              Transferência interna entre contas Regenera Bank — ledger real via BFF.
              Não é TED para banco externo.
            </div>

            <div>
              <label className="block text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">
                CPF do destinatário (conta Regenera)
              </label>
              <input
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                placeholder="000.000.000-00"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">
                Valor
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
                  R$
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={displayAmount}
                  onChange={handleAmountChange}
                  placeholder="0,00"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 pl-10 text-white text-xl font-bold focus:border-primary outline-none"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400 flex items-center gap-2">
                {operationStatus === 'rejected' && <XCircle className="w-4 h-4 shrink-0" />}
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={() => void handleTransfer()}
              disabled={isSubmittingRef.current || !amountCents || !cpf.trim()}
              className="w-full py-4 rounded-xl bg-primary text-white font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmittingRef.current ? 'Enviando...' : (
                <>
                  Transferir <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        {view === 'receipts' && (
          <div className="space-y-3">
            {receipts.length === 0 && (
              <p className="text-center text-sm text-gray-500 py-12">
                Nenhuma transferência no extrato
              </p>
            )}
            {receipts.map((tx) => (
              <div
                key={tx.id}
                className="p-4 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-bold text-white">{tx.party}</p>
                    <p className="text-[10px] text-gray-500">{tx.date}</p>
                  </div>
                </div>
                <span className="font-mono text-sm text-gray-300">
                  - {Math.abs(tx.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

export default TransferArea;