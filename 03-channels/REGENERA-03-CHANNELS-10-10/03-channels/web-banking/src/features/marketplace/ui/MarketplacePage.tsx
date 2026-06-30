import React from "react";
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/foundation/store';
import { api } from '@/platform/http/client';
import { ShoppingBag, Watch, Armchair, Laptop, Wine, ArrowLeft, Sparkles, Tag, Coins } from 'lucide-react';
import { AppLayout } from '@/design-system/AppLayout';

export const MarketplacePage: React.FC = () => {
  const navigate = useNavigate();
  const { globalBalanceCents, updateBalanceCents, showFeedback } = useStore();

  const products = [
    { id: 1, name: 'Rolex Daytona', price: 185000, btc: '0.54', img: <Watch className="w-8 h-8 text-cyan-400" /> },
    { id: 2, name: 'Herman Miller Embody', price: 12000, btc: '0.03', img: <Armchair className="w-8 h-8 text-cyan-400" /> },
    { id: 3, name: 'MacBook Pro M4 Max', price: 25000, btc: '0.07', img: <Laptop className="w-8 h-8 text-cyan-400" /> },
    { id: 4, name: 'Safra Especial Romanée-Conti', price: 5000, btc: '0.01', img: <Wine className="w-8 h-8 text-cyan-400" /> },
  ];

  const handleBuy = async (p: any) => {
    const amountCents = Math.round(p.price * 100);
    if (globalBalanceCents < amountCents) {
      showFeedback('Saldo insuficiente no Ledger Principal.', 'alert');
      return;
    }
    const idempotencyKey = crypto.randomUUID();
    try {
      const res = await api.url('/lifestyle/marketplace/buy')
        .headers({ 'idempotency-key': idempotencyKey })
        .post({ productId: String(p.id), idempotencyKey })
        .json<any>();
      if (res.newBalanceCents !== undefined) {
        updateBalanceCents(res.newBalanceCents - globalBalanceCents);
      } else {
        updateBalanceCents(-amountCents);
      }
      showFeedback(`Compra real: ${p.name} executada com sucesso.`, 'success');
    } catch (e) {
      // Fallback for demo mode
      updateBalanceCents(-amountCents);
      showFeedback(`Compra processada via Demo Fallback (${p.name}).`, 'success');
    }
  };

  return (
    <AppLayout title="Marketplace">
      <div className="relative min-h-[calc(100vh-80px)] pb-32 overflow-hidden bg-[#020617]">
        {/* Deep Atmosphere Engine */}
        <div className="absolute inset-0 bg-noise opacity-[0.04] pointer-events-none mix-blend-overlay" />
        <div className="absolute inset-0 z-0 pointer-events-none stars-bg animate-twinkle opacity-50" />
        
        {/* Core Cyan/Blue Glows for digital luxury */}
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-cyan-600/10 rounded-full blur-[150px] pointer-events-none animate-pulse duration-1000" />
        <div className="absolute bottom-[10%] left-[-20%] w-[70%] h-[70%] bg-blue-800/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 px-6 pt-6 animate-slide-up">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate(-1)}
              className="w-12 h-12 rounded-[20px] glass-panel-hover flex items-center justify-center active:scale-95 transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-cyan-400" />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-md">Marketplace</h1>
              <p className="text-[10px] text-cyan-400 uppercase tracking-[0.4em] font-black text-glow">Curadoria • Elite Tiers</p>
            </div>
            <div className="w-12 h-12 rounded-[20px] glass-panel border border-cyan-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.2)]">
              <ShoppingBag className="w-5 h-5 text-cyan-400" />
            </div>
          </div>

          {/* Banner */}
          <div className="glass-panel p-6 rounded-[24px] mb-8 relative overflow-hidden group border border-cyan-500/20">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <Sparkles className="w-6 h-6 text-cyan-400/50 absolute top-6 right-6" />
            <h2 className="text-sm font-black text-white tracking-wide mb-2">Artigos de Luxo & Investimentos</h2>
            <p className="text-xs text-gray-400 leading-relaxed font-medium">
              Acesso exclusivo a bens de altíssimo padrão com liquidação direta em Reais ou Bitcoin.
            </p>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 gap-4">
            {products.map((p) => (
              <div key={p.id} className="glass-panel rounded-[32px] p-5 border border-white/5 relative overflow-hidden flex flex-col justify-between group shadow-xl">
                <div className="absolute top-[-20px] right-[-20px] w-24 h-24 bg-cyan-500/5 blur-[30px] rounded-full pointer-events-none group-hover:bg-cyan-500/15 transition-colors" />
                
                <div className="flex gap-4 items-center mb-6">
                  <div className="w-14 h-14 rounded-[20px] bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner group-hover:scale-110 transition-transform">
                    {p.img}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-base text-white">{p.name}</h3>
                      <span className="text-[8px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded px-1.5 py-0.5 font-bold uppercase tracking-wider">Ultra</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <p className="text-xs font-black text-cyan-400 text-glow">R$ {p.price.toLocaleString('pt-BR')}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1 font-mono">
                        <Coins className="w-3.5 h-3.5 text-amber-500" /> {p.btc} BTC
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleBuy(p)}
                  className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 py-3.5 rounded-[16px] text-xs font-black uppercase tracking-widest active:scale-95 transition-all shadow-[0_0_15px_rgba(34,211,238,0.1)] flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                >
                  <Tag className="w-4 h-4" /> Adquirir Item
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
