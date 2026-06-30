
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useMemo, useState } from 'react';
import { CardDetails, Transaction, UserProfile } from '../../types';
import { buildAccountCards } from '../../platform/module-data';
import {
  Lock, Eye, EyeOff, Copy, ShieldCheck, Zap, Smartphone,
  Nfc, Activity, CheckCircle, AlertTriangle, Unlock, DollarSign,
} from 'lucide-react';

interface CardsModuleProps {
  highlightBlock?: boolean;
  user: UserProfile;
  transactions: Transaction[];
}

const CardsModule: React.FC<CardsModuleProps> = ({
  highlightBlock,
  user,
  transactions,
}) => {
  const initialCards = useMemo(
    () => buildAccountCards(user, transactions),
    [user, transactions],
  );
  const [cards, setCards] = useState<CardDetails[]>(initialCards);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [notification, setNotification] = useState<{
    msg: string;
    type: 'success' | 'alert';
  } | null>(null);

  React.useEffect(() => {
    setCards(initialCards);
  }, [initialCards]);

  const activeCard = cards[activeCardIndex] ?? initialCards[0];

  const showNotification = (msg: string, type: 'success' | 'alert' = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const toggleLock = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const updated = [...cards];
    const isLocked = activeCard.status === 'locked';
    updated[activeCardIndex] = {
      ...activeCard,
      status: isLocked ? 'active' : 'locked',
    };
    setCards(updated);
    showNotification(
      isLocked ? 'Cartão desbloqueado' : 'Cartão bloqueado temporariamente',
      isLocked ? 'success' : 'alert',
    );
  };

  const handleCopy = (text: string) => {
    if (activeCard.status === 'locked') {
      showNotification('Cartão bloqueado — ação negada', 'alert');
      return;
    }
    void navigator.clipboard.writeText(text.replace(/\s/g, ''));
    showNotification('Número copiado', 'success');
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLimit = Number(e.target.value);
    const updated = [...cards];
    updated[activeCardIndex] = { ...activeCard, limit: newLimit };
    setCards(updated);
  };

  if (!activeCard) {
    return null;
  }

  return (
    <div className="p-6 space-y-8 animate-in slide-in-from-bottom duration-700 pb-32">
      <p className="text-[10px] text-gray-500 uppercase tracking-widest text-center">
        Cartões vinculados à conta ativa · limites espelham saldo disponível no BFF
      </p>

      <div className="flex justify-center gap-3 mb-4">
        {cards.map((card, idx) => (
          <button
            key={card.id}
            type="button"
            onClick={() => {
              setActiveCardIndex(idx);
              setFlipped(false);
              setShowDetails(false);
            }}
            className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 border ${
              activeCardIndex === idx
                ? 'bg-white text-bg-deep border-white shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-105'
                : 'bg-white/5 border-transparent text-gray-500 hover:bg-white/10 hover:text-white'
            }`}
          >
            {card.type === 'black' ? 'Débito' : 'Digital'}
          </button>
        ))}
      </div>

      <div
        className="perspective-1000 w-full h-56 cursor-pointer group relative z-10"
        onClick={() => setFlipped(!flipped)}
        onKeyDown={() => {}}
        role="presentation"
      >
        <div
          className={`relative w-full h-full transition-transform duration-700 preserve-3d shadow-[0_30px_60px_rgba(0,0,0,0.8)] ${flipped ? 'rotate-y-180' : ''}`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div
            className={`absolute inset-0 backface-hidden rounded-3xl overflow-hidden border transition-all duration-500 ${
              activeCard.status === 'locked'
                ? 'border-red-500/50 grayscale brightness-75'
                : activeCard.type === 'black'
                  ? 'border-gray-800 bg-black'
                  : 'border-cyan-400/50 bg-blue-900'
            }`}
          >
            {activeCard.status === 'locked' && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-[2px]">
                <div className="flex flex-col items-center">
                  <Lock className="w-12 h-12 text-red-500 mb-2" />
                  <span className="text-red-400 text-xs font-bold uppercase tracking-widest">
                    Bloqueado
                  </span>
                </div>
              </div>
            )}
            <div className="absolute inset-0 z-0">
              {activeCard.type === 'black' ? (
                <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-black to-[#0a0a0a]" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-950 to-bg-deep" />
              )}
            </div>
            <div className="relative z-10 p-6 flex flex-col justify-between h-full text-white">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-8 rounded-md bg-gradient-to-br from-yellow-600 to-yellow-800 border border-black/10" />
                  <Nfc className="w-6 h-6 opacity-80" />
                </div>
                <span className="font-bold italic text-xl">
                  {activeCard.brand === 'mastercard' ? 'Mastercard' : 'Visa'}
                </span>
              </div>
              <div className="space-y-4">
                <div className="font-mono text-xl tracking-widest flex justify-between">
                  {activeCard.number.split(' ').map((chunk, i) => (
                    <span key={i}>{showDetails && activeCard.status !== 'locked' ? chunk : '••••'}</span>
                  ))}
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[8px] uppercase tracking-widest mb-1 opacity-60">Titular</p>
                    <p className="font-bold tracking-widest text-sm">{activeCard.holder}</p>
                  </div>
                  <div>
                    <p className="text-[8px] uppercase tracking-widest mb-1 opacity-60">Validade</p>
                    <p className="font-mono text-sm">{showDetails ? activeCard.expiry : '••/••'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className="absolute inset-0 rotate-y-180 backface-hidden rounded-3xl overflow-hidden shadow-2xl border bg-[#0a0a0a] border-white/10"
            style={{ transform: 'rotateY(180deg)' }}
          >
            <div className="w-full h-14 bg-black mt-6" />
            <div className="p-6 flex items-center gap-4">
              <div className="bg-white h-10 w-2/3 flex items-center justify-end px-4 rounded-md">
                <span className="font-mono text-black font-bold">---</span>
              </div>
              <p className="text-[8px] text-gray-500 flex-1">CVC virtual — emissão física na Onda C</p>
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 opacity-50">
              <ShieldCheck className="w-10 h-10 text-gray-600" />
              <span className="text-[8px] font-bold uppercase text-gray-500 text-center">
                Regenera Bank
                <br />
                Conta {user.accountNumber || 'ativa'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {notification && (
        <div
          className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 backdrop-blur-xl border px-6 py-4 rounded-full flex items-center gap-3 z-50 shadow-2xl ${
            notification.type === 'alert'
              ? 'bg-red-950/90 border-red-500/50 text-red-100'
              : 'bg-bg-deep/90 border-emerald-500/50 text-white'
          }`}
        >
          {notification.type === 'alert' ? (
            <AlertTriangle className="w-5 h-5 text-red-500" />
          ) : (
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          )}
          <span className="text-sm font-bold">{notification.msg}</span>
        </div>
      )}

      <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
        <div className="flex gap-2">
          {cards.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveCardIndex(idx)}
              className={`h-1.5 rounded-full transition-all ${activeCardIndex === idx ? 'w-8 bg-cyan-400' : 'w-2 bg-gray-600'}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white"
        >
          {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showDetails ? 'Ocultar' : 'Ver dados'}
        </button>
      </div>

      <div
        className={`bg-gradient-to-b from-white/10 to-white/5 rounded-3xl p-6 border border-white/10 ${activeCard.status === 'locked' ? 'opacity-50' : ''}`}
      >
        <div className="flex justify-between text-xs text-gray-400 uppercase tracking-widest font-bold mb-3">
          <span>Gastos no período (extrato)</span>
          <span>
            {activeCard.limit > 0
              ? `${Math.round((activeCard.used / activeCard.limit) * 100)}%`
              : '0%'}
          </span>
        </div>
        <div className="h-4 w-full bg-black/40 rounded-full overflow-hidden mb-6 border border-white/5 p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-400 transition-all duration-1000"
            style={{
              width: `${Math.min(activeCard.limit > 0 ? (activeCard.used / activeCard.limit) * 100 : 0, 100)}%`,
            }}
          />
        </div>
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="limit-slider" className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-2">
              <DollarSign className="w-3 h-3" /> Teto de gasto
            </label>
            <span className="text-white font-mono text-sm font-bold bg-white/10 px-2 py-1 rounded">
              R$ {activeCard.limit.toLocaleString('pt-BR')}
            </span>
          </div>
          <input
            id="limit-slider"
            type="range"
            min={activeCard.used}
            max={Math.max(user.availableBalance, activeCard.used)}
            step={100}
            value={activeCard.limit}
            onChange={handleLimitChange}
            disabled={activeCard.status === 'locked'}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-50"
          />
        </div>
        <div className="flex justify-between text-sm text-white pt-4 border-t border-white/5">
          <div>
            <p className="text-[10px] text-gray-500 uppercase">Saídas (extrato)</p>
            <span className="font-bold text-xl">
              R$ {activeCard.used.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-500 uppercase">Disponível conta</p>
            <span className="text-emerald-400 font-bold text-lg">
              R$ {user.availableBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={toggleLock}
          className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border transition-all active:scale-95 ${
            activeCard.status === 'locked'
              ? 'bg-emerald-500/10 border-emerald-500/50'
              : highlightBlock
                ? 'bg-red-500/20 border-red-500 animate-pulse'
                : 'bg-white/5 border-white/10 hover:border-red-500/30'
          }`}
        >
          {activeCard.status === 'locked' ? (
            <Unlock className="w-6 h-6 text-emerald-400" />
          ) : (
            <Lock className="w-6 h-6 text-gray-300" />
          )}
          <span className="text-[10px] font-bold uppercase tracking-widest">
            {activeCard.status === 'locked' ? 'Desbloquear' : 'Bloquear'}
          </span>
        </button>
        <button
          type="button"
          onClick={() => handleCopy(activeCard.number)}
          className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all active:scale-95"
        >
          <Copy className="w-6 h-6 text-gray-300" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Copiar Nº</span>
        </button>
        {activeCard.type === 'infinite' && (
          <button
            type="button"
            className="col-span-2 flex items-center justify-center gap-3 py-4 rounded-2xl bg-gradient-to-r from-blue-900/40 to-cyan-900/40 border border-cyan-500/30 text-cyan-400"
          >
            <Smartphone className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">
              Tokenização wallet — fila Onda C
            </span>
          </button>
        )}
        {activeCard.type === 'black' && (
          <button
            type="button"
            className="col-span-2 flex items-center justify-center gap-3 py-4 rounded-2xl bg-yellow-900/20 border border-yellow-600/30 text-yellow-500"
          >
            <Zap className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">
              Débito atrelado ao saldo · Pix e transferência liberados
            </span>
          </button>
        )}
      </div>
      <div className="flex items-center justify-center gap-2 opacity-40">
        <Activity className="w-4 h-4" />
        <span className="text-[9px] uppercase tracking-widest">Última sync: extrato BFF</span>
      </div>
    </div>
  );
};

export default CardsModule;