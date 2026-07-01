
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MoneyDisplay, PendingOperationCard } from '@regenera/design-web';
import { TrendingUp, ArrowUpRight, Wallet, PieChart } from 'lucide-react';
import type { BankingModuleProps } from '../../types';
import PremiumChart from '../UI/PremiumChart';
import {
  balanceTrend,
  investmentTransactions,
  sumInflows,
  sumOutflows,
} from '../../platform/module-data';
import {
  fetchInvestmentCatalog,
  fetchInvestmentOrders,
  fetchInvestmentPositions,
  placeInvestmentOrder,
  type InvestmentCatalogItemDto,
  type InvestmentOrderDto,
  type InvestmentPositionDto,
} from '../../platform/bff-client';

const Investments: React.FC<BankingModuleProps> = ({
  user,
  transactions,
  accessToken,
  onNavigate,
}) => {
  const [catalog, setCatalog] = useState<InvestmentCatalogItemDto[]>([]);
  const [positions, setPositions] = useState<InvestmentPositionDto[]>([]);
  const [orders, setOrders] = useState<InvestmentOrderDto[]>([]);
  const [placing, setPlacing] = useState(false);

  const loadData = useCallback(async () => {
    const [cat, pos, hist] = await Promise.all([
      fetchInvestmentCatalog(accessToken),
      fetchInvestmentPositions(accessToken),
      fetchInvestmentOrders(accessToken),
    ]);
    setCatalog(cat);
    setPositions(pos);
    setOrders(hist);
  }, [accessToken]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const invTx = useMemo(() => investmentTransactions(transactions), [transactions]);
  const chartData = useMemo(
    () => balanceTrend(transactions, user.balance),
    [transactions, user.balance],
  );
  const net = sumInflows(transactions) - sumOutflows(transactions);
  const monthlyPct =
    user.balance > 0 ? ((net / user.balance) * 100).toFixed(1) : '0.0';

  const balanceCents = user.availableBalanceCents ?? String(Math.round(user.balance * 100));

  const allocations = useMemo(() => {
    const aplicado = positions.reduce((s, p) => s + Number(p.amountCents), 0);
    const conta = Number(balanceCents);
    const disponivel = Math.max(conta - aplicado, 0);
    return [
      { label: 'Conta corrente', valueCents: String(Math.max(conta - aplicado, 0)), color: '#22d3ee' },
      { label: 'Posições sandbox', valueCents: String(aplicado), color: '#34d399' },
      { label: 'Disponível p/ aplicar', valueCents: String(disponivel), color: '#818cf8' },
    ].filter((a) => BigInt(a.valueCents) > 0n);
  }, [balanceCents, positions]);

  const handlePlaceOrder = async (product: InvestmentCatalogItemDto) => {
    setPlacing(true);
    try {
      await placeInvestmentOrder(
        accessToken,
        product.id,
        product.minAmountCents,
        `inv-order-${product.id}-${Date.now()}`,
      );
      await loadData();
    } finally {
      setPlacing(false);
    }
  };

  const pendingOrders = orders.filter((o) => o.status === 'pending');

  return (
    <div className="p-6 space-y-8 animate-in slide-in-from-right duration-500 pb-32">
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
            <MoneyDisplay amountCents={balanceCents} size="hero" />
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
            Disponível para operar:{' '}
            <MoneyDisplay
              amountCents={user.availableBalanceCents ?? String(Math.round(user.availableBalance * 100))}
              size="sm"
            />
          </p>
        </div>
        <div className="h-24 w-full opacity-80 px-2 pb-2">
          <PremiumChart data={chartData} color="#34d399" height={100} />
        </div>
      </div>

      {pendingOrders.map((order) => (
        <PendingOperationCard
          key={order.id}
          title={order.productName}
          subtitle="Ordem sandbox em processamento"
          amountCents={order.amountCents}
          status="PROCESSING"
        />
      ))}

      <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6">
        <div className="flex items-center gap-3 mb-6">
          <PieChart className="w-6 h-6 text-cyan-400" />
          <h3 className="font-bold text-white text-lg">Composição (BFF + sandbox)</h3>
        </div>
        {allocations.length === 0 ? (
          <p className="text-sm text-gray-400">Sem saldo registrado no core-bank.</p>
        ) : (
          <div className="space-y-4">
            {allocations.map((item) => (
              <div key={item.label} className="flex justify-between items-center">
                <span className="text-sm text-gray-300">{item.label}</span>
                <MoneyDisplay amountCents={item.valueCents} size="sm" />
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">
          Catálogo sandbox
        </h3>
        <div className="space-y-3">
          {catalog.map((product) => (
            <div
              key={product.id}
              className="bg-white/5 border border-white/5 p-4 rounded-2xl flex justify-between items-center gap-4"
            >
              <div>
                <p className="font-bold text-white text-sm">{product.name}</p>
                <p className="text-[10px] text-gray-500">
                  Mín. <MoneyDisplay amountCents={product.minAmountCents} size="sm" /> · {product.expectedYieldPct}% a.a.
                </p>
              </div>
              <button
                type="button"
                disabled={placing}
                onClick={() => void handlePlaceOrder(product)}
                className="text-xs font-bold uppercase tracking-widest text-cyan-400 hover:text-white disabled:opacity-50"
              >
                Aplicar
              </button>
            </div>
          ))}
        </div>
      </div>

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
                <MoneyDisplay
                  amountCents={String(Math.round(Math.abs(t.amount) * 100))}
                  size="sm"
                  variant="credit"
                />
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