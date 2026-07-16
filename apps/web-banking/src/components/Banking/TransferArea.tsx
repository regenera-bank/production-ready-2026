
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle, FileText } from 'lucide-react';
import { Transaction } from '../../types';
import {
  centsToReais,
  fetchTransactionReceipt,
  reaisToCents,
  sendTransfer,
  type TransactionReceiptDto,
} from '../../platform/bff-client';


interface TransferAreaProps {
    initialAction?: {
        type: 'send';
        value?: number;
        to?: string;
    } | null;
    accessToken: string;
    transactions: Transaction[];
    onOperationComplete: () => void;
}

const TransferArea: React.FC<TransferAreaProps> = ({
  initialAction,
  accessToken,
  transactions,
  onOperationComplete,
}) => {
    const [cpf, setCpf] = useState(initialAction?.to ?? '');
    const [displayAmount, setDisplayAmount] = useState('');
    const [amount, setAmount] = useState('');
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [creditorName, setCreditorName] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [view, setView] = useState<'new' | 'receipts'>('new');
    const [receiptDetail, setReceiptDetail] = useState<TransactionReceiptDto | null>(null);
    const [receiptBusy, setReceiptBusy] = useState<string | null>(null);
    const [receiptError, setReceiptError] = useState<string | null>(null);

    const openReceipt = async (transactionId: string) => {
      if (receiptBusy) return;
      setReceiptBusy(transactionId);
      setReceiptError(null);
      try {
        const data = await fetchTransactionReceipt(accessToken, transactionId);
        setReceiptDetail(data);
      } catch (err) {
        setReceiptError(err instanceof Error ? err.message : 'Comprovante indisponível');
      } finally {
        setReceiptBusy(null);
      }
    };
    // Chave de idempotência estável por intenção: retry após timeout reutiliza
    // a MESMA chave e o BFF devolve o mesmo resultado (sem débito duplicado).
    const idempotencyKeyRef = React.useRef<string | null>(null);

    const receipts = transactions.filter(
      (tx) => tx.channel === 'transfer' && tx.type === 'outflow',
    );

    useEffect(() => {
      if (initialAction?.to) setCpf(initialAction.to);
      if (initialAction?.value) {
        const v = initialAction.value.toString();
        setAmount(v);
        setDisplayAmount(
          Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
        );
      }
    }, [initialAction]);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/\D/g, '');
      if (!raw) {
        setAmount('');
        setDisplayAmount('');
        return;
      }
      const val = Number(raw) / 100;
      setAmount(val.toString());
      setDisplayAmount(val.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
    };

    const handleTransfer = async () => {
      setProcessing(true);
      setError(null);
      const numericValue = Number(amount);
      const doc = cpf.trim();
      if (!doc || !numericValue || numericValue <= 0) {
        setError('Informe CPF do destinatário e valor válido');
        setProcessing(false);
        return;
      }
      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current =
          (globalThis.crypto?.randomUUID?.() ?? `transfer-ui-${Date.now()}`);
      }
      try {
        const result = await sendTransfer(
          accessToken,
          doc,
          reaisToCents(numericValue),
          idempotencyKeyRef.current,
        );
        idempotencyKeyRef.current = null;
        setCreditorName(result.creditorName ?? null);
        await onOperationComplete();
        setSuccess(true);
      } catch (err) {
        // Mantém a mesma chave para retry seguro (sem duplicidade).
        setError(err instanceof Error ? err.message : 'Falha na transferência');
      } finally {
        setProcessing(false);
      }
    };

    if (success) {
      return (
        <div className="p-6 flex flex-col items-center justify-center min-h-[50vh] text-center animate-in zoom-in">
          <CheckCircle className="w-16 h-16 text-emerald-400 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Transferência enviada</h2>
          <p className="text-gray-400 text-sm mb-6">
            R$ {displayAmount} para {creditorName ?? 'conta Regenera (CPF informado)'}
          </p>
          <button
            type="button"
            onClick={() => {
              setSuccess(false);
              setCpf('');
              setAmount('');
              setDisplayAmount('');
              setCreditorName(null);
              idempotencyKeyRef.current = null;
            }}
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
                  value={displayAmount}
                  onChange={handleAmountChange}
                  placeholder="0,00"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 pl-10 text-white text-xl font-bold focus:border-primary outline-none"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="button"
              onClick={() => void handleTransfer()}
              disabled={processing}
              className="w-full py-4 rounded-xl bg-primary text-white font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {processing ? 'Enviando...' : (
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
              <button
                key={tx.id}
                type="button"
                onClick={() => void openReceipt(tx.id)}
                className="w-full text-left p-4 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center hover:border-primary/40 transition-colors disabled:opacity-50"
                disabled={receiptBusy !== null}
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-bold text-white">{tx.party}</p>
                    <p className="text-[10px] text-gray-500">
                      {tx.date}{receiptBusy === tx.id ? ' · buscando comprovante…' : ''}
                    </p>
                  </div>
                </div>
                <span className="font-mono text-sm text-gray-300">
                  - {Math.abs(tx.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </button>
            ))}
            {receiptError && <p className="text-xs text-red-400 text-center">{receiptError}</p>}
            {receiptDetail && (
              <div className="p-5 rounded-2xl bg-black/40 border border-primary/30 space-y-2" data-testid="transfer-receipt">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] text-primary uppercase tracking-widest font-bold">
                    Comprovante · GET /banking/transactions/:id/receipt
                  </p>
                  <button
                    type="button"
                    onClick={() => setReceiptDetail(null)}
                    className="text-[10px] text-gray-500 uppercase font-bold hover:text-white"
                  >
                    Fechar
                  </button>
                </div>
                <p className="text-white font-bold">{receiptDetail.title}</p>
                <p className="text-sm text-gray-400">{receiptDetail.party}</p>
                <p className="font-mono text-cyan-400">
                  {centsToReais(receiptDetail.amountCents).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
                <p className="text-[10px] text-gray-500 uppercase">
                  {receiptDetail.channel} · {receiptDetail.issuedAt}
                </p>
                <p className="text-[10px] text-gray-600 font-mono">ID {receiptDetail.receiptId}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

export default TransferArea;