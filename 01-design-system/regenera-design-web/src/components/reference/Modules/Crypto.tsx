/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { CryptoAsset } from '../../types';
import { Bitcoin, Activity, TrendingUp, TrendingDown, RefreshCcw, Bell, CheckCircle } from 'lucide-react';
import PremiumChart from '../UI/PremiumChart';

const CRYPTO_ASSETS: CryptoAsset[] = [
    { id: '1', symbol: 'BTC', name: 'Bitcoin', price: 342190.50, change24h: 2.4, balance: 0.45, icon: Bitcoin },
    { id: '2', symbol: 'ETH', name: 'Ethereum', price: 18450.20, change24h: -1.2, balance: 4.2, icon: Activity },
    { id: '3', symbol: 'SOL', name: 'Solana', price: 745.30, change24h: 5.8, balance: 150, icon: Activity },
];

export const CryptoModule: React.FC = () => {
  const [alertSetFor, setAlertSetFor] = useState<string | null>(null);

  const handleSetAlert = (symbol: string) => {
      setAlertSetFor(symbol);
      setTimeout(() => setAlertSetFor(null), 3000);
  };

  return (
    <div className="p-0 animate-in fade-in duration-700">
        
        {/* Ticker Tape */}
        <div className="bg-white/5 border-y border-white/5 overflow-hidden whitespace-nowrap py-2 mb-6">
            <div className="animate-[shimmer_20s_linear_infinite] inline-block">
                {['BTC $64k +2%', 'ETH $3.2k -1%', 'SOL $140 +5%', 'ADA $0.45 +0.5%', 'DOT $7.20 -2%'].map((item, i) => (
                    <span key={i} className="mx-4 text-xs font-mono text-gray-400">{item}</span>
                ))}
            </div>
        </div>

        <div className="px-6 space-y-8">
            {/* Featured Asset */}
            <div className="bg-gradient-to-br from-orange-950/40 to-bg-mid border border-orange-500/20 rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Bitcoin className="w-32 h-32 text-orange-500" />
                </div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                         <div className="p-2 bg-orange-500/20 rounded-lg">
                             <Bitcoin className="w-6 h-6 text-orange-500" />
                         </div>
                         <span className="font-bold text-orange-400">Bitcoin</span>
                    </div>
                    <h2 className="text-3xl font-bold text-white">R$ 342.190,50</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400 font-bold text-sm">+2.4% (24h)</span>
                    </div>

                    <div className="mt-6 h-16 w-full opacity-80">
                         <PremiumChart data={[320000, 325000, 322000, 330000, 335000, 328000, 342190]} color="#f97316" height={60} />
                    </div>
                </div>
            </div>

            {/* Asset List */}
            <div>
                <div className="flex justify-between items-center mb-4">
                     <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">Meus Ativos</h3>
                     <RefreshCcw className="w-4 h-4 text-gray-600 cursor-pointer hover:rotate-180 transition-transform duration-500" />
                </div>
                
                <div className="space-y-3">
                    {CRYPTO_ASSETS.map(asset => (
                        <div key={asset.id} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer group">
                             <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                     <asset.icon className="w-5 h-5 text-gray-300 group-hover:text-primary" />
                                 </div>
                                 <div>
                                     <h4 className="font-bold text-white">{asset.name}</h4>
                                     <p className="text-xs text-gray-500 font-mono">{asset.balance} {asset.symbol}</p>
                                 </div>
                             </div>
                             <div className="flex flex-col items-end gap-2">
                                 <div className="text-right">
                                    <p className="font-bold text-white">R$ {(asset.price * asset.balance).toLocaleString()}</p>
                                    <p className={`text-xs font-bold ${asset.change24h > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {asset.change24h > 0 ? '+' : ''}{asset.change24h}%
                                    </p>
                                 </div>
                                 <button 
                                    onClick={(e) => { e.stopPropagation(); handleSetAlert(asset.symbol); }}
                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-gray-500 hover:text-cyan-400 transition-colors"
                                    title="Criar Alerta de Preço"
                                 >
                                    {alertSetFor === asset.symbol ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Bell className="w-4 h-4" />}
                                 </button>
                             </div>
                        </div>
                    ))}
                </div>
            </div>

            <button className="w-full py-4 border border-dashed border-white/20 rounded-xl text-gray-400 hover:text-white hover:border-white/40 transition-all text-sm uppercase tracking-widest font-bold">
                + Novo Ativo
            </button>
            
            {/* Toast for alert */}
            {alertSetFor && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-bg-deep/90 backdrop-blur-xl border border-emerald-500/30 px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl animate-in slide-in-from-bottom-4 z-50">
                    <Bell className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">Alerta criado para {alertSetFor}</span>
                </div>
            )}
        </div>
    </div>
  );
};