import React, { useState, useEffect } from 'react';
import { Transaction } from '../../types';
import { BrainCircuit, TrendingUp, TrendingDown, Zap, Shield, Rocket, RefreshCcw, ChevronRight } from 'lucide-react';
import PremiumChart from '../UI/PremiumChart';

interface NeuralInsightsProps {
    transactions: Transaction[];
    onAction?: (action: string, params?: any) => void;
}

export const NeuralInsights: React.FC<NeuralInsightsProps> = ({ transactions, onAction }) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [insights, setInsights] = useState<any[]>([]);
    const [score, setScore] = useState(85);

    const generateInsights = () => {
        setIsAnalyzing(true);
        // Simulate neural processing
        setTimeout(() => {
            setInsights([
                {
                    id: '1',
                    type: 'opportunity',
                    title: 'Otimização de Portfólio',
                    description: 'Detectamos uma correlação alta entre seus ativos de Crypto e Tech. Sugerimos diversificação em Commodities para proteção quântica.',
                    impact: '+12% Projeção Anual',
                    icon: Rocket,
                    color: 'text-cyan-400',
                    bg: 'bg-cyan-400/10'
                },
                {
                    id: '2',
                    type: 'warning',
                    title: 'Vazamento de Liquidez',
                    description: 'Seus gastos com assinaturas digitais aumentaram 24% este mês. Raphaela pode cancelar serviços não utilizados automaticamente.',
                    impact: 'R$ 450,00 Economia Potencial',
                    icon: Zap,
                    color: 'text-amber-400',
                    bg: 'bg-amber-400/10'
                },
                {
                    id: '3',
                    type: 'security',
                    title: 'Escudo de Crédito Ativo',
                    description: 'Seu Score subiu para 945. Você tem uma oferta pré-aprovada de R$ 500k com a menor taxa do mercado (0.8% a.m).',
                    impact: 'Crédito Premium Liberado',
                    icon: Shield,
                    color: 'text-emerald-400',
                    bg: 'bg-emerald-400/10'
                }
            ]);
            setScore(92);
            setIsAnalyzing(false);
        }, 2500);
    };

    useEffect(() => {
        generateInsights();
    }, []);

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-700">
            {/* Neural Score Header */}
            <div className="relative bg-gradient-to-br from-bg-mid to-bg-deep border border-white/10 rounded-[2.5rem] p-8 overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <BrainCircuit className="w-40 h-40 text-cyan-400" />
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
                                strokeDasharray={364}
                                strokeDashoffset={364 - (364 * score / 100)}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold text-white tracking-tighter">{score}</span>
                            <span className="text-[8px] font-bold text-cyan-400 uppercase tracking-widest">Neural Index</span>
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Análise Preditiva Raphaela</h2>
                        <p className="text-gray-400 text-sm leading-relaxed max-w-md">
                            Seu comportamento financeiro está 92% otimizado. O núcleo quântico processou {transactions.length} transações recentes para gerar estas diretrizes.
                        </p>
                    </div>

                    <button 
                        onClick={generateInsights}
                        disabled={isAnalyzing}
                        className={`p-4 rounded-2xl bg-white/5 border border-white/10 text-gray-400 hover:text-cyan-400 hover:border-cyan-400/30 transition-all active:scale-95 ${isAnalyzing ? 'animate-spin' : ''}`}
                    >
                        <RefreshCcw className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Insights Grid */}
            <div className="grid grid-cols-1 gap-4">
                {isAnalyzing ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="h-32 bg-white/5 border border-white/5 rounded-3xl animate-pulse"></div>
                    ))
                ) : (
                    insights.map((insight) => (
                        <div key={insight.id} className="group bg-white/5 border border-white/5 rounded-3xl p-6 hover:bg-white/10 transition-all cursor-pointer relative overflow-hidden">
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-2xl ${insight.bg} ${insight.color}`}>
                                    <insight.icon className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-bold text-white">{insight.title}</h3>
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${insight.color}`}>{insight.impact}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 leading-relaxed">{insight.description}</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-700 group-hover:text-white transition-colors self-center" />
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Projections Chart */}
            <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-1">Projeção de Patrimônio</h3>
                        <p className="text-lg font-bold text-white">R$ 1.2M <span className="text-xs text-emerald-400 font-normal ml-2">em 24 meses</span></p>
                    </div>
                    <div className="flex gap-2">
                        <div className="px-3 py-1 bg-cyan-400/20 rounded-full text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Otimizado</div>
                    </div>
                </div>
                <div className="h-48 w-full">
                    <PremiumChart 
                        data={[247000, 280000, 350000, 420000, 580000, 850000, 1200000]} 
                        color="#22d3ee" 
                        height={180} 
                    />
                </div>
            </div>
        </div>
    );
};

export default NeuralInsights;
