/**
 * Investment Terminal (Home Broker + Crypto)
 * Real-time quotes via WS, live prices for crypto from public API, intention-only trades.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { useStore } from '@/foundation/store';
import { api } from '@/platform/http/client';
import { 
  TrendingUp, 
  TrendingDown, 
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

export const InvestmentTerminal: React.FC = () => {
  const { showFeedback } = useStore();
  const navigate = useNavigate();
  
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isExecuting, setIsExecuting] = useState(false);
  const [myPortfolio, setMyPortfolio] = useState<any[]>([]);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(true);

  // Seed data. Cryptos are overwritten on mount with live public prices (CoinGecko).
  // In full system, backend worker pushes via Pub/Sub + WS.
  const [popularStocks, setPopularStocks] = useState<Stock[]>([
    { symbol: 'PETR4', name: 'Petrobras PN', price: 28.45, change: 2.3, type: 'stock' },
    { symbol: 'VALE3', name: 'Vale ON', price: 65.20, change: -0.8, type: 'stock' },
    { symbol: 'BTC', name: 'Bitcoin', price: 342000.00, change: 5.4, type: 'crypto' },
    { symbol: 'ETH', name: 'Ethereum', price: 18450.00, change: 1.2, type: 'crypto' },
    { symbol: 'IVVB11', name: 'S&P 500 ETF', price: 284.15, change: 0.5, type: 'etf' }
  ]);

  // Fetch real user portfolio from backend (desmocks the facade - now backed by PostgreSQL custody)
  useEffect(() => {
    const loadPortfolio = async () => {
      try {
        setIsLoadingPortfolio(true);
        const data = await api.url('/investments/portfolio').get().json<any[]>();
        setMyPortfolio(data || []);
      } catch (e: any) {
        if (e?.data?.code === 'RATE_LIMIT' || e?.message?.includes('Limite de taxa')) {
          console.warn('Rate limit on price feed - using cached/stale in UI');
          // UI can show banner, but for now keep previous or empty
        } else {
          console.warn('Could not load real portfolio, using empty');
        }
        setMyPortfolio([]);
      } finally {
        setIsLoadingPortfolio(false);
      }
    };
    loadPortfolio();
  }, []);

  // Live crypto prices (public CoinGecko, no key). Backend will provide authoritative stream via Pub/Sub/WS later.
  useEffect(() => {
    const loadLiveCrypto = async () => {
      try {
        // CoinGecko simple price endpoint (BRL) - public, CORS friendly for browsers
        const resp = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=brl&include_24hr_change=true');
        if (!resp.ok) return;
        const json = await resp.json();
        setPopularStocks(prev => prev.map(s => {
          if (s.symbol === 'BTC' && json.bitcoin?.brl) {
            return { ...s, price: json.bitcoin.brl, change: json.bitcoin.brl_24h_change ? Math.round(json.bitcoin.brl_24h_change * 10) / 10 : s.change };
          }
          if (s.symbol === 'ETH' && json.ethereum?.brl) {
            return { ...s, price: json.ethereum.brl, change: json.ethereum.brl_24h_change ? Math.round(json.ethereum.brl_24h_change * 10) / 10 : s.change };
          }
          return s;
        }));
      } catch (e) {
        // Silent: keep seed prices if CoinGecko rate limit or offline
        console.warn('[Market] Could not refresh live crypto from CoinGecko (using seed). Backend Pub/Sub feed will take over in prod.');
      }
    };
    loadLiveCrypto();
  }, []);

  // WebSocket Connection for Real-time Quotes
  useEffect(() => {
    let socket: Socket | undefined;

    if (selectedStock) {
      // Connect to the Trading Gateway namespace
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
      // Intention only. Backend decides fill price and locks in ledger (never trust client price).
      await api.url('/investments/trade')
        .headers({ 'idempotency-key': idempotencyKey })
        .post({
          symbol: selectedStock.symbol,
          quantity,
          type: 'BUY',
          requestedPrice: livePrice,
          idempotencyKey,
        }).res();

      // After success, do not trust local totalValue. Refetch portfolio + balance from backend truth.
      showFeedback(`Ordem enviada: ${quantity}x ${selectedStock.symbol} (execução no backend)`, 'success');
      setSelectedStock(null);
      const refreshed = await api.url('/investments/portfolio').get().json<any[]>();
      setMyPortfolio(refreshed || []);
      // Optionally refetch dashboard to sync globalBalanceCents from server
    } catch (error) {
      showFeedback('Falha na execução da ordem', 'alert');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white p-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/home')} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center active:scale-90 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Investimentos</h1>
            <p className="text-[10px] text-emerald-400 uppercase tracking-[0.3em] font-black">B3 · Nasdaq · Crypto</p>
          </div>
        </div>
        <button className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
          <Search className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Real Portfolio from PostgreSQL (desmocked facade - now shows actual holdings after trades) */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] uppercase tracking-[0.3em] text-cyan-400 font-black">MINHA CARTEIRA REAL (DB)</div>
          {isLoadingPortfolio && <Loader2 className="w-3 h-3 animate-spin" />}
        </div>
        {myPortfolio.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {myPortfolio.map((pos, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-3 text-xs">
                <div className="font-mono font-bold">{pos.symbol}</div>
                <div className="text-emerald-400">{Number(pos.amount).toFixed(4)} @ R$ {Number(pos.currentPrice).toFixed(2)}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[10px] text-gray-500">Nenhuma posição ainda. Execute trades para ver aqui (persistido em PostgreSQL).</div>
        )}
      </div>

      {selectedStock ? (
        /* DETAIL VIEW (Live Trading) */
        <div className="animate-in fade-in zoom-in duration-500">
          <div className="bg-gradient-to-br from-cyan-950/20 to-bg-mid border border-white/10 rounded-[40px] p-8 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6">
              <Star className="w-6 h-6 text-gray-600 hover:text-yellow-500 transition-colors cursor-pointer" />
            </div>
            
            <p className="text-gray-500 uppercase tracking-[0.4em] text-[10px] font-black mb-2">{selectedStock.name}</p>
            <h2 className="text-4xl font-black mb-6 tracking-tight">{selectedStock.symbol}</h2>
            
            <div className="flex items-baseline gap-4 mb-8">
              <span className={`text-5xl font-light tracking-tighter transition-colors duration-500 ${
                livePrice && livePrice > selectedStock.price ? 'text-emerald-400' : 
                livePrice && livePrice < selectedStock.price ? 'text-red-400' : 'text-white'
              }`}>
                R$ {livePrice ? livePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : selectedStock.price.toFixed(2)}
              </span>
              <span className={`text-sm font-bold ${selectedStock.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {selectedStock.change >= 0 ? '+' : ''}{selectedStock.change}%
              </span>
            </div>

            {/* Trading Controls */}
            <div className="space-y-6 pt-6 border-t border-white/5">
              <div className="flex items-center justify-between bg-white/5 rounded-2xl p-4 border border-white/5">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl font-bold hover:bg-white/10">-</button>
                <div className="text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Quantidade</p>
                  <p className="text-xl font-bold">{quantity}</p>
                </div>
                <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl font-bold hover:bg-white/10">+</button>
              </div>

              <div className="flex items-center justify-between px-2">
                <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Total da Ordem</span>
                <span className="text-lg font-bold">R$ {((livePrice || selectedStock.price) * quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>

              <button 
                onClick={handleTrade}
                disabled={isExecuting || !livePrice}
                className="w-full py-5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-[28px] font-black uppercase tracking-[0.4em] text-xs shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                {isExecuting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
                Executar Compra
              </button>
            </div>
          </div>
          
          <button onClick={() => setSelectedStock(null)} className="w-full py-4 bg-white/5 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors">
            Cancelar Operação
          </button>
        </div>
      ) : (
        /* LIST VIEW (Market Overview) */
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Ativos em Destaque</h3>
            <BarChart3 className="w-4 h-4 text-gray-600" />
          </div>

          <div className="space-y-3">
            {popularStocks.map((stock, idx) => (
              <button 
                key={stock.symbol} 
                onClick={() => setSelectedStock(stock)}
                className="w-full flex items-center justify-between p-6 bg-white/5 border border-white/5 rounded-[32px] hover:bg-white/10 hover:border-white/20 transition-all group animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 ${
                    stock.type === 'crypto' ? 'bg-orange-500/10 text-orange-400' : 
                    stock.type === 'etf' ? 'bg-indigo-500/10 text-indigo-400' : 
                    'bg-cyan-500/10 text-cyan-400'
                  }`}>
                    <Zap className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-sm tracking-tight">{stock.symbol}</p>
                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest mt-0.5">{stock.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm tracking-tight">R$ {stock.price.toLocaleString('pt-BR')}</p>
                  <p className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${stock.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {stock.change >= 0 ? <TrendingUp className="w-3 h-3 inline mr-1" /> : <TrendingDown className="w-3 h-3 inline mr-1" />}
                    {Math.abs(stock.change)}%
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
