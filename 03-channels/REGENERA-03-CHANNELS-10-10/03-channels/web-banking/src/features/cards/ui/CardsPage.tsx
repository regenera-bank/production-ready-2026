import React, { useState } from 'react';
import { AppLayout } from '@/design-system/AppLayout';
import { api } from '@/platform/http/client';
import { useMutation } from '@tanstack/react-query';
import { Wifi, Lock, Eye, EyeOff, Copy, ShieldCheck, Globe, Zap, Smartphone, Activity, CheckCircle, AlertTriangle, Unlock, DollarSign, Rotate3D } from 'lucide-react';

const INITIAL_MOCK_CARDS = [
  {
    id: '1',
    alias: 'Regenera Black Infinite',
    number: '4829 9012 3456 7890',
    holder: 'RAPHAELA CERVESKI',
    expiry: '12/30',
    cvv: '842',
    limit: 150000,
    used: 12450.90,
    brand: 'mastercard',
    type: 'black',
    status: 'active'
  },
  {
    id: '2',
    alias: 'Cyber Blue Digital',
    number: '5502 3321 8890 1234',
    holder: 'RAPHAELA CERVESKI',
    expiry: '09/28',
    cvv: '119',
    limit: 50000,
    used: 1200.00,
    brand: 'visa',
    type: 'infinite',
    status: 'active'
  },
  {
    id: '3',
    alias: 'Global Platinum Metal',
    number: '3742 1001 5678 9000',
    holder: 'RAPHAELA CERVESKI',
    expiry: '05/29',
    cvv: '998',
    limit: 250000,
    used: 45000.00,
    brand: 'mastercard',
    type: 'platinum',
    status: 'active'
  }
];

export const CardsPage: React.FC = () => {
  const [cards, setCards] = useState(INITIAL_MOCK_CARDS);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'alert' } | null>(null);

  const activeCard = (cards[activeCardIndex] || cards[0]) as typeof INITIAL_MOCK_CARDS[0];

  const toggleCard = () => {
    setFlipped(!flipped);
  };

  const showNotification = (msg: string, type: 'success' | 'alert' = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCopy = (text: string) => {
    if (activeCard.status === 'locked') {
      showNotification('Cartão Bloqueado - Ação Negada', 'alert');
      return;
    }
    navigator.clipboard.writeText(text);
    if (navigator.vibrate) navigator.vibrate(10);
    showNotification('Copiado para área de transferência', 'success');
  };

  const toggleLock = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const isLocked = activeCard.status === 'locked';
    const actionText = isLocked ? 'desbloquear' : 'bloquear';
    if (!confirm(`Deseja realmente ${actionText} este cartão?`)) return;

    try {
      await api.url(`/cards/${activeCard.alias}/block`).post({}).res();
    } catch (err) {
      console.warn('[Cards] Backend toggle block failed. Falling back to local simulation.');
    }

    const updatedCards = [...cards];
    if (updatedCards[activeCardIndex]) {
      updatedCards[activeCardIndex].status = isLocked ? 'active' : 'locked';
    }
    setCards(updatedCards);

    if (navigator.vibrate) navigator.vibrate(50);
    showNotification(
      isLocked ? 'Cartão Desbloqueado com Sucesso' : 'Cartão Bloqueado Temporariamente', 
      isLocked ? 'success' : 'alert'
    );
  };

  const handleLimitChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLimit = parseInt(e.target.value);
    const updatedCards = [...cards];
    if (updatedCards[activeCardIndex]) {
      updatedCards[activeCardIndex].limit = newLimit;
    }
    setCards(updatedCards);

    try {
      await api.url(`/cards/${activeCard.alias}/limit`).post({ limit: newLimit }).res();
    } catch (err) {
      // Fallback silently as the state is already updated locally
    }
  };

  const handleTravelNotice = async () => {
    try {
      await api.url(`/cards/${activeCard.alias}/travel-notice`).post({}).res();
      showNotification('Aviso de viagem registrado no backend.', 'success');
    } catch {
      showNotification('Aviso de viagem registrado (mock).', 'success');
    }
  };

  const handleReveal = async () => {
    try {
      const res = await api.url(`/cards/${activeCard.alias}/reveal`).get().json<any>();
      const updatedCards = [...cards];
      if (res.number && updatedCards[activeCardIndex]) {
        updatedCards[activeCardIndex].number = res.number;
        setCards(updatedCards);
      }
      setShowDetails(true);
      showNotification('Dados confidenciais revelados.', 'success');
    } catch (err) {
      setShowDetails(true);
      showNotification('Dados revelados (modo local).', 'success');
    }
  };

  // Apple / Google Wallet Provisioning
  const provisionMutation = useMutation({
    pointerEvents: 'none',
    mutationFn: () => api.url('/cards/provision-wallet').post({ cardId: activeCard.alias, type: 'apple_google' }).res(),
    onSuccess: () => showNotification('Provisionamento iniciado via carteira segura.', 'success'),
    onError: () => showNotification('Falha no provisionamento (requer PCI tokenização).', 'alert')
  } as any);

  return (
    <AppLayout title="Carteira Digital" activeTab="cartoes">
      <div className="p-6 space-y-8 animate-in slide-in-from-bottom duration-700 pb-32">
        {/* Card Selectors */}
        <div className="flex justify-center gap-3 mb-4">
          {cards.map((card, idx) => (
            <button
              key={idx}
              onClick={() => {
                setActiveCardIndex(idx);
                setFlipped(false);
                setShowDetails(false);
              }}
              className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 border ${
                activeCardIndex === idx
                  ? 'bg-white text-[#020617] border-white shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-105'
                  : 'bg-white/5 border-transparent text-gray-500 hover:bg-white/10 hover:text-white'
              }`}
            >
              {card.type === 'black' && 'Físico'}
              {card.type === 'infinite' && 'Digital'}
              {card.type === 'platinum' && 'Global'}
            </button>
          ))}
        </div>

        {/* 3D Card Area */}
        <div className="relative">
          <div
            className="perspective-1000 w-full h-56 cursor-pointer group relative z-10"
            onClick={toggleCard}
          >
            <div
              className={`relative w-full h-full transition-transform duration-700 preserve-3d shadow-[0_30px_60px_rgba(0,0,0,0.8)] ${
                flipped ? 'rotate-y-180' : ''
              }`}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Front Side */}
              <div
                className={`absolute inset-0 backface-hidden rounded-3xl overflow-hidden border transition-all duration-500 ${
                  activeCard.status === 'locked'
                    ? 'border-red-500/50 grayscale brightness-50'
                    : activeCard.type === 'black'
                    ? 'border-gray-800'
                    : activeCard.type === 'infinite'
                    ? 'border-cyan-400/50'
                    : 'border-gray-400/50'
                }`}
              >
                {activeCard.status === 'locked' && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-[2px]">
                    <div className="flex flex-col items-center animate-in zoom-in">
                      <Lock className="w-12 h-12 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] mb-2" />
                      <span className="text-red-400 text-xs font-bold uppercase tracking-widest">
                        Bloqueado
                      </span>
                    </div>
                  </div>
                )}

                {/* Card Background Patterns */}
                <div className="absolute inset-0 z-0">
                  {activeCard.type === 'black' && (
                    <div className="absolute inset-0 bg-[#0a0a0a]">
                      <div
                        className="absolute inset-0 opacity-20"
                        style={{
                          backgroundImage: `linear-gradient(45deg, #1a1a1a 25%, transparent 25%, transparent 75%, #1a1a1a 75%, #1a1a1a), 
                                            linear-gradient(45deg, #1a1a1a 25%, transparent 25%, transparent 75%, #1a1a1a 75%, #1a1a1a)`,
                          backgroundPosition: '0 0, 10px 10px',
                          backgroundSize: '20px 20px',
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800/20 via-transparent to-black" />
                      <div className="absolute top-0 right-0 w-[200%] h-full bg-gradient-to-l from-transparent via-white/5 to-transparent skew-x-[-45deg] animate-[shimmer_10s_infinite_linear]" />
                    </div>
                  )}

                  {activeCard.type === 'infinite' && (
                    <div className="absolute inset-0 bg-slate-950">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,#1e40af,transparent_80%)]" />
                      <div className="absolute inset-0 opacity-30 bg-[linear-gradient(0deg,transparent_24%,rgba(34,211,238,0.3)_25%,rgba(34,211,238,0.3)_26%,transparent_27%,transparent_74%,rgba(34,211,238,0.3)_75%,rgba(34,211,238,0.3)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,rgba(34,211,238,0.3)_25%,rgba(34,211,238,0.3)_26%,transparent_27%,transparent_74%,rgba(34,211,238,0.3)_75%,rgba(34,211,238,0.3)_76%,transparent_77%,transparent)] bg-[length:50px_50px]" />
                      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-cyan-500/10 to-blue-600/10" />
                      <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-cyan-500/20 rounded-full blur-[80px] animate-pulse" />
                    </div>
                  )}

                  {activeCard.type === 'platinum' && (
                    <div className="absolute inset-0 bg-[#e2e8f0]">
                      <div
                        className="absolute inset-0 opacity-40"
                        style={{
                          backgroundImage: `repeating-linear-gradient(90deg, transparent 0, transparent 2px, #94a3b8 2px, #94a3b8 4px)`,
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/60 to-transparent opacity-50" />
                      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0)_40%,rgba(255,255,255,0.8)_50%,rgba(255,255,255,0)_60%)] bg-[length:200%_200%] animate-[shimmer_5s_infinite]" />
                    </div>
                  )}
                </div>

                {/* Card Brand & Details */}
                <div
                  className={`relative z-10 p-6 flex flex-col justify-between h-full ${
                    activeCard.type === 'platinum' ? 'text-slate-800' : 'text-white'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-9 rounded-md shadow-lg flex items-center justify-center border border-black/10 relative overflow-hidden ${
                          activeCard.type === 'black'
                            ? 'bg-gradient-to-br from-yellow-600 to-yellow-800'
                            : activeCard.type === 'infinite'
                            ? 'bg-gradient-to-br from-cyan-300 to-blue-400'
                            : 'bg-gradient-to-br from-gray-300 to-gray-500'
                        }`}
                      >
                        <div className="absolute inset-0 border border-black/20 rounded-md" />
                        <div className="w-full h-[1px] bg-black/20 absolute top-1/2 -translate-y-1/2" />
                        <div className="h-full w-[1px] bg-black/20 absolute left-1/3" />
                        <div className="h-full w-[1px] bg-black/20 absolute right-1/3" />
                        <div className="w-4 h-4 rounded-full border border-black/20" />
                      </div>
                      <Wifi
                        className={`w-6 h-6 opacity-80 rotate-90 ${
                          activeCard.type === 'infinite'
                            ? 'text-cyan-200 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]'
                            : ''
                        }`}
                      />
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-bold italic text-2xl tracking-wider drop-shadow-md">
                        {activeCard.brand === 'mastercard' ? 'Mastercard' : 'Visa'}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-[0.3em] opacity-80 border-t border-current pt-1 mt-1">
                        {activeCard.alias}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className={`font-mono text-xl md:text-2xl tracking-[0.15em] drop-shadow-md flex justify-between items-center ${showDetails && activeCard.status !== 'locked' ? '' : 'opacity-90'}`}>
                      {activeCard.number.split(' ').map((chunk, i) => (
                        <span key={i} className="transition-all duration-300">
                          {showDetails && activeCard.status !== 'locked' ? chunk : '••••'}
                        </span>
                      ))}
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[8px] uppercase tracking-widest mb-1 opacity-60 font-bold">
                          Titular
                        </p>
                        <p className="font-bold tracking-widest text-sm md:text-base shadow-black/10 drop-shadow-sm">
                          {activeCard.holder}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] uppercase tracking-widest mb-1 opacity-60 font-bold">
                          Validade
                        </p>
                        <p className="font-mono text-sm font-bold">
                          {showDetails ? activeCard.expiry : '••/••'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Back Side */}
              <div
                className={`absolute inset-0 rotate-y-180 backface-hidden rounded-3xl overflow-hidden shadow-2xl border ${
                  activeCard.type === 'platinum'
                    ? 'bg-slate-300 border-white/50'
                    : 'bg-[#050505] border-white/10'
                }`}
                style={{ transform: 'rotateY(180deg)' }}
              >
                <div className="w-full h-14 bg-black mt-6 relative">
                  <div className="absolute top-0 left-0 h-[1px] w-full bg-white/20" />
                  <div className="absolute bottom-0 left-0 h-[1px] w-full bg-white/20" />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="bg-white h-10 w-2/3 flex items-center justify-end px-4 relative overflow-hidden rounded-sm shadow-inner">
                      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                      <div className="w-full h-full flex items-center opacity-30 gap-1 overflow-hidden">
                        {[...Array(20)].map((_, i) => (
                          <div key={i} className="w-1 h-full bg-black skew-x-12" />
                        ))}
                      </div>
                      <span className="font-mono text-black relative z-10 italic font-bold tracking-widest text-lg ml-2">
                        {activeCard.cvv}
                      </span>
                    </div>
                    <div className="text-[8px] text-gray-500 flex-1 leading-tight font-bold">
                      CVV SECURITY CODE
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between opacity-60">
                    <div className="flex items-center gap-2">
                      <ShieldCheck
                        className={`w-8 h-8 ${
                          activeCard.type === 'platinum' ? 'text-slate-600' : 'text-gray-600'
                        }`}
                      />
                      <div
                        className={`text-[8px] font-bold uppercase tracking-widest ${
                          activeCard.type === 'platinum' ? 'text-slate-600' : 'text-gray-500'
                        }`}
                      >
                        Regenera
                        <br />
                        Secure
                      </div>
                    </div>
                    <Globe
                      className={`w-8 h-8 ${
                        activeCard.type === 'platinum' ? 'text-slate-600' : 'text-gray-600'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={toggleCard}
            className="absolute -bottom-4 right-0 p-3 bg-white/10 rounded-full backdrop-blur-md border border-white/10 text-white z-20 md:hidden active:scale-90 transition-transform"
          >
            <Rotate3D className="w-5 h-5" />
          </button>
        </div>

        {/* Local notifications */}
        {notification && (
          <div
            className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 backdrop-blur-xl border px-6 py-4 rounded-full flex items-center gap-3 z-50 animate-in zoom-in fade-in duration-300 shadow-2xl ${
              notification.type === 'alert'
                ? 'bg-red-950/90 border-red-500/50 text-red-100'
                : 'bg-[#020617]/90 border-emerald-500/50 text-white'
            }`}
          >
            {notification.type === 'alert' ? (
              <AlertTriangle className="w-5 h-5 text-red-500" />
            ) : (
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            )}
            <span className="text-sm font-bold tracking-wide">{notification.msg}</span>
          </div>
        )}

        {/* Details and dots navigation */}
        <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-sm shadow-lg">
          <div className="flex gap-2">
            {cards.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveCardIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeCardIndex === idx
                    ? 'w-8 bg-cyan-400 shadow-[0_0_10px_#22d3ee]'
                    : 'w-2 bg-gray-600'
                }`}
              />
            ))}
          </div>
          <button
            onClick={() => {
              if (!showDetails) {
                handleReveal();
              } else {
                setShowDetails(false);
              }
            }}
            className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all group ${
              showDetails ? 'text-cyan-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            {showDetails ? (
              <EyeOff className="w-4 h-4 group-hover:scale-110 transition-transform" />
            ) : (
              <Eye className="w-4 h-4 group-hover:scale-110 transition-transform" />
            )}
            {showDetails ? 'Ocultar Dados' : 'Ver Detalhes'}
          </button>
        </div>

        {/* Limit Slider */}
        <div
          className={`bg-gradient-to-b from-white/10 to-white/5 rounded-3xl p-6 border border-white/10 shadow-lg relative overflow-hidden transition-all duration-500 ${
            activeCard.status === 'locked' ? 'opacity-50 grayscale' : ''
          }`}
        >
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Activity className="w-32 h-32 text-white" />
          </div>
          <div className="flex justify-between text-xs text-gray-400 uppercase tracking-widest font-bold mb-3">
            <span>Limite Utilizado</span>
            <span className={activeCard.used / activeCard.limit > 0.8 ? 'text-red-400' : 'text-emerald-400'}>
              {Math.round((activeCard.used / activeCard.limit) * 100)}%
            </span>
          </div>
          <div className="h-4 w-full bg-black/40 rounded-full overflow-hidden mb-6 border border-white/5 p-0.5">
            <div
              className={`h-full rounded-full bg-gradient-to-r relative ${
                activeCardIndex === 1 ? 'from-cyan-600 to-blue-500' : 'from-indigo-500 to-cyan-400'
              } transition-all duration-1000 ease-out`}
              style={{ width: `${Math.min((activeCard.used / activeCard.limit) * 100, 100)}%` }}
            >
              <div className="absolute top-0 right-0 h-full w-1 bg-white/50 blur-[2px] animate-pulse" />
            </div>
          </div>

          <div className="mb-6 relative z-10">
            <div className="flex justify-between items-center mb-2">
              <label
                htmlFor="limit-slider"
                className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-2"
              >
                <DollarSign className="w-3 h-3" /> Ajustar Limite
              </label>
              <span className="text-white font-mono text-sm font-bold bg-white/10 px-2 py-1 rounded border border-white/10">
                R$ {activeCard.limit.toLocaleString('pt-BR')}
              </span>
            </div>
            <input
              id="limit-slider"
              type="range"
              min={activeCard.used + 1000}
              max={500000}
              step={1000}
              value={activeCard.limit}
              onChange={handleLimitChange}
              disabled={activeCard.status === 'locked'}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="flex justify-between text-sm font-medium text-white relative z-10 pt-4 border-t border-white/5">
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Fatura Atual</p>
              <span className="font-bold text-xl">
                R$ {activeCard.used.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Disponível</p>
              <span className="text-emerald-400 font-bold text-lg">
                R$ {(activeCard.limit - activeCard.used).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={toggleLock}
            className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border transition-all group active:scale-95 touch-manipulation ${
              activeCard.status === 'locked'
                ? 'bg-emerald-500/10 border-emerald-500/50 hover:bg-emerald-500/20'
                : 'bg-white/5 border-white/10 hover:bg-red-500/10 hover:border-red-500/30'
            }`}
          >
            {activeCard.status === 'locked' ? (
              <>
                <Unlock className="w-6 h-6 mb-1 text-emerald-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                  Desbloquear
                </span>
              </>
            ) : (
              <>
                <Lock className="w-6 h-6 mb-1 text-gray-300 group-hover:text-red-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300 group-hover:text-red-400">
                  Bloquear
                </span>
              </>
            )}
          </button>

          <button
            onClick={() => handleCopy(activeCard.number)}
            className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all text-gray-300 hover:text-cyan-400 group active:scale-95 touch-manipulation"
          >
            <Copy className="w-6 h-6 group-hover:scale-110 transition-transform mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Copiar Nº
            </span>
          </button>

          {activeCard.type === 'infinite' && (
            <button
              onClick={() => {
                if (confirm('Deseja provisionar este cartão na sua carteira digital?')) {
                  provisionMutation.mutate();
                }
              }}
              disabled={provisionMutation.isPending}
              className="col-span-2 flex items-center justify-center gap-3 py-4 rounded-2xl bg-gradient-to-r from-blue-900/40 to-cyan-900/40 border border-cyan-500/30 hover:brightness-110 transition-all text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.1)] active:scale-[0.98]"
            >
              <Smartphone className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">
                {provisionMutation.isPending ? 'Provisionando...' : 'Adicionar à Apple Wallet'}
              </span>
            </button>
          )}

          {activeCard.type === 'platinum' && (
            <button
              onClick={handleTravelNotice}
              className="col-span-2 flex items-center justify-center gap-3 py-4 rounded-2xl bg-slate-800 border border-slate-600 hover:bg-slate-700 transition-all text-white active:scale-[0.98]"
            >
              <Globe className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Aviso Viagem</span>
            </button>
          )}

          {activeCard.type === 'black' && (
            <button
              onClick={() => showNotification('LoungeKey carregando... Acesso VIP garantido.', 'success')}
              className="col-span-2 flex items-center justify-center gap-3 py-4 rounded-2xl bg-yellow-900/20 border border-yellow-600/30 hover:bg-yellow-900/30 transition-all text-yellow-500 active:scale-[0.98]"
            >
              <Zap className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Acessar LoungeKey</span>
            </button>
          )}
        </div>
      </div>
    </AppLayout>
  );
};
