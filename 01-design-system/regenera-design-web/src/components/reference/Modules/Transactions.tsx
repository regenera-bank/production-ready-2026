
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useMemo } from 'react';
import DonutChart from '../Dashboard/DonutChart';
import { Transaction } from '../../types';
import { Filter, Calendar, Download, Search, X, ArrowUp, ArrowDown, ListFilter, SlidersHorizontal } from 'lucide-react';

// Mock data using consistent date formats for robust sorting logic
const MOCK_TRANSACTIONS_FULL: Transaction[] = [
  { id: '1', title: 'PIX Recebido', party: 'João Silva', date: 'Hoje 14:30', amount: 2500, type: 'inflow', icon: 'currency_exchange', category: 'lifestyle' },
  { id: '2', title: 'Compra Online', party: 'Amazon', date: 'Ontem 19:45', amount: -299.90, type: 'outflow', icon: 'shopping_cart', category: 'leisure' },
  { id: '4', title: 'Restaurante Savor', party: 'Cartão Final 8429', date: '24/11', amount: -320.00, type: 'outflow', icon: 'restaurant', category: 'lifestyle' },
  { id: '5', title: 'Posto Shell', party: 'Automóvel', date: '23/11', amount: -180.00, type: 'outflow', icon: 'local_gas_station', category: 'transport' },
  { id: '6', title: 'Assinatura AI', party: 'Google', date: '22/11', amount: -45.00, type: 'outflow', icon: 'smart_toy', category: 'essential' },
  { id: '7', title: 'Dividendo FII', party: 'HGLG11', date: '20/11', amount: 150.00, type: 'inflow', icon: 'trending_up', category: 'investment' },
  { id: '8', title: 'Academia Smart', party: 'Pagamento Recorrente', date: '19/11', amount: -110.00, type: 'outflow', icon: 'fitness_center', category: 'lifestyle' },
  { id: '9', title: 'Uber Trip', party: 'Uber Technologies', date: '19/11', amount: -24.90, type: 'outflow', icon: 'local_taxi', category: 'transport' },
];

interface TransactionsModuleProps {
    globalSearchQuery?: string;
}

interface SortConfig {
    key: 'date' | 'amount' | 'type';
    direction: 'asc' | 'desc';
}

const TransactionsModule: React.FC<TransactionsModuleProps> = ({ globalSearchQuery = '' }) => {
    const [typeFilter, setTypeFilter] = useState<'all' | 'in' | 'out'>('all');
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'date', direction: 'desc' });

    const categories = Array.from(new Set(MOCK_TRANSACTIONS_FULL.map(t => t.category)));

    const handleSort = (key: SortConfig['key']) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const getSortIcon = (key: SortConfig['key']) => {
        if (sortConfig.key !== key) return <SlidersHorizontal className="w-3 h-3 ml-1 opacity-50" />;
        return sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />;
    };

    // Helper to parse loose date strings into timestamps for sorting
    const parseDateScore = (dateStr: string): number => {
        if (dateStr.toLowerCase().includes('hoje')) return Number.MAX_SAFE_INTEGER;
        if (dateStr.toLowerCase().includes('ontem')) return Number.MAX_SAFE_INTEGER - 1;
        
        // Parse "DD/MM" - assume current year
        const match = dateStr.match(/(\d{1,2})\/(\d{1,2})/);
        if (match) {
            const day = parseInt(match[1]);
            const month = parseInt(match[2]);
            const currentYear = new Date().getFullYear();
            return new Date(currentYear, month - 1, day).getTime();
        }
        return 0;
    };

    const filtered = useMemo(() => {
        // 1. Filter
        const result = MOCK_TRANSACTIONS_FULL.filter(t => {
            // Type Filter
            if (typeFilter !== 'all') {
                if (typeFilter === 'in' && t.type !== 'inflow') return false;
                if (typeFilter === 'out' && t.type !== 'outflow') return false;
            }

            // Category Filter
            if (categoryFilter && t.category !== categoryFilter) return false;

            // Global Search Query
            if (globalSearchQuery) {
                const query = globalSearchQuery.toLowerCase();
                return (
                    t.title.toLowerCase().includes(query) ||
                    t.party.toLowerCase().includes(query) ||
                    t.amount.toString().includes(query)
                );
            }

            return true;
        });

        // 2. Sort
        return result.sort((a, b) => {
            let comparison = 0;
            
            if (sortConfig.key === 'amount') {
                comparison = Math.abs(a.amount) - Math.abs(b.amount);
            } else if (sortConfig.key === 'date') {
                comparison = parseDateScore(a.date) - parseDateScore(b.date);
            } else if (sortConfig.key === 'type') {
                comparison = a.type.localeCompare(b.type);
            }

            return sortConfig.direction === 'asc' ? comparison : -comparison;
        });
    }, [typeFilter, globalSearchQuery, categoryFilter, sortConfig]);

    return (
        <div className="p-6 animate-in slide-in-from-right duration-500 pb-32">
             <div className="mb-8">
                 <DonutChart />
             </div>

             <div className="flex items-center justify-between mb-6">
                 <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">Fluxo de Caixa</h3>
                 <div className="flex gap-2">
                     <button className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors" title="Exportar Extrato">
                         <Download className="w-4 h-4" />
                     </button>
                 </div>
             </div>

             {/* Sorting & Type Filters */}
             <div className="space-y-4 mb-6">
                 
                 {/* Sort Options */}
                 <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                     <div className="p-2 bg-white/5 rounded-lg border border-white/5 mr-2">
                         <ListFilter className="w-4 h-4 text-gray-400" />
                     </div>
                     <button 
                         onClick={() => handleSort('date')}
                         className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center border transition-all ${sortConfig.key === 'date' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-white/5 border-transparent text-gray-500 hover:bg-white/10'}`}
                     >
                         Data {getSortIcon('date')}
                     </button>
                     <button 
                         onClick={() => handleSort('amount')}
                         className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center border transition-all ${sortConfig.key === 'amount' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-white/5 border-transparent text-gray-500 hover:bg-white/10'}`}
                     >
                         Valor {getSortIcon('amount')}
                     </button>
                     <button 
                         onClick={() => handleSort('type')}
                         className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center border transition-all ${sortConfig.key === 'type' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-white/5 border-transparent text-gray-500 hover:bg-white/10'}`}
                     >
                         Tipo {getSortIcon('type')}
                     </button>
                 </div>

                 {/* Type Toggles */}
                 <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/5">
                     {['all', 'in', 'out'].map(f => (
                         <button 
                            key={f}
                            onClick={() => setTypeFilter(f as any)}
                            className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                                typeFilter === f 
                                ? 'bg-bg-deep border border-white/10 text-white shadow-sm' 
                                : 'text-gray-500 hover:text-white hover:bg-white/5'
                            }`}
                         >
                             {f === 'all' ? 'Tudo' : f === 'in' ? 'Entradas' : 'Saídas'}
                         </button>
                     ))}
                 </div>

                 {/* Category Chips */}
                 <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                     <button 
                        onClick={() => setCategoryFilter(null)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap border transition-all ${
                            !categoryFilter ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/30'
                        }`}
                     >
                        Todas
                     </button>
                     {categories.map(cat => (
                         <button 
                            key={cat}
                            onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap border transition-all ${
                                categoryFilter === cat 
                                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' 
                                : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/30'
                            }`}
                         >
                            {cat}
                         </button>
                     ))}
                 </div>
             </div>

             {/* Results List */}
             <div className="space-y-3">
                {filtered.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-sm">Nenhuma transação encontrada.</p>
                    </div>
                ) : (
                    filtered.map((t, idx) => (
                        <div 
                            key={t.id + '_tx'} 
                            style={{ animationDelay: `${idx * 50}ms` }}
                            className="bg-bg-mid/50 border border-white/5 p-4 rounded-2xl flex items-center justify-between hover:bg-white/5 transition-colors group cursor-pointer animate-in slide-in-from-bottom-2 fill-mode-backwards"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform ${t.type === 'inflow' ? 'bg-emerald-500/10 text-emerald-400 group-hover:border-emerald-500/50' : 'bg-red-500/10 text-red-400 group-hover:border-red-500/50'}`}>
                                    <span className="material-symbols-outlined text-xl">{t.icon}</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-gray-200 group-hover:text-white transition-colors">{t.title}</h4>
                                    <div className="flex items-center gap-2">
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wide">{t.date}</p>
                                        <span className="text-[10px] text-gray-600">•</span>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wide bg-white/5 px-1.5 rounded">{t.category}</p>
                                    </div>
                                </div>
                            </div>
                            <span className={`font-mono text-sm font-bold ${t.type === 'inflow' ? 'text-emerald-400' : 'text-gray-400 group-hover:text-white'}`}>
                                {t.type === 'inflow' ? '+' : '-'} {Math.abs(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                        </div>
                    ))
                )}
             </div>
        </div>
    );
};

export default TransactionsModule;
