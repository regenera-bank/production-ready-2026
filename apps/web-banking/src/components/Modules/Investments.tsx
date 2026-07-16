
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { TrendingUp, ArrowUpRight, Wallet, PieChart, Loader2 } from 'lucide-react';
import type { BankingModuleProps } from '../../types';
import PremiumChart from '../UI/PremiumChart';
import SandboxBanner from '../UI/SandboxBanner';
import {
  balanceTrend,
  investmentTransactions,
  sumInflows,
  sumOutflows,
} from '../../platform/module-data';
import {
  centsToReais,
  fetchInvestmentCatalog,
  fetchInvestmentOrders,
  fetchInvestmentPositions,
  fetchInvestmentsActivation,
  type ActivationStatusDto,
  placeInvestmentOrder,
  type InvestmentCatalogItemDto,
  type InvestmentOrderDto,
  type InvestmentPositionDto,
} from '../../platform/bff-client';
import { createIdempotencyKey } from '../../platform/money';

const formatBrl = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const Investments: React.FC<BankingModuleProps> = ({
  user,
  transactions,
  accessToken,
  onNavigate,
}) => {
  const [catalog, setCatalog] = useState<InvestmentCatalogItemDto[]>([]);
  const [positions, setPositions] = useState<InvestmentPositionDto[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [orderBusy, setOrderBusy] = useState<string | null>(null);
  const [orders, setOrders] = useState<InvestmentOrderDto[]>([]);
  const [orderFeedback, setOrderFeedback] = useState<{ msg: string; ok: boolean } | null>(null);
  const [activation, setActivation] = useState<ActivationStatusDto | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    void fetchInvestmentsActivation(accessToken)
      .then(setActivation)
      .catch(() => setActivation(null));
  }, [accessToken]);

  const invTx = useMemo(() => investmentTransactions(transactions), [transactions]);
  const chartData = useMemo(
    () => balanceTrend(transactions, user.balance),
    [transactions, user.balance],
  );
  const net = sumInflows(transactions) - sumOutflows(transactions);
  const monthlyPct =
    user.balance > 0 ? ((net / user.balance) * 100).toFixed(1) : '0.0';

  const allocations = useMemo(() => {
    const aplicadoBff = positions.reduce((s, p) => s + centsToReais(p.amountCents), 0);
    const aplicadoTx = invTx.reduce((s, t) => s + Math.abs(t.amount), 0);
    const aplicado = Math.max(aplicadoBff, aplicadoTx);
    const conta = user.balance;
    const disponivel = Math.max(user.availableBalance - aplicado, 0);
    return [
      { label: 'Conta corrente', value: Math.max(conta - aplicado, 0), color: '#22d3ee' },
      { label: 'Posições BFF', value: aplicadoBff, color: '#34d399' },
      { label: 'Disponível p/ aplicar', value: disponivel, color: '#818cf8' },
    ].filter((a) => a.value > 0);
  }, [user, invTx, positions]);

  const loadCatalog = useCallback(async () => {
    if (!accessToken) {
      setCatalogLoading(false);
      return;
    }
    setCatalogLoading(true);
    try {
      const [cat, pos, ord] = await Promise.all([
        fetchInvestmentCatalog(accessToken),
        fetchInvestmentPositions(accessToken),
        fetchInvestmentOrders(accessToken).catch(() => [] as InvestmentOrderDto[]),
      ]);
      setCatalog(cat);
      setPositions(pos);
      setOrders(ord);
    } catch {
      setCatalog([]);
      setPositions([]);
    } finally {
      setCatalogLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const handleOrder = async (product: InvestmentCatalogItemDto) => {
    if (!accessToken || orderBusy) {
      return;
    }
    setOrderBusy(product.id);
    setOrderFeedback(null);
    try {
      const result = await placeInvestmentOrder(
        accessToken,
        product.id,
        product.minAmountCents,
        createIdempotencyKey('invest'),
      );
      await loadCatalog();
      setOrderFeedback({
        ok: true,
        msg: `Ordem ${result.status} · ledger ${result.ledgerPaymentId ?? '—'}${
          result.balanceCents
            ? ` · saldo ${formatBrl(centsToReais(result.balanceCents))}`
            : ''
        }`,
      });
    } catch (err) {
      setOrderFeedback({
        ok: false,
        msg: err instanceof Error ? err.message : 'Falha ao aplicar — nenhum débito realizado',
      });
    } finally {
      setOrderBusy(null);
    }
  };

  return (
    <div
      className="p-6 space-y-8 animate-in slide-in-from-right duration-500 pb-32"
      data-testid="view-investments"
    >
      <SandboxBanner
        label={
          activation
            ? `${activation.sandbox ? 'Sandbox · ' : ''}${activation.message || 'Investimentos via GET /products/investments/*'}${activation.externalProviderActive ? ' · provedor externo ativo' : ''}`
            : 'Investimentos · dados reais de GET /products/investments/*'
        }
      />

      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-950 to-bg-mid border border-emerald-500/20 shadow-2xl">
        <div className="relative z-10 p-8">
          <div className="flex justify-between items-center mb-6">
            <span className="text-emerald-400 font-bold uppercase text-xs tracking-[0.2em] flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Patrimônio em conta
            </span>
            <TrendingUp className="text-emerald-400 w-5 h-5" />
          </div>
          <h2 className="text-4xl font-bold text-white mb-2 tracking-tight">
            {formatBrl(user.balance)}
          </h2>
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-bold px-2 py-1 rounded ${
                Number(monthlyPct) >= 0
                  ? 'text-emerald-300 bg-emerald-500/10'
                  : 'text-red-300 bg-red-500/10'
              }`}
            >
              {Number(monthlyPct) >= 0 ? '+' : ''}
              {monthlyPct}%
            </span>
            <span className="text-xs text-gray-400">fluxo líquido no extrato</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-4">
            Disponível para operar: {formatBrl(user.availableBalance)}
          </p>
        </div>
        <div className="h-24 w-full opacity-80 px-2 pb-2">
          <PremiumChart data={chartData} color="#34d399" height={100} />
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6">
        <div className="flex items-center gap-3 mb-6">
          <PieChart className="w-6 h-6 text-cyan-400" />
          <h3 className="font-bold text-white text-lg">Composição (ledger BFF)</h3>
        </div>
        {allocations.length === 0 ? (
          <p className="text-sm text-gray-400">Sem saldo registrado no core-bank.</p>
        ) : (
          <div className="space-y-4">
            {allocations.map((item) => (
              <div key={item.label} className="flex justify-between items-center">
                <span className="text-sm text-gray-300">{item.label}</span>
                <span className="font-bold text-white">{formatBrl(item.value)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">
          Catálogo BFF
        </h3>
        {catalogLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        ) : catalog.length === 0 ? (
          <p className="text-sm text-gray-400">Catálogo indisponível.</p>
        ) : (
          <div className="space-y-3">
            {catalog.map((product) => (
              <div
                key={product.id}
                className="bg-white/5 border border-white/5 p-4 rounded-2xl flex justify-between items-center gap-4"
                data-testid={`investment-product-${product.id}`}
              >
                <div>
                  <p className="font-bold text-white text-sm">{product.name}</p>
                  <p className="text-[10px] text-gray-500">
                    Mín. {formatBrl(centsToReais(product.minAmountCents))} · {product.expectedYieldPct}% ·{' '}
                    {product.risk}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={orderBusy === product.id}
                  onClick={() => void handleOrder(product)}
                  className="px-3 py-2 rounded-lg bg-emerald-600/80 text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
                >
                  {orderBusy === product.id ? '...' : 'Aplicar'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {orderFeedback && (
        <p
          data-testid="investment-order-feedback"
          className={`text-xs text-center rounded-xl border py-3 px-4 ${
            orderFeedback.ok
              ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10'
              : 'text-red-300 border-red-500/30 bg-red-500/10'
          }`}
        >
          {orderFeedback.msg}
        </p>
      )}

      {orders.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">
            Minhas ordens (GET /products/investments/orders)
          </h3>
          <div className="space-y-3">
            {orders.slice(0, 6).map((order) => (
              <div
                key={order.id}
                className="bg-white/5 border border-white/5 p-4 rounded-2xl flex justify-between items-center"
              >
                <div>
                  <p className="font-bold text-white text-sm">{order.productName}</p>
                  <p className="text-[10px] text-gray-500">{order.createdAt}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-emerald-400 text-sm">
                    {formatBrl(centsToReais(order.amountCents))}
                  </p>
                  <p className="text-[10px] uppercase text-gray-500">{order.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">
          Lançamentos com perfil investimento
        </h3>
        {invTx.length === 0 ? (
          <div className="bg-white/5 border border-dashed border-white/10 rounded-2xl p-8 text-center">
            <p className="text-sm text-gray-400 mb-4">
              Nenhuma aplicação registrada no extrato ainda.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('transactions')}
              className="text-cyan-400 text-xs font-bold uppercase tracking-widest hover:text-white"
            >
              Ver extrato completo
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {invTx.slice(0, 6).map((t) => (
              <div
                key={t.id}
                className="bg-white/5 border border-white/5 p-4 rounded-2xl flex justify-between items-center"
              >
                <div>
                  <p className="font-bold text-white text-sm">{t.title}</p>
                  <p className="text-[10px] text-gray-500">{t.date}</p>
                </div>
                <span className="font-mono text-emerald-400">
                  {formatBrl(Math.abs(t.amount))}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => onNavigate('pix')}
        className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-bold text-white uppercase tracking-widest flex items-center justify-center gap-3"
      >
        <ArrowUpRight className="w-4 h-4" />
        Aportar via Pix (saldo real)
      </button>
    </div>
  );
};

export default Investments;