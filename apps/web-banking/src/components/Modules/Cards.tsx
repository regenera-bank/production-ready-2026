
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useCallback, useEffect, useState } from 'react';
import { CardDetails } from '../../types';
import {
  blockCard,
  centsToReais,
  chargebackCardPurchase,
  createVirtualCard,
  fetchCardInvoice,
  fetchCards,
  fetchCardsActivation,
  fetchCardTransactions,
  mapCardDto,
  reaisToCents,
  unblockCard,
  updateCardLimit,
  type ActivationStatusDto,
  type CardInvoiceDto,
  type CardTransactionDto,
} from '../../platform/bff-client';
import { createIdempotencyKey } from '../../platform/money';
import {
  Lock, Eye, EyeOff, Copy, ShieldCheck, Zap, Smartphone,
  Nfc, Activity, CheckCircle, AlertTriangle, Unlock, DollarSign, Loader2,
} from 'lucide-react';

interface CardsModuleProps {
  highlightBlock?: boolean;
  accessToken: string;
}

const CardsModule: React.FC<CardsModuleProps> = ({ highlightBlock, accessToken }) => {
  const [cards, setCards] = useState<CardDetails[]>([]);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    msg: string;
    type: 'success' | 'alert';
  } | null>(null);
  const [activation, setActivation] = useState<ActivationStatusDto | null>(null);
  const [creatingVirtual, setCreatingVirtual] = useState(false);
  const [invoice, setInvoice] = useState<CardInvoiceDto | null>(null);
  const [cardTxs, setCardTxs] = useState<CardTransactionDto[] | null>(null);
  const [statementLoading, setStatementLoading] = useState(false);
  const [contesting, setContesting] = useState<string | null>(null);

  const loadCards = useCallback(async () => {
    if (!accessToken) {
      setError('Sessão inválida — faça login novamente');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const items = await fetchCards(accessToken);
      setCards(items.map(mapCardDto));
      setActiveCardIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar cartões');
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadCards();
  }, [loadCards]);

  useEffect(() => {
    if (!accessToken) return;
    void fetchCardsActivation(accessToken)
      .then(setActivation)
      .catch(() => setActivation(null));
  }, [accessToken]);

  const activeCard = cards[activeCardIndex];

  useEffect(() => {
    // Estado da fatura é sempre do cartão ativo — limpa ao trocar.
    setInvoice(null);
    setCardTxs(null);
  }, [activeCardIndex]);

  const showNotification = (msg: string, type: 'success' | 'alert' = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const toggleLock = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!activeCard || !accessToken) {
      return;
    }
    const isLocked = activeCard.status === 'locked';
    const idempotencyKey = createIdempotencyKey('cards');
    try {
      const updated = isLocked
        ? await unblockCard(accessToken, activeCard.id, idempotencyKey)
        : await blockCard(accessToken, activeCard.id, idempotencyKey);
      const mapped = mapCardDto(updated);
      setCards((prev) =>
        prev.map((card) => (card.id === mapped.id ? mapped : card)),
      );
      showNotification(
        isLocked ? 'Cartão desbloqueado' : 'Cartão bloqueado temporariamente',
        isLocked ? 'success' : 'alert',
      );
    } catch (err) {
      showNotification(
        err instanceof Error ? err.message : 'Falha ao alterar bloqueio',
        'alert',
      );
    }
  };

  const handleCopy = (text: string) => {
    if (!activeCard || activeCard.status === 'locked') {
      showNotification('Cartão bloqueado — ação negada', 'alert');
      return;
    }
    void navigator.clipboard.writeText(text.replace(/\s/g, ''));
    showNotification('Número copiado', 'success');
  };

  const handleLimitChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeCard || !accessToken) {
      return;
    }
    const newLimit = Number(e.target.value);
    const updated = [...cards];
    updated[activeCardIndex] = { ...activeCard, limit: newLimit };
    setCards(updated);
  };

  const commitLimitChange = async () => {
    if (!activeCard || !accessToken) {
      return;
    }
    try {
      const updated = await updateCardLimit(
        accessToken,
        activeCard.id,
        reaisToCents(activeCard.limit),
        createIdempotencyKey('cards'),
      );
      const mapped = mapCardDto(updated);
      setCards((prev) =>
        prev.map((card) => (card.id === mapped.id ? mapped : card)),
      );
      showNotification('Limite atualizado no BFF', 'success');
    } catch (err) {
      showNotification(
        err instanceof Error ? err.message : 'Falha ao atualizar limite',
        'alert',
      );
      void loadCards();
    }
  };

  const handleCreateVirtual = async () => {
    if (!accessToken || creatingVirtual) return;
    setCreatingVirtual(true);
    try {
      const created = await createVirtualCard(
        accessToken,
        reaisToCents(500),
        createIdempotencyKey('cards'),
      );
      await loadCards();
      showNotification(`Cartão virtual ${created.alias} criado no BFF`, 'success');
    } catch (err) {
      showNotification(
        err instanceof Error ? err.message : 'Falha ao criar cartão virtual',
        'alert',
      );
    } finally {
      setCreatingVirtual(false);
    }
  };

  const handleLoadStatement = async () => {
    if (!accessToken || !activeCard || statementLoading) return;
    if (invoice || cardTxs) {
      setInvoice(null);
      setCardTxs(null);
      return;
    }
    setStatementLoading(true);
    try {
      const [inv, txs] = await Promise.all([
        fetchCardInvoice(accessToken, activeCard.id).catch(() => null),
        fetchCardTransactions(accessToken, activeCard.id).catch(() => [] as CardTransactionDto[]),
      ]);
      setInvoice(inv);
      setCardTxs(txs);
      if (!inv && txs.length === 0) {
        showNotification('Sem fatura ou lançamentos para este cartão', 'alert');
      }
    } finally {
      setStatementLoading(false);
    }
  };

  const handleContest = async (tx: CardTransactionDto) => {
    if (!accessToken || !activeCard || contesting) return;
    setContesting(tx.id);
    try {
      const r = await chargebackCardPurchase(
        accessToken,
        activeCard.id,
        tx.id,
        createIdempotencyKey('cards'),
      );
      showNotification(
        `Contestação registrada · ${r.status ?? 'ACCEPTED'}${r.ledgerPaymentId ? ` · estorno ${r.ledgerPaymentId.slice(0, 8)}…` : ''}`,
        'success',
      );
      await loadCards();
      const txs = await fetchCardTransactions(accessToken, activeCard.id).catch(
        () => cardTxs ?? [],
      );
      setCardTxs(txs);
    } catch (err) {
      showNotification(
        err instanceof Error ? err.message : 'Falha ao contestar compra',
        'alert',
      );
    } finally {
      setContesting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
        <p className="text-xs text-gray-500 uppercase tracking-widest">Carregando cartões do BFF</p>
      </div>
    );
  }

  if (error || !activeCard) {
    return (
      <div className="p-6 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
        <p className="text-sm text-gray-400">{error ?? 'Nenhum cartão disponível'}</p>
        <button
          type="button"
          onClick={() => void loadCards()}
          className="px-4 py-2 rounded-xl bg-white/10 text-xs font-bold uppercase tracking-widest"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div
      className="p-6 space-y-8 animate-in slide-in-from-bottom duration-700 pb-32"
      data-testid="view-cards"
    >
      <p className="text-[10px] text-amber-400/90 uppercase tracking-widest text-center border border-amber-500/20 rounded-full py-2 px-4">
        {activation
          ? `${activation.sandbox ? 'Sandbox · ' : ''}${activation.message || 'Cartões via GET /products/cards'}${activation.externalProviderActive ? ' · emissor externo ativo' : ' · emissor externo inativo'}`
          : 'Cartões · dados reais de GET /products/cards'}
      </p>

      <div className="flex justify-center gap-3 mb-4">
        {cards.map((card, idx) => (
          <button
            key={card.id}
            type="button"
            onClick={() => {
              setActiveCardIndex(idx);
              setFlipped(false);
              setShowDetails(false);
            }}
            className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 border ${
              activeCardIndex === idx
                ? 'bg-white text-bg-deep border-white shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-105'
                : 'bg-white/5 border-transparent text-gray-500 hover:bg-white/10 hover:text-white'
            }`}
          >
            {card.type === 'black' ? 'Débito' : 'Digital'}
          </button>
        ))}
      </div>

      <div
        className="perspective-1000 w-full h-56 cursor-pointer group relative z-10"
        onClick={() => setFlipped(!flipped)}
        onKeyDown={() => {}}
        role="presentation"
      >
        <div
          className={`relative w-full h-full transition-transform duration-700 preserve-3d shadow-[0_30px_60px_rgba(0,0,0,0.8)] ${flipped ? 'rotate-y-180' : ''}`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div
            className={`absolute inset-0 backface-hidden rounded-3xl overflow-hidden border transition-all duration-500 ${
              activeCard.status === 'locked'
                ? 'border-red-500/50 grayscale brightness-75'
                : activeCard.type === 'black'
                  ? 'border-gray-800 bg-black'
                  : 'border-cyan-400/50 bg-blue-900'
            }`}
          >
            {activeCard.status === 'locked' && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-[2px]">
                <div className="flex flex-col items-center">
                  <Lock className="w-12 h-12 text-red-500 mb-2" />
                  <span className="text-red-400 text-xs font-bold uppercase tracking-widest">
                    Bloqueado
                  </span>
                </div>
              </div>
            )}
            <div className="absolute inset-0 z-0">
              {activeCard.type === 'black' ? (
                <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-black to-[#0a0a0a]" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-950 to-bg-deep" />
              )}
            </div>
            <div className="relative z-10 p-6 flex flex-col justify-between h-full text-white">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-8 rounded-md bg-gradient-to-br from-yellow-600 to-yellow-800 border border-black/10" />
                  <Nfc className="w-6 h-6 opacity-80" />
                </div>
                <span className="font-bold italic text-xl">
                  {activeCard.brand === 'mastercard' ? 'Mastercard' : 'Visa'}
                </span>
              </div>
              <div className="space-y-4">
                <div className="font-mono text-xl tracking-widest flex justify-between">
                  {activeCard.number.split(' ').map((chunk, i) => (
                    <span key={i}>{showDetails && activeCard.status !== 'locked' ? chunk : '••••'}</span>
                  ))}
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[8px] uppercase tracking-widest mb-1 opacity-60">Titular</p>
                    <p className="font-bold tracking-widest text-sm">{activeCard.holder}</p>
                  </div>
                  <div>
                    <p className="text-[8px] uppercase tracking-widest mb-1 opacity-60">Validade</p>
                    <p className="font-mono text-sm">{showDetails ? activeCard.expiry : '••/••'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className="absolute inset-0 rotate-y-180 backface-hidden rounded-3xl overflow-hidden shadow-2xl border bg-[#0a0a0a] border-white/10"
            style={{ transform: 'rotateY(180deg)' }}
          >
            <div className="w-full h-14 bg-black mt-6" />
            <div className="p-6 flex items-center gap-4">
              <div className="bg-white h-10 w-2/3 flex items-center justify-end px-4 rounded-md">
                <span className="font-mono text-black font-bold">---</span>
              </div>
              <p className="text-[8px] text-gray-500 flex-1">CVC virtual — emissão física na Onda C</p>
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 opacity-50">
              <ShieldCheck className="w-10 h-10 text-gray-600" />
              <span className="text-[8px] font-bold uppercase text-gray-500 text-center">
                Regenera Bank
                <br />
                {activeCard.alias}
              </span>
            </div>
          </div>
        </div>
      </div>

      {notification && (
        <div
          className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 backdrop-blur-xl border px-6 py-4 rounded-full flex items-center gap-3 z-50 shadow-2xl ${
            notification.type === 'alert'
              ? 'bg-red-950/90 border-red-500/50 text-red-100'
              : 'bg-bg-deep/90 border-emerald-500/50 text-white'
          }`}
        >
          {notification.type === 'alert' ? (
            <AlertTriangle className="w-5 h-5 text-red-500" />
          ) : (
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          )}
          <span className="text-sm font-bold">{notification.msg}</span>
        </div>
      )}

      <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
        <div className="flex gap-2">
          {cards.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveCardIndex(idx)}
              className={`h-1.5 rounded-full transition-all ${activeCardIndex === idx ? 'w-8 bg-cyan-400' : 'w-2 bg-gray-600'}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white"
        >
          {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showDetails ? 'Ocultar' : 'Ver dados'}
        </button>
      </div>

      <div
        className={`bg-gradient-to-b from-white/10 to-white/5 rounded-3xl p-6 border border-white/10 ${activeCard.status === 'locked' ? 'opacity-50' : ''}`}
      >
        <div className="flex justify-between text-xs text-gray-400 uppercase tracking-widest font-bold mb-3">
          <span>Gastos no período (domínio cartões)</span>
          <span>
            {activeCard.limit > 0
              ? `${Math.round((activeCard.used / activeCard.limit) * 100)}%`
              : '0%'}
          </span>
        </div>
        <div className="h-4 w-full bg-black/40 rounded-full overflow-hidden mb-6 border border-white/5 p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-400 transition-all duration-1000"
            style={{
              width: `${Math.min(activeCard.limit > 0 ? (activeCard.used / activeCard.limit) * 100 : 0, 100)}%`,
            }}
          />
        </div>
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="limit-slider" className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-2">
              <DollarSign className="w-3 h-3" /> Teto de gasto
            </label>
            <span className="text-white font-mono text-sm font-bold bg-white/10 px-2 py-1 rounded">
              R$ {activeCard.limit.toLocaleString('pt-BR')}
            </span>
          </div>
          <input
            id="limit-slider"
            type="range"
            min={activeCard.used}
            max={Math.max(activeCard.limit, activeCard.used)}
            step={100}
            value={activeCard.limit}
            onChange={handleLimitChange}
            onMouseUp={() => void commitLimitChange()}
            onTouchEnd={() => void commitLimitChange()}
            disabled={activeCard.status === 'locked'}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-50"
          />
        </div>
        <div className="flex justify-between text-sm text-white pt-4 border-t border-white/5">
          <div>
            <p className="text-[10px] text-gray-500 uppercase">Utilizado</p>
            <span className="font-bold text-xl">
              R$ {activeCard.used.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-500 uppercase">Limite BFF</p>
            <span className="text-emerald-400 font-bold text-lg">
              R$ {activeCard.limit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={(e) => void toggleLock(e)}
          className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border transition-all active:scale-95 ${
            activeCard.status === 'locked'
              ? 'bg-emerald-500/10 border-emerald-500/50'
              : highlightBlock
                ? 'bg-red-500/20 border-red-500 animate-pulse'
                : 'bg-white/5 border-white/10 hover:border-red-500/30'
          }`}
        >
          {activeCard.status === 'locked' ? (
            <Unlock className="w-6 h-6 text-emerald-400" />
          ) : (
            <Lock className="w-6 h-6 text-gray-300" />
          )}
          <span className="text-[10px] font-bold uppercase tracking-widest">
            {activeCard.status === 'locked' ? 'Desbloquear' : 'Bloquear'}
          </span>
        </button>
        <button
          type="button"
          onClick={() => handleCopy(activeCard.number)}
          className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all active:scale-95"
        >
          <Copy className="w-6 h-6 text-gray-300" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Copiar Nº</span>
        </button>
        <button
          type="button"
          disabled={creatingVirtual}
          onClick={() => void handleCreateVirtual()}
          className="col-span-2 flex items-center justify-center gap-3 py-4 rounded-2xl bg-gradient-to-r from-blue-900/40 to-cyan-900/40 border border-cyan-500/30 text-cyan-400 disabled:opacity-50 active:scale-[0.99]"
        >
          {creatingVirtual ? <Loader2 className="w-5 h-5 animate-spin" /> : <Smartphone className="w-5 h-5" />}
          <span className="text-xs font-bold uppercase tracking-widest">
            {creatingVirtual ? 'Emitindo no BFF...' : 'Criar cartão virtual (POST /products/cards/virtual)'}
          </span>
        </button>
        <button
          type="button"
          disabled={statementLoading}
          onClick={() => void handleLoadStatement()}
          className="col-span-2 flex items-center justify-center gap-3 py-4 rounded-2xl bg-yellow-900/20 border border-yellow-600/30 text-yellow-500 disabled:opacity-50 active:scale-[0.99]"
        >
          {statementLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
          <span className="text-xs font-bold uppercase tracking-widest">
            {invoice || cardTxs ? 'Ocultar fatura & lançamentos' : 'Ver fatura & lançamentos'}
          </span>
        </button>
      </div>

      {(invoice || (cardTxs && cardTxs.length > 0)) && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4" data-testid="card-statement">
          {invoice && (
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                  Fatura {invoice.period} · vence {invoice.dueDate}
                </p>
                <p className="text-xl font-bold text-white">
                  {centsToReais(invoice.totalCents).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
              <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full border ${
                invoice.status === 'paid'
                  ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                  : 'text-amber-400 border-amber-500/30 bg-amber-500/10'
              }`}>
                {invoice.status === 'paid' ? 'Paga' : 'Aberta'}
              </span>
            </div>
          )}
          {cardTxs && cardTxs.length > 0 && (
            <div className="space-y-2">
              {cardTxs.slice(0, 8).map((tx) => (
                <div key={tx.id} className="flex justify-between items-center text-sm py-1 gap-3">
                  <div className="min-w-0">
                    <p className="text-white font-medium truncate">{tx.title}</p>
                    <p className="text-[10px] text-gray-500">{tx.date}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-gray-300">
                      {centsToReais(tx.amountCents).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                    <button
                      type="button"
                      disabled={contesting === tx.id}
                      onClick={() => void handleContest(tx)}
                      className="text-[9px] font-bold uppercase tracking-widest text-red-300 border border-red-500/30 rounded-lg px-2 py-1 hover:bg-red-500/10 disabled:opacity-40"
                    >
                      {contesting === tx.id ? '...' : 'Contestar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="flex items-center justify-center gap-2 opacity-40">
        <Activity className="w-4 h-4" />
        <span className="text-[9px] uppercase tracking-widest">Fonte: BFF products/cards</span>
      </div>
    </div>
  );
};

export default CardsModule;