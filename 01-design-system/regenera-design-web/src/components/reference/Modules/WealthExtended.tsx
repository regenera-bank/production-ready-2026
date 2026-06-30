
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { Shield, Umbrella, TrendingUp, AlertCircle, PiggyBank, Briefcase, ChevronRight } from 'lucide-react';
import PremiumChart from '../UI/PremiumChart';

// --- LOANS MODULE ---
export const LoansModule: React.FC = () => {
    return (
        <div className="p-6 space-y-8 animate-in slide-in-from-right duration-500 pb-32">
             {/* Credit Score Hero */}
             <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-indigo-950 to-bg-deep border border-indigo-500/20 p-8 shadow-2xl">
                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest mb-1">Score de Crédito</p>
                        <h2 className="text-6xl font-bold text-white tracking-tighter animate-in zoom-in duration-700">945</h2>
                        <p className="text-xs text-gray-400 mt-2">Classificação: <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded">AAA Premium</span></p>
                    </div>
                    <div className="w-20 h-20 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)] animate-spin-slow">
                        <span className="text-emerald-400 font-bold text-xs animate-none transform-none">Alta</span>
                    </div>
                </div>
                <div className="absolute right-0 bottom-0 opacity-10">
                    <TrendingUp className="w-48 h-48 text-indigo-500 transform translate-x-10 translate-y-10" />
                </div>
             </div>

             {/* Offers */}
             <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">Crédito Pré-Aprovado</h3>
                <div className="space-y-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-primary/50 transition-all group cursor-pointer hover:bg-white/10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                                <Briefcase className="w-6 h-6 text-primary" />
                            </div>
                            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide border border-emerald-500/20">Juros 0.9% a.m.</span>
                        </div>
                        <h4 className="text-lg font-bold text-white mb-1">Crédito Pessoal Enterprise</h4>
                        <p className="text-sm text-gray-400 mb-4">Disponível para saque imediato.</p>
                        <div className="flex justify-between items-end">
                            <span className="text-2xl font-bold text-white">R$ 150.000</span>
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                                <ChevronRight className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-indigo-500/50 transition-all group cursor-pointer hover:bg-white/10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                                <Shield className="w-6 h-6 text-indigo-400" />
                            </div>
                            <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide border border-indigo-500/20">Garantia de Imóvel</span>
                        </div>
                        <h4 className="text-lg font-bold text-white mb-1">Home Equity</h4>
                        <p className="text-sm text-gray-400 mb-4">Use seu patrimônio para alavancagem.</p>
                        <div className="flex justify-between items-end">
                            <span className="text-2xl font-bold text-white">R$ 2.500.000</span>
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                <ChevronRight className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                </div>
             </div>
        </div>
    );
}

// --- SAVINGS MODULE ---
export const SavingsModule: React.FC = () => {
    return (
        <div className="p-6 space-y-8 animate-in slide-in-from-right duration-500 pb-32">
            <div className="bg-gradient-to-br from-emerald-900/40 to-bg-mid border border-emerald-500/20 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className="p-3 bg-emerald-500/10 rounded-xl">
                        <PiggyBank className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Reserva de Valor</h2>
                        <p className="text-xs text-emerald-400/70 uppercase tracking-widest font-bold">Patrimônio Líquido</p>
                    </div>
                </div>
                <div className="h-40 w-full relative z-10">
                    <PremiumChart data={[50000, 52000, 55000, 54000, 58000, 62000]} color="#34d399" height={150} />
                </div>
                <div className="mt-6 flex justify-between items-center text-sm relative z-10 bg-black/20 p-4 rounded-xl backdrop-blur-sm border border-white/5">
                    <span className="text-gray-400">Total Acumulado</span>
                    <span className="font-bold text-white text-2xl">R$ 62.000,00</span>
                </div>
            </div>

            <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">Objetivos</h3>
                {[
                    { title: 'Reserva de Emergência', target: 100000, current: 45000, color: 'bg-emerald-500' },
                    { title: 'Viagem Europa', target: 30000, current: 12000, color: 'bg-cyan-500' },
                    { title: 'Troca de Carro', target: 150000, current: 5000, color: 'bg-indigo-500' },
                ].map((goal, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/5 p-5 rounded-2xl mb-4 hover:bg-white/10 transition-colors">
                        <div className="flex justify-between mb-3">
                            <span className="font-bold text-white text-sm">{goal.title}</span>
                            <span className="text-xs font-bold text-gray-400 bg-white/10 px-2 py-1 rounded">{Math.round((goal.current / goal.target) * 100)}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden mb-3 border border-white/5">
                            <div className={`h-full ${goal.color} shadow-[0_0_10px_currentColor]`} style={{ width: `${(goal.current / goal.target) * 100}%` }}></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 font-mono">
                            <span>R$ {goal.current.toLocaleString()}</span>
                            <span>Meta: R$ {goal.target.toLocaleString()}</span>
                        </div>
                    </div>
                ))}
                
                <button className="w-full py-4 border border-dashed border-white/20 rounded-2xl text-gray-400 hover:text-white hover:border-white/40 transition-all text-sm uppercase tracking-widest font-bold mt-4">
                    + Novo Objetivo
                </button>
            </div>
        </div>
    );
}

// --- INSURANCE MODULE ---
export const InsuranceModule: React.FC = () => {
    return (
        <div className="p-6 space-y-6 animate-in slide-in-from-right duration-500 pb-32">
             <div className="bg-indigo-950/30 border border-indigo-500/30 p-8 rounded-[2rem] flex items-center gap-6 shadow-lg shadow-indigo-900/10">
                 <div className="p-4 bg-indigo-500/20 rounded-2xl border border-indigo-500/20">
                     <Umbrella className="w-10 h-10 text-indigo-400" />
                 </div>
                 <div>
                     <h3 className="font-bold text-white text-xl">Proteção Familiar</h3>
                     <p className="text-xs text-indigo-300 uppercase tracking-wider mt-1 font-bold">Apólice Ativa • Renovação em Dez/25</p>
                 </div>
             </div>

             <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mt-8">Coberturas Ativas</h3>
             <div className="grid grid-cols-2 gap-4">
                 {[
                     { name: 'Vida', val: 'R$ 2M', icon: AlertCircle },
                     { name: 'Auto', val: '100% Fipe', icon: Shield },
                     { name: 'Residencial', val: 'R$ 1.5M', icon: Umbrella },
                     { name: 'Digital', val: 'R$ 50k', icon: Shield },
                 ].map((ins, i) => (
                     <div key={i} className="bg-white/5 border border-white/5 p-6 rounded-2xl flex flex-col items-center text-center gap-3 hover:bg-white/10 transition-colors group hover:border-emerald-500/30">
                         <div className="p-3 bg-white/5 rounded-full group-hover:bg-emerald-500/10 transition-colors">
                             <ins.icon className="w-6 h-6 text-gray-400 group-hover:text-emerald-400" />
                         </div>
                         <span className="font-bold text-white text-sm">{ins.name}</span>
                         <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 shadow-sm">{ins.val}</span>
                     </div>
                 ))}
             </div>
             
             <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-bold uppercase tracking-widest shadow-lg shadow-indigo-500/30 transition-all mt-4">
                 Acionar Sinistro
             </button>
        </div>
    );
}
