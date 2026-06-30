
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { Rocket, ShoppingBag, Gift, Plane, Star, MapPin, Tag, Trophy, Crown, ArrowRight, CheckCircle } from 'lucide-react';

// --- DREAM VAULT (REALIZAR) ---
export const DreamVault: React.FC = () => {
    return (
        <div className="p-6 space-y-8 animate-in slide-in-from-right duration-500 pb-32">
             {/* Hero */}
             <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-fuchsia-900 to-bg-mid border border-fuchsia-500/20 p-8 shadow-2xl">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                <div className="absolute right-0 top-0 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-fuchsia-500/20 rounded-xl border border-fuchsia-500/30 shadow-[0_0_15px_rgba(217,70,239,0.3)]">
                            <Rocket className="w-8 h-8 text-fuchsia-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white uppercase tracking-wider">Dream Vault</h2>
                    </div>
                    <p className="text-gray-300 text-sm max-w-xs leading-relaxed border-l-2 border-fuchsia-500/50 pl-4">
                        A materialização dos seus desejos começa com a alocação inteligente de recursos.
                    </p>
                </div>
             </div>

             {/* Dreams Grid */}
             <div className="space-y-6">
                {[
                    { title: 'Cobertura Leblon', target: 15000000, current: 4500000, img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=600' },
                    { title: 'Porsche 911 GT3', target: 1800000, current: 950000, img: 'https://images.unsplash.com/photo-1503376763036-066120622c74?auto=format&fit=crop&q=80&w=600' }
                ].map((dream, i) => (
                    <div key={i} className="group relative h-56 rounded-[2rem] overflow-hidden border border-white/10 hover:border-fuchsia-500/50 transition-all cursor-pointer shadow-lg">
                        <img src={dream.img} alt={dream.title} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-bg-deep via-bg-deep/60 to-transparent"></div>
                        
                        <div className="absolute bottom-0 left-0 w-full p-6">
                            <div className="flex justify-between items-end mb-3">
                                <h3 className="text-2xl font-bold text-white tracking-tight">{dream.title}</h3>
                                <span className="text-xs font-bold text-fuchsia-400 bg-fuchsia-500/10 px-3 py-1.5 rounded-full backdrop-blur-md border border-fuchsia-500/20 shadow-[0_0_10px_rgba(217,70,239,0.2)]">
                                    {Math.round((dream.current / dream.target) * 100)}%
                                </span>
                            </div>
                            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden mb-3 backdrop-blur-sm">
                                <div className="h-full bg-gradient-to-r from-fuchsia-600 to-pink-500 shadow-[0_0_10px_#d946ef]" style={{ width: `${(dream.current / dream.target) * 100}%` }}></div>
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-300 font-mono font-bold">
                                <span className="bg-black/40 px-2 py-1 rounded">R$ {dream.current.toLocaleString()}</span>
                                <span className="bg-black/40 px-2 py-1 rounded">Meta: R$ {dream.target.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                ))}

                <button className="w-full py-4 border border-dashed border-fuchsia-500/30 bg-fuchsia-500/5 rounded-2xl text-fuchsia-400 text-sm font-bold uppercase tracking-widest hover:bg-fuchsia-500/10 transition-all shadow-[0_0_20px_rgba(217,70,239,0.05)] hover:shadow-[0_0_30px_rgba(217,70,239,0.1)]">
                    + Manifestar Novo Sonho
                </button>
             </div>
        </div>
    );
}

// --- MARKETPLACE ---
export const Marketplace: React.FC = () => {
    return (
        <div className="p-6 space-y-6 animate-in slide-in-from-right duration-500 pb-32">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/10 rounded-lg">
                        <ShoppingBag className="text-cyan-400 w-5 h-5" />
                    </div>
                    Curadoria Exclusiva
                </h2>
                <span className="text-[10px] font-bold bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-full border border-cyan-500/20 uppercase tracking-wide">Enterprise Only</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {[
                    { name: 'Rolex Daytona', price: '185k', crypto: '0.54 BTC', img: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&q=80&w=300' },
                    { name: 'Herman Miller', price: '12k', crypto: '0.03 BTC', img: 'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?auto=format&fit=crop&q=80&w=300' },
                    { name: 'MacBook Pro M4', price: '25k', crypto: '0.07 BTC', img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca4?auto=format&fit=crop&q=80&w=300' },
                    { name: 'Safra Especial', price: '5k', crypto: '0.01 BTC', img: 'https://images.unsplash.com/photo-1563816176-59178f000b95?auto=format&fit=crop&q=80&w=300' },
                ].map((item, i) => (
                    <div key={i} className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden group hover:border-cyan-400/30 transition-all hover:scale-[1.02] shadow-lg">
                        <div className="h-40 bg-white/5 relative">
                             <img src={item.img} alt={item.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                             <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 text-[10px] text-white font-bold flex items-center gap-1">
                                 {item.crypto}
                             </div>
                        </div>
                        <div className="p-4 bg-bg-mid/80 backdrop-blur-sm">
                            <h3 className="font-bold text-white text-sm truncate mb-1">{item.name}</h3>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-gray-400 text-xs font-mono">R$ {item.price}</span>
                                <button className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center hover:bg-cyan-500 hover:text-white transition-colors text-cyan-400">
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- REWARDS ---
export const Rewards: React.FC = () => {
    return (
        <div className="p-6 space-y-8 animate-in slide-in-from-right duration-500 pb-32">
             <div className="text-center relative py-8">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none"></div>
                 <div className="relative inline-block z-10">
                     <Crown className="w-20 h-20 text-amber-400 mx-auto mb-4 animate-[bounce_3s_infinite] drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" strokeWidth={1} />
                     <h2 className="text-5xl font-bold text-white tracking-tighter text-glow">245.890</h2>
                     <p className="text-xs text-amber-400 uppercase tracking-[0.3em] font-bold mt-2">Regenera Points</p>
                 </div>
             </div>

             <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-5">
                     <Trophy className="w-32 h-32 text-white" />
                 </div>
                 <div className="relative z-10">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Nível Enterprise</h3>
                    <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden mb-3 border border-white/5">
                        <div className="h-full bg-gradient-to-r from-amber-400 to-yellow-200 shadow-[0_0_15px_#fbbf24]" style={{ width: '85%' }}></div>
                    </div>
                    <div className="flex justify-between items-center">
                        <p className="text-[10px] text-gray-400">Próximo: Black Infinite</p>
                        <p className="text-[10px] text-amber-400 font-bold">Faltam 15k</p>
                    </div>
                 </div>
             </div>

             <div className="space-y-3">
                 <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Resgatar</h3>
                 {[
                     { label: 'Desconto Fatura', cost: '10.000 pts', icon: Tag },
                     { label: 'Sala VIP Global', cost: '25.000 pts', icon: Plane },
                     { label: 'Upgrade Investimento', cost: '50.000 pts', icon: Star },
                 ].map((reward, i) => (
                     <div key={i} className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 cursor-pointer transition-colors group">
                         <div className="flex items-center gap-4">
                             <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                                 <reward.icon className="w-5 h-5" />
                             </div>
                             <span className="font-bold text-white text-sm group-hover:text-amber-200 transition-colors">{reward.label}</span>
                         </div>
                         <span className="text-xs font-mono text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-lg bg-amber-500/5">{reward.cost}</span>
                     </div>
                 ))}
             </div>
        </div>
    );
}

// --- TRAVEL CONCIERGE ---
export const TravelConcierge: React.FC = () => {
    return (
        <div className="p-6 space-y-6 animate-in slide-in-from-right duration-500 pb-32">
             <div className="relative h-56 rounded-[2rem] overflow-hidden shadow-2xl group">
                 <img src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80&w=800" alt="Travel" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                 <div className="absolute inset-0 bg-gradient-to-t from-bg-deep via-bg-deep/50 to-transparent"></div>
                 <div className="absolute bottom-0 left-0 p-8">
                     <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Concierge Global</h2>
                     <div className="flex items-center gap-2">
                         <span className="px-2 py-1 bg-cyan-500/20 rounded text-[10px] font-bold text-cyan-400 border border-cyan-500/30 backdrop-blur-md">VIP ACCESS</span>
                         <p className="text-xs text-gray-300 flex items-center gap-1">
                             <MapPin className="w-3 h-3 text-cyan-400" /> Acesso a 1.200 Lounges
                         </p>
                     </div>
                 </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                 <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col items-center justify-center gap-3 hover:bg-white/10 transition-colors cursor-pointer hover:border-cyan-500/30 group">
                     <div className="p-3 bg-cyan-500/10 rounded-full group-hover:bg-cyan-500/20 transition-colors">
                        <Plane className="w-8 h-8 text-cyan-400" />
                     </div>
                     <span className="text-xs font-bold text-white uppercase tracking-widest">Voos</span>
                 </div>
                 <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col items-center justify-center gap-3 hover:bg-white/10 transition-colors cursor-pointer hover:border-cyan-500/30 group">
                     <div className="p-3 bg-cyan-500/10 rounded-full group-hover:bg-cyan-500/20 transition-colors">
                        <Star className="w-8 h-8 text-cyan-400" />
                     </div>
                     <span className="text-xs font-bold text-white uppercase tracking-widest">Hotéis 5★</span>
                 </div>
             </div>

             <div className="bg-cyan-950/20 border border-cyan-500/20 rounded-3xl p-6 relative overflow-hidden">
                 <div className="absolute -right-10 -top-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl"></div>
                 <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-cyan-400" /> Próxima Viagem
                 </h3>
                 
                 <div className="flex justify-between items-center px-4">
                     <div className="text-center">
                         <p className="text-3xl font-mono font-bold text-cyan-400 text-glow">GRU</p>
                         <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mt-1">São Paulo</p>
                     </div>
                     
                     <div className="flex-1 flex flex-col items-center px-4">
                        <div className="w-full h-[1px] bg-white/10 relative">
                            <Plane className="w-4 h-4 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90" />
                        </div>
                        <p className="text-[9px] text-gray-500 mt-2">9h 30m</p>
                     </div>

                     <div className="text-center">
                         <p className="text-3xl font-mono font-bold text-cyan-400 text-glow">JFK</p>
                         <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mt-1">New York</p>
                     </div>
                 </div>
                 
                 <div className="mt-6 pt-4 border-t border-cyan-500/10 flex justify-between text-xs bg-black/20 p-3 rounded-xl">
                     <span className="text-gray-400 font-mono">Voo RG-4829</span>
                     <span className="text-white font-bold">15 Dez • 22:00</span>
                 </div>
             </div>
        </div>
    );
}
