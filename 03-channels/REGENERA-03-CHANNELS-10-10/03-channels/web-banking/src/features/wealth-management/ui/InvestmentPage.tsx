
/**
 * REGENERA BANK
 * Investment Terminal (Home Broker)
 * Integrates real-time WebSocket data for stock market fluctuations.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { useStore } from '@/foundation/store';
import { api } from '@/platform/http/client';
import { 
  ArrowLeft, 
  Search, 
  BarChart3, 
  ShoppingCart, 
  Zap, 
  Star,
  Loader2
} from 'lucide-react';

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  type: 'stock' | 'crypto' | 'etf';
}

export const InvestmentPage: React.FC = () => {
  const { showFeedback } = useStore();
  const navigate = useNavigate();
  
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isExecuting, setIsExecuting] = useState(false);

  const popularStocks: Stock[] = [
    { symbol: 'PETR4', name: 'Petrobras PN', price: 28.45, change: 2.3, type: 'stock' },
    { symbol: 'VALE3', name: 'Vale ON', price: 65.20, change: -0.8, type: 'stock' },
    { symbol: 'BTC', name: 'Bitcoin', price: 342000.00, change: 5.4, type: 'crypto' },
    { symbol: 'ETH', name: 'Ethereum', price: 18450.00, change: 1.2, type: 'crypto' },
    { symbol: 'IVVB11', name: 'S&P 500 ETF', price: 284.15, change: 0.5, type: 'etf' }
  ];

  // WebSocket Connection for Real-time Quotes
  useEffect(() => {
    let socket: Socket | undefined;

    if (selectedStock) {
      const wsUrl = (import.meta as any).env['VITE_WS_URL'] || 'https://regenera-core-api-vrf2tbmlmq-rj.a.run.app';
      socket = io(wsUrl);

      socket.on('connect', () => {
        console.log("Connected to Regenera Market Stream");
      });

      socket.on('stock_update', (data: { symbol: string; price: string }) => {
        if (data.symbol === selectedStock.symbol) {
          setLivePrice(parseFloat(data.price));
        }
      });

      return () => {
        socket?.disconnect();
      };
    }
    return undefined;
  }, [selectedStock]);

  const handleTrade = async () => {
    if (!selectedStock || !livePrice) return;
    
    setIsExecuting(true);
    const idempotencyKey = crypto.randomUUID();
    try {
      await api.url('/investments/trade')
        .headers({ 'idempotency-key': idempotencyKey })
        .post({
          symbol: selectedStock.symbol,
          quantity,
          type: 'BUY',
          idempotencyKey,
        }).res();

      // No client-dictated price, no blind optimistic balance change here.
      showFeedback(`Ordem de compra ${selectedStock.symbol} enviada`, 'success');
      setSelectedStock(null);
    } catch (error) {
      showFeedback('Falha na execução da ordem', 'alert');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white p-6 pb-32">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <button onClick={() => navigate('/home')} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Terminal de Investimentos</h1>
          <p className="text-[10px] text-cyan-400 uppercase tracking-widest font-black">Neural Market Data Feed</p>
        </div>
      </div>

      {!selectedStock ? (
        <>
          {/* Search Bar */}
          <div className="relative mb-8">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Buscar ativo ou cripto..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm focus:border-cyan-500/50 outline-none transition-all font-mono"
            />
          </div>

          {/* Markets Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                <BarChart3 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">Ações</span>
            </button>
            <button className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                <Zap className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">Cripto</span>
            </button>
          </div>

          {/* Popular Assets */}
          <h2 className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-4 px-2">Ativos em Destaque</h2>
          <div className="space-y-3">
            {popularStocks.map((stock) => (
              <button 
                key={stock.symbol}
                onClick={() => {
                  setSelectedStock(stock);
                  setLivePrice(stock.price);
                }}
                className="w-full bg-white/5 border border-white/10 rounded-3xl p-5 flex items-center justify-between hover:bg-white/10 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs ${
                    stock.type === 'crypto' ? 'bg-purple-500/20 text-purple-400' : 'bg-cyan-500/20 text-cyan-400'
                  }`}>
                    {stock.symbol.substring(0, 2)}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm">{stock.symbol}</p>
                    <p className="text-[9px] text-gray-500 uppercase font-black">{stock.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-sm">R$ {stock.price.toLocaleString('pt-BR')}</p>
                  <p className={`text-[10px] font-black ${stock.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {stock.change >= 0 ? '+' : ''}{stock.change}%
                  </p>
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        /* DETAIL VIEW (Live Trading) */
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <button 
            onClick={() => setSelectedStock(null)}
            className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-6 flex items-center gap-2"
          >
            <ArrowLeft className="w-3 h-3" /> Voltar ao Mercado
          </button>

          <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 mb-8 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6">
              <Star className="w-5 h-5 text-gray-600" />
            </div>
            
            <p className="text-cyan-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Negociação em Tempo Real</p>
            <h2 className="text-3xl font-bold mb-2">{selectedStock.symbol}</h2>
            <p className="text-gray-400 text-sm mb-8">{selectedStock.name}</p>

            <div className="flex flex-col items-center justify-center mb-4">
              <span className="text-5xl font-mono font-light tracking-tighter">
                R$ {livePrice?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <div className="mt-4 flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded-full border border-emerald-500/20 animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[9px] font-black uppercase tracking-widest">Neural Live Feed</span>
              </div>
            </div>
          </div>

          {/* Trade Controls */}
          <div className="bg-white/5 border border-white/10 rounded-[40px] p-8">
             <div className="flex items-center justify-between mb-8">
               <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Quantidade</p>
               <div className="flex items-center gap-6">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-xl font-light hover:bg-white/5"
                  >
                    -
                  </button>
                  <span className="text-2xl font-mono font-bold w-8 text-center">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-xl font-light hover:bg-white/5"
                  >
                    +
                  </button>
               </div>
             </div>

             <div className="flex justify-between items-center mb-10 text-sm border-t border-white/5 pt-8">
               <span className="text-gray-400">Total Estimado</span>
               <span className="font-mono font-bold text-xl">
                 R$ {((livePrice || 0) * quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
               </span>
             </div>

             <button 
               disabled={isExecuting}
               onClick={handleTrade}
               className="w-full py-6 bg-cyan-500 text-[#020617] rounded-[24px] font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 shadow-[0_20px_40px_-10px_rgba(6,182,212,0.4)] active:scale-95 transition-all disabled:opacity-50"
             >
               {isExecuting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingCart className="w-5 h-5" />}
               Executar Compra
             </button>
          </div>
        </div>
      )}
    </div>
  );
};
