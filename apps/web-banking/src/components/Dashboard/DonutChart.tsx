
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useMemo, useState, useEffect } from 'react';
import { Transaction } from '../../types';

interface ChartData {
    name: string;
    color: string;
    pct: number;
    amount: number;
    offset: number;
}

const CATEGORY_META: Record<
  Transaction['category'],
  { label: string; color: string }
> = {
  lifestyle: { label: 'Lifestyle', color: 'text-emerald-500' },
  essential: { label: 'Essencial', color: 'text-primary' },
  transport: { label: 'Transporte', color: 'text-amber-500' },
  leisure: { label: 'Lazer', color: 'text-fuchsia-400' },
  investment: { label: 'Investimento', color: 'text-cyan-400' },
};

interface DonutChartProps {
  transactions: Transaction[];
}

const DonutChart: React.FC<DonutChartProps> = ({ transactions }) => {
    const [activeSlice, setActiveSlice] = useState<number | null>(null);
    const [animated, setAnimated] = useState(false);

    const { categories, totalOutflow } = useMemo(() => {
        const outflows = transactions.filter((t) => t.type === 'outflow');
        const byCategory = outflows.reduce<Record<string, number>>((acc, t) => {
          acc[t.category] = (acc[t.category] ?? 0) + Math.abs(t.amount);
          return acc;
        }, {});
        const entries = Object.entries(byCategory).filter(([, v]) => v > 0);
        const total = entries.reduce((sum, [, v]) => sum + v, 0);
        if (total <= 0) {
          return { categories: [] as ChartData[], totalOutflow: 0 };
        }
        let offset = 0;
        const categories: ChartData[] = entries.map(([cat, amount]) => {
          const meta = CATEGORY_META[cat as Transaction['category']] ?? {
            label: cat,
            color: 'text-gray-400',
          };
          const pct = Math.round((amount / total) * 100);
          const slice: ChartData = {
            name: meta.label,
            color: meta.color,
            pct,
            amount,
            offset,
          };
          offset += pct;
          return slice;
        });
        return { categories, totalOutflow: total };
    }, [transactions]);

    useEffect(() => {
        const timer = setTimeout(() => setAnimated(true), 100);
        return () => clearTimeout(timer);
    }, []);

    if (categories.length === 0) {
      return (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center">
          <p className="text-sm text-gray-400">Sem saídas no extrato para categorizar</p>
        </div>
      );
    }

    const dashTotal = 100;

    return (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md flex flex-col items-center shadow-2xl relative overflow-hidden group">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="mb-6 z-10 relative w-64 h-64 flex items-center justify-center">
                <svg viewBox="0 0 40 40" className="w-full h-full transform -rotate-90 drop-shadow-xl">
                    <circle cx="20" cy="20" r="16" fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="3" />
                    {categories.map((cat, i) => (
                        <circle
                            key={i}
                            cx="20" cy="20" r="16"
                            fill="transparent"
                            stroke="currentColor"
                            strokeWidth={activeSlice === i ? '4' : '3'}
                            strokeDasharray={`${animated ? cat.pct : 0} ${dashTotal}`}
                            strokeDashoffset={-cat.offset}
                            strokeLinecap="round"
                            className={`${cat.color} transition-all duration-1000 ease-out cursor-pointer hover:opacity-100 opacity-90`}
                            onClick={() => setActiveSlice(activeSlice === i ? null : i)}
                        />
                    ))}
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] text-gray-400 uppercase tracking-[0.2em] mb-1 opacity-70">
                        {activeSlice !== null ? categories[activeSlice].name : 'Saídas'}
                    </span>
                    <span className="text-3xl font-bold text-white tracking-tight">
                        {activeSlice !== null
                            ? categories[activeSlice].amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                            : totalOutflow.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                </div>
            </div>

            <div className={`w-full grid gap-2 ${categories.length <= 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {categories.map((item, idx) => (
                    <button
                        key={idx}
                        type="button"
                        className={`flex flex-col items-center p-3 rounded-2xl border transition-all duration-300 ${activeSlice === idx ? 'bg-white/10 border-white/20 scale-105 shadow-lg' : 'bg-transparent border-transparent hover:bg-white/5'}`}
                        onClick={() => setActiveSlice(activeSlice === idx ? null : idx)}
                    >
                        <span className={`w-1.5 h-1.5 rounded-full ${item.color.replace('text-', 'bg-')} mb-2`}></span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider">{item.name}</span>
                        <span className="text-xs font-bold text-white mt-1">{item.pct}%</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default DonutChart;