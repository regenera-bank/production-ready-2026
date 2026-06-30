
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { CardDetails } from '../../types';
import { CreditCard, Wifi, Lock, Eye, EyeOff, Copy, ShieldCheck, Globe, Zap, Smartphone, Nfc, Activity, CheckCircle, AlertTriangle, Unlock, DollarSign } from 'lucide-react';

const INITIAL_MOCK_CARDS: CardDetails[] = [
    {
        id: '1',
        alias: 'Regenera Black Infinite',
        number: '4829 9012 3456 7890',
        holder: 'DON PAULO RICARDO',
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
        holder: 'PAULO R. ENTERPRISE',
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
        alias: 'Global Silver',
        number: '3742 1001 5678 9000',
        holder: 'PAULO RICARDO',
        expiry: '05/29',
        cvv: '998',
        limit: 250000,
        used: 45000.00,
        brand: 'mastercard',
        type: 'platinum',
        status: 'active'
    }
];

interface CardsModuleProps {
    highlightBlock?: boolean;
}

const CardsModule: React.FC<CardsModuleProps> = ({ highlightBlock }) => {
    const [cards, setCards] = useState<CardDetails[]>(INITIAL_MOCK_CARDS);
    const [activeCardIndex, setActiveCardIndex] = useState(0);
    const [showDetails, setShowDetails] = useState(false);
    const [flipped, setFlipped] = useState(false);
    const [notification, setNotification] = useState<{msg: string, type: 'success' | 'alert'} | null>(null);

    const activeCard = cards[activeCardIndex];

    const toggleCard = () => {
        setFlipped(!flipped);
    };

    const handleCopy = (text: string) => {
        if (activeCard.status === 'locked') {
            showNotification('Cartão Bloqueado - Ação Negada', 'alert');
            return;
        }
        navigator.clipboard.writeText(text);
        showNotification('Copiado para área de transferência', 'success');
    };

    const showNotification = (msg: string, type: 'success' | 'alert' = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const toggleLock = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        const updatedCards = [...cards];
        const isLocked = activeCard.status === 'locked';
        updatedCards[activeCardIndex].status = isLocked ? 'active' : 'locked';
        setCards(updatedCards);
        showNotification(isLocked ? 'Cartão Desbloqueado com Sucesso' : 'Cartão Bloqueado Temporariamente', isLocked ? 'success' : 'alert');
    };

    const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newLimit = parseInt(e.target.value);
        const updatedCards = [...cards];
        updatedCards[activeCardIndex].limit = newLimit;
        setCards(updatedCards);
    };

    return (
        <div className="p-6 space-y-8 animate-in slide-in-from-bottom duration-700 pb-32">
            
            {/* Card Selector Pills */}
            <div className="flex justify-center gap-3 mb-4">
                {cards.map((card, idx) => (
                    <button
                        key={idx}
                        onClick={() => { setActiveCardIndex(idx); setFlipped(false); setShowDetails(false); }}
                        className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 border ${
                            activeCardIndex === idx 
                            ? 'bg-white text-bg-deep border-white shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-105' 
                            : 'bg-white/5 border-transparent text-gray-500 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                        {card.type === 'black' && 'Físico'}
                        {card.type === 'infinite' && 'Digital'}
                        {card.type === 'platinum' && 'Global'}
                    </button>
                ))}
            </div>

            {/* 3D Card Container */}
            <div className="perspective-1000 w-full h-56 cursor-pointer group relative z-10" onClick={toggleCard}>
                <div className={`relative w-full h-full transition-transform duration-700 preserve-3d shadow-[0_30px_60px_rgba(0,0,0,0.8)] ${flipped ? 'rotate-y-180' : ''}`} style={{ transformStyle: 'preserve-3d' }}>
                    
                    {/* --- FRONT FACE --- */}
                    <div id={activeCard.type === 'black' ? 'cc-black' : activeCard.type === 'infinite' ? 'cc-blue' : 'cc-silver'} className={`absolute inset-0 backface-hidden rounded-3xl overflow-hidden border transition-all duration-500 ${
                        activeCard.status === 'locked' ? 'border-red-500/50 grayscale brightness-75' :
                        activeCard.type === 'black' ? 'border-gray-800 bg-black' :
                        activeCard.type === 'infinite' ? 'border-cyan-400/50 bg-blue-900' :
                        'border-white/40 bg-slate-200'
                    }`}>
                         {/* Locked Overlay */}
                         {activeCard.status === 'locked' && (
                             <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-[2px]">
                                 <div className="flex flex-col items-center animate-in zoom-in">
                                     <Lock className="w-12 h-12 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] mb-2" />
                                     <span className="text-red-400 text-xs font-bold uppercase tracking-widest">Bloqueado</span>
                                 </div>
                             </div>
                         )}

                         {/* Textures & Effects */}
                         <div className="absolute inset-0 z-0">
                            {/* OPTION 1: BLACK (FISICO) - MATTE FINISH WITH GLOSS HIGHLIGHTS */}
                            {activeCard.type === 'black' && (
                                <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-black to-[#0a0a0a]">
                                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
                                    <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.1)_0%,_transparent_50%)]"></div>
                                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/5 blur-[80px]"></div>
                                </div>
                            )}
                            
                            {/* OPTION 2: BLUE (DIGITAL) - CYBERPUNK NEON */}
                            {activeCard.type === 'infinite' && (
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-950 to-bg-deep">
                                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(34,211,238,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%] animate-[shimmer_3s_infinite_linear]"></div>
                                    <div className="absolute inset-0 border-[1px] border-cyan-400/30 rounded-3xl m-2 opacity-50"></div>
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(34,211,238,0.1)_0%,_transparent_70%)]"></div>
                                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-cyan-500/20 blur-[60px]"></div>
                                </div>
                            )}

                            {/* OPTION 3: SILVER (INTERNACIONAL) - BRUSHED METAL */}
                            {activeCard.type === 'platinum' && (
                                <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-300 to-gray-400">
                                    <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0)_30%,rgba(255,255,255,0.8)_50%,rgba(255,255,255,0)_70%)] opacity-60 bg-[length:200%_100%] animate-[shimmer_4s_infinite]"></div>
                                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, #000 3px, #000 3px)' }}></div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-gray-500/30 to-transparent"></div>
                                </div>
                            )}
                         </div>

                         {/* Card Content */}
                         <div className={`relative z-10 p-6 flex flex-col justify-between h-full ${
                             activeCard.type === 'platinum' ? 'text-slate-800' : 'text-white'
                         }`}>
                             <div className="flex justify-between items-start">
                                 {/* Chip & NFC */}
                                 <div className="flex items-center gap-4">
                                     <div className={`w-11 h-8 rounded-md shadow-inner flex items-center justify-center border border-black/10 relative overflow-hidden ${
                                         activeCard.type === 'black' ? 'bg-gradient-to-br from-yellow-600 to-yellow-800' :
                                         activeCard.type === 'infinite' ? 'bg-gradient-to-br from-cyan-300 to-blue-400' :
                                         'bg-gradient-to-br from-gray-400 to-gray-600'
                                     }`}>
                                         <div className="w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30"></div>
                                         <div className="w-full h-[1px] bg-black/20 absolute top-1/2 -translate-y-1/2"></div>
                                         <div className="h-full w-[1px] bg-black/20 absolute left-1/3"></div>
                                         <div className="h-full w-[1px] bg-black/20 absolute right-1/3"></div>
                                     </div>
                                     <Nfc className={`w-6 h-6 opacity-80 ${activeCard.type === 'infinite' ? 'text-cyan-200 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]' : ''}`} />
                                 </div>
                                 <div className="flex flex-col items-end">
                                    <span className="font-bold italic text-xl tracking-wider">{activeCard.brand === 'mastercard' ? 'Mastercard' : 'Visa'}</span>
                                    <span className="text-[8px] font-bold uppercase tracking-[0.3em] opacity-60">{activeCard.type === 'black' ? 'Black' : activeCard.type === 'infinite' ? 'Digital' : 'Silver'}</span>
                                 </div>
                             </div>

                             <div className="space-y-4">
                                 <div className={`font-mono text-xl md:text-2xl tracking-widest drop-shadow-md flex justify-between items-center ${showDetails && activeCard.status !== 'locked' ? '' : 'opacity-90'}`}>
                                     {activeCard.number.split(' ').map((chunk, i) => (
                                         <span key={i} className="transition-all duration-300">
                                            {showDetails && activeCard.status !== 'locked' ? chunk : '••••'}
                                         </span>
                                     ))}
                                 </div>
                                 <div className="flex justify-between items-end">
                                     <div>
                                         <p className="text-[8px] uppercase tracking-widest mb-1 opacity-60">Nome do Titular</p>
                                         <p className="font-bold tracking-widest text-sm md:text-base shadow-black/10 drop-shadow-sm">{activeCard.holder}</p>
                                     </div>
                                     <div>
                                         <p className="text-[8px] uppercase tracking-widest mb-1 opacity-60">Validade</p>
                                         <p className="font-mono text-sm">{showDetails ? activeCard.expiry : '••/••'}</p>
                                     </div>
                                 </div>
                             </div>
                         </div>
                    </div>

                    {/* --- BACK FACE --- */}
                    <div className={`absolute inset-0 rotate-y-180 backface-hidden rounded-3xl overflow-hidden shadow-2xl border ${
                         activeCard.type === 'platinum' ? 'bg-gray-300 border-white/50' : 'bg-[#0a0a0a] border-white/10'
                    }`} style={{ transform: 'rotateY(180deg)' }}>
                        <div className="w-full h-14 bg-black mt-6 relative">
                            <div className="absolute top-0 left-0 h-[1px] w-full bg-white/10"></div>
                            <div className="absolute bottom-0 left-0 h-[1px] w-full bg-white/10"></div>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="bg-white h-10 w-2/3 flex items-center justify-end px-4 relative overflow-hidden rounded-md shadow-inner">
                                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                                    <div className="w-full h-full flex items-center opacity-30 gap-1 overflow-hidden">
                                        {[...Array(20)].map((_, i) => <div key={i} className="w-1 h-full bg-black skew-x-12"></div>)}
                                    </div>
                                    <span className="font-mono text-black relative z-10 italic font-bold tracking-widest text-lg ml-2">
                                        {activeCard.cvv}
                                    </span>
                                </div>
                                <div className="text-[8px] text-gray-500 flex-1 leading-tight">
                                    CVC - Código de Segurança. Não compartilhe.
                                </div>
                            </div>
                            
                            <div className="mt-6 flex items-center justify-center gap-2 opacity-50">
                                <ShieldCheck className={`w-10 h-10 ${activeCard.type === 'platinum' ? 'text-slate-600' : 'text-gray-600'}`} />
                                <div className={`text-[8px] font-bold uppercase tracking-widest text-center ${activeCard.type === 'platinum' ? 'text-slate-600' : 'text-gray-500'}`}>
                                    Regenera Bank<br/>Secure Global Pass
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notification Toast */}
            {notification && (
                <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 backdrop-blur-xl border px-6 py-4 rounded-full flex items-center gap-3 z-50 animate-in zoom-in fade-in duration-300 shadow-2xl ${
                    notification.type === 'alert' ? 'bg-red-950/90 border-red-500/50 text-red-100' : 'bg-bg-deep/90 border-emerald-500/50 text-white'
                }`}>
                    {notification.type === 'alert' ? <AlertTriangle className="w-5 h-5 text-red-500" /> : <CheckCircle className="w-5 h-5 text-emerald-400" />}
                    <span className="text-sm font-bold tracking-wide">{notification.msg}</span>
                </div>
            )}

            {/* Controls */}
            <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                <div className="flex gap-2">
                    {cards.map((_, idx) => (
                        <button 
                            key={idx}
                            onClick={() => setActiveCardIndex(idx)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${activeCardIndex === idx ? 'w-8 bg-cyan-400 shadow-[0_0_10px_#22d3ee]' : 'w-2 bg-gray-600'}`}
                        />
                    ))}
                </div>
                <button 
                    onClick={() => setShowDetails(!showDetails)} 
                    className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all group ${showDetails ? 'text-cyan-400' : 'text-gray-400 hover:text-white'}`}
                >
                    {showDetails ? <EyeOff className="w-4 h-4 group-hover:scale-110 transition-transform" /> : <Eye className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                    {showDetails ? 'Ocultar Dados' : 'Ver Detalhes'}
                </button>
            </div>

            {/* Limits & Usage - Editable */}
            <div className={`bg-gradient-to-b from-white/10 to-white/5 rounded-3xl p-6 border border-white/10 shadow-lg relative overflow-hidden transition-all duration-500 ${activeCard.status === 'locked' ? 'opacity-50 grayscale' : ''}`}>
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Activity className="w-32 h-32 text-white" />
                </div>
                <div className="flex justify-between text-xs text-gray-400 uppercase tracking-widest font-bold mb-3">
                    <span>Limite Utilizado</span>
                    <span className={activeCard.used / activeCard.limit > 0.8 ? 'text-red-400' : 'text-emerald-400'}>{Math.round((activeCard.used / activeCard.limit) * 100)}%</span>
                </div>
                
                {/* Visual Progress Bar */}
                <div className="h-4 w-full bg-black/40 rounded-full overflow-hidden mb-6 border border-white/5 p-0.5">
                    <div 
                        className={`h-full rounded-full bg-gradient-to-r relative ${activeCardIndex === 1 ? 'from-cyan-600 to-blue-500' : 'from-primary to-cyan-400'} transition-all duration-1000 ease-out`} 
                        style={{ width: `${Math.min((activeCard.used / activeCard.limit) * 100, 100)}%` }}
                    >
                        <div className="absolute top-0 right-0 h-full w-1 bg-white/50 blur-[2px] animate-pulse"></div>
                    </div>
                </div>

                {/* Limit Slider */}
                <div className="mb-6 relative z-10">
                     <div className="flex justify-between items-center mb-2">
                        <label htmlFor="limit-slider" className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-2">
                            <DollarSign className="w-3 h-3" /> Ajustar Limite
                        </label>
                        <span className="text-white font-mono text-sm font-bold bg-white/10 px-2 py-1 rounded border border-white/10">
                            R$ {activeCard.limit.toLocaleString()}
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
                        <span className="font-bold text-xl">R$ {activeCard.used.toLocaleString()}</span>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">Disponível</p>
                        <span className="text-emerald-400 font-bold text-lg">R$ {(activeCard.limit - activeCard.used).toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Action Grid */}
            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={(e) => toggleLock(e)} 
                    className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border transition-all group active:scale-95 touch-manipulation ${
                        activeCard.status === 'locked'
                        ? 'bg-emerald-500/10 border-emerald-500/50 hover:bg-emerald-500/20' 
                        : (highlightBlock ? 'bg-red-500/20 border-red-500 animate-pulse' : 'bg-white/5 border-white/10 hover:bg-red-500/10 hover:border-red-500/30')
                    }`}
                >
                    {activeCard.status === 'locked' ? (
                        <>
                            <Unlock className="w-6 h-6 mb-1 text-emerald-400" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Desbloquear</span>
                        </>
                    ) : (
                        <>
                            <Lock className={`w-6 h-6 mb-1 ${highlightBlock ? 'text-red-400' : 'text-gray-300 group-hover:text-red-400'}`} />
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${highlightBlock ? 'text-red-300' : 'text-gray-300 group-hover:text-red-400'}`}>Bloquear</span>
                        </>
                    )}
                </button>

                <button onClick={() => handleCopy(activeCard.number)} className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all text-gray-300 hover:text-cyan-400 group active:scale-95 touch-manipulation">
                    <Copy className="w-6 h-6 group-hover:scale-110 transition-transform mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Copiar Nº</span>
                </button>
                
                {activeCard.type === 'infinite' && (
                     <button className="col-span-2 flex items-center justify-center gap-3 py-4 rounded-2xl bg-gradient-to-r from-blue-900/40 to-cyan-900/40 border border-cyan-500/30 hover:brightness-110 transition-all text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.1)] active:scale-[0.98]">
                        <Smartphone className="w-5 h-5" />
                        <span className="text-xs font-bold uppercase tracking-widest">Adicionar à Apple Wallet</span>
                    </button>
                )}
                {activeCard.type === 'platinum' && (
                     <button className="col-span-2 flex items-center justify-center gap-3 py-4 rounded-2xl bg-slate-800 border border-slate-600 hover:bg-slate-700 transition-all text-white active:scale-[0.98]">
                        <Globe className="w-5 h-5" />
                        <span className="text-xs font-bold uppercase tracking-widest">Aviso Viagem</span>
                    </button>
                )}
                {activeCard.type === 'black' && (
                     <button className="col-span-2 flex items-center justify-center gap-3 py-4 rounded-2xl bg-yellow-900/20 border border-yellow-600/30 hover:bg-yellow-900/30 transition-all text-yellow-500 active:scale-[0.98]">
                        <Zap className="w-5 h-5" />
                        <span className="text-xs font-bold uppercase tracking-widest">Acessar LoungeKey</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default CardsModule;
