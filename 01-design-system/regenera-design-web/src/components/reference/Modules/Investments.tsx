
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { TrendingUp, Zap, BrainCircuit, ArrowUpRight } from 'lucide-react';
import { UserProfile } from '../../types';
import PremiumChart from '../UI/PremiumChart';

interface InvestmentsProps {
    user: UserProfile;
    onNavigate: (path: string) => void;
}

const Investments: React.FC<InvestmentsProps> = ({ user, onNavigate }) => {
  // Mock Data for chart
  const performanceData = [135000, 138000, 137000, 142000, 145000, 144000, 148000, 150000];

  return (
    <div className="p-6 space-y-8 animate-in slide-in-from-right duration-500">
        
        {/* Hero Card */}
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-950 to-bg-mid border border-emerald-500/20 shadow-2xl">
            <div className="absolute top-0 right-0 w-full h-full opacity-20 pointer-events-none">
                 <div className="absolute top-[-50%] right-[-20%] w-[300px] h-[300px] bg-emerald-500/30 rounded-full blur-[80px]"></div>
            </div>
            
            <div className="relative z-10 p-8">
                <div className="flex justify-between items-center mb-6">
                    <span className="text-emerald-400 font-bold uppercase text-xs tracking-[0.2em] flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
                        Carteira Ativa
                    </span>
                    <TrendingUp className="text-emerald-400 w-5 h-5" />
                </div>
                <h2 className="text-4xl font-bold text-white mb-2 tracking-tight">R$ 150.000,00</h2>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-emerald-300 font-bold bg-emerald-500/10 px-2 py-1 rounded">+1.2%</span>
                    <span className="text-xs text-gray-400">performance mensal</span>
                </div>
            </div>

            {/* Premium Chart */}
            <div className="h-24 w-full -mb-1 relative z-0 opacity-80">
                <PremiumChart data={performanceData} color="#34d399" height={100} />
            </div>
        </div>
        
        {/* Insight AI Section - The Brain */}
        <div className="relative bg-gradient-to-br from-indigo-950/50 to-bg-mid border border-indigo-500/30 rounded-[2rem] p-1 overflow-hidden shadow-2xl shadow-indigo-900/20 group">
             {/* Glowing Border Animation */}
             <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-20 group-hover:opacity-40 transition-opacity duration-1000"></div>
             
             <div className="bg-bg-mid/90 backdrop-blur-xl rounded-[1.8rem] p-6 relative z-10 h-full">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                        <BrainCircuit className="w-6 h-6 text-indigo-400 animate-pulse" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg leading-none">Regenera AI</h3>
                        <p className="text-[10px] text-indigo-400 uppercase tracking-widest mt-1">Nível de Confiança: 98.4%</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <p className="text-sm text-gray-300 leading-relaxed font-light border-l-2 border-indigo-500/50 pl-4">
                        Detectei uma saturação em seus ativos de Renda Fixa. O mercado de <strong className="text-white font-bold">Energias Renováveis</strong> apresenta um padrão de alta convergência para o próximo trimestre.
                    </p>
                    
                    <div className="bg-black/40 rounded-xl p-4 border border-indigo-500/10 flex justify-between items-center group-hover:border-indigo-500/30 transition-colors">
                        <div>
                            <span className="text-[10px] text-gray-500 uppercase block mb-1">Oportunidade</span>
                            <span className="text-sm font-bold text-white flex items-center gap-2">
                                ETF Clean Energy
                                <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] text-gray-500 uppercase block mb-1">Yield Est.</span>
                            <span className="text-sm font-bold text-emerald-400 shadow-emerald-400/20 drop-shadow-md">+14.2% a.a.</span>
                        </div>
                    </div>
                    
                    <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.6)] uppercase tracking-widest flex items-center justify-center gap-3 group/btn">
                        <Zap className="w-4 h-4 group-hover/btn:text-yellow-300 transition-colors" />
                        Executar Rebalanceamento
                    </button>
                </div>
             </div>
        </div>
    </div>
  );
};

export default Investments;
