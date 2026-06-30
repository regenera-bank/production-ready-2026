import React, { useMemo } from 'react';
import { Transaction } from '../../types';
import { BarChart3, Zap, Shield, Rocket, RefreshCcw, ChevronRight } from 'lucide-react';
import PremiumChart from '../UI/PremiumChart';

interface StatementInsightsProps {
    transactions: Transaction[];
    onAction?: (action: string, params?: unknown) => void;
}

const formatBrl = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const StatementInsights: React.FC<StatementInsightsProps> = ({ transactions }) => {
    const { insights, score } = useMemo(() => {
        const outflows = transactions.filter((t) => t.type === 'outflow');
        const inflows = transactions.filter((t) => t.type === 'inflow');
        const outflowTotal = outflows.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const inflowTotal = inflows.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const net = inflowTotal - outflowTotal;
        const score = Math.max(0, Math.min(100, Math.round(50 + net / 100)));

        const topCategory = outflows.reduce<Record<string, number>>((acc, t) => {
          acc[t.category] = (acc[t.category] ?? 0) + Math.abs(t.amount);
          return acc;
        }, {});
        const dominant = Object.entries(topCategory).sort((a, b) => b[1] - a[1])[0];

        const insights = [
            {
                id: '1',
                type: 'opportunity',
                title: 'Fluxo líquido do período',
                description:
                  net >= 0
                    ? `Entradas (${formatBrl(inflowTotal)}) superam saídas (${formatBrl(outflowTotal)}).`
                    : `Saídas (${formatBrl(outflowTotal)}) superam entradas (${formatBrl(inflowTotal)}).`,
                impact: formatBrl(net),
                icon: Rocket,
                color: 'text-cyan-400',
                bg: 'bg-cyan-400/10',
            },
            {
                id: '2',
                type: 'warning',
                title: 'Categoria dominante',
                description: dominant
                  ? `Maior volume de gastos em ${dominant[0]}: ${formatBrl(dominant[1])}.`
                  : 'Sem gastos classificados no extrato ainda.',
                impact: dominant ? formatBrl(dominant[1]) : '—',
                icon: Zap,
                color: 'text-amber-400',
                bg: 'bg-amber-400/10',
            },
            {
                id: '3',
                type: 'security',
                title: 'Fonte dos dados',
                description: `Cálculo sobre ${transactions.length} lançamentos do extrato BFF/core-bank.`,
                impact: `${transactions.length} transações`,
                icon: Shield,
                color: 'text-emerald-400',
                bg: 'bg-emerald-400/10',
            },
        ];

        return { insights, score, outflowTotal, inflowTotal };
    }, [transactions]);

    const chartData = useMemo(
      () =>
        transactions.slice(0, 7).map((t) => ({
          label: t.date.slice(5, 10),
          value: Math.abs(t.amount),
        })),
      [transactions],
    );

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-700">
            <div className="relative bg-gradient-to-br from-bg-mid to-bg-deep border border-white/10 rounded-[2.5rem] p-8 overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <BarChart3 className="w-40 h-40 text-cyan-400" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90">
                            <circle
                                cx="64" cy="64" r="58"
                                className="stroke-white/5 fill-none"
                                strokeWidth="8"
                            />
                            <circle
                                cx="64" cy="64" r="58"
                                className="stroke-cyan-400 fill-none transition-all duration-1000 ease-out"
                                strokeWidth="8"
                                strokeDasharray={`${score * 3.64} 364`}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-black text-white">{score}</span>
                            <span className="text-[8px] font-bold text-cyan-400 uppercase tracking-widest">Índice</span>
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <h2 className="text-2xl font-bold text-white mb-2">Resumo do extrato</h2>
                        <p className="text-gray-400 text-sm leading-relaxed max-w-md">
                          Métricas derivadas do ledger via BFF.
                        </p>
                        <button
                          type="button"
                          onClick={() => window.location.reload()}
                          className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-cyan-400 hover:text-white transition-colors mx-auto md:mx-0"
                        >
                            <RefreshCcw className="w-3 h-3" /> Atualizar
                        </button>
                    </div>
                </div>
            </div>

            {chartData.length > 0 && (
              <PremiumChart
                data={chartData.map((d) => d.value)}
                label="Últimos lançamentos (valor absoluto)"
                color="#22d3ee"
              />
            )}

            <div className="grid gap-4">
                {insights.map((insight) => (
                    <div
                      key={insight.id}
                      className={`p-6 rounded-[2rem] border border-white/5 ${insight.bg} flex items-start gap-4 group hover:border-white/10 transition-all`}
                    >
                        <div className={`p-3 rounded-2xl bg-black/20 ${insight.color}`}>
                            <insight.icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="font-bold text-white text-sm">{insight.title}</h3>
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${insight.color}`}>
                                  {insight.impact}
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 leading-relaxed">{insight.description}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors mt-1" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StatementInsights;