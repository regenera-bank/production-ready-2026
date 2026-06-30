/*
|---------------------------------------------------------------------------------------|
|  --> REGENERA ENTERPRISE SYSTEM v4.0                                                  |
|---------------------------------------------------------------------------------------|

PROJECT:       Regenera Bank
CEO:           Raphaela Cerveski
DEVELOPER:     Don Paulo Ricardo
ID:            2098233287
COPYRIGHT:     Copyright (c) 2026 Regenera Corporate

LICENSE:       EULA (End-User License Agreement)
PROTECTION:    PROPRIEDADE INTELECTUAL RESTRITA

WARNING:       TODOS OS DIREITOS RESERVADOS. Proibida a cópia, distribuição,
               engenharia reversa ou modificação não autorizada.

|---------------------------------------------------------------------------------------|
|  --> CLASSIFICATION: PROPRIETARY // DEVELOPER MAINTAINED // REQUIRES SENIOR REVIEW          |
|---------------------------------------------------------------------------------------|
*/

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../../shared/lib/store';
import { AppLayout } from '../../../shared/ui/AppLayout';
import { useGetCoreDashboard } from '../../../shared/api/generated/default/default';  // Orval migrated hook (rode orval + Guia spec) - api/useQuery no longer needed post migration

// All sensitive ops (Open Finance via PROMETEO_API_KEY from SM, etc.) go through backend
// which uses Secret Manager (gcloud --set-secrets=PROMETEO_API_KEY=... etc.)
// Frontend only calls with Firebase IdToken (Identity Toolkit + IAM).

// Tipagem básica para o dashboard vindo do backend
interface DashboardData {
  globalBalance?: number; // legacy float from backend - we convert to cents immediately
  globalBalanceCents?: number;
  monthlyYield: number;
  creditScore: number;
  account?: string;
  recentTransactions?: any[];
}
import { Bell, ChevronRight, BrainCircuit, Globe, Baby, User, Dog, ArrowUpRight, Lock, Eye, EyeOff, Zap, Cloud, CreditCard, TrendingUp, ShoppingCart, UtensilsCrossed, Fuel, Menu, ChevronDown, Copy, AlertTriangle } from 'lucide-react';

export const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, globalBalanceCents, updateBalanceCents, setSidebarOpen } = useStore();
  const [showBalance, setShowBalance] = useState(() => {
    const saved = sessionStorage.getItem('showBalance');
    return saved !== 'false';
  });
  const [expandHeroCard, setExpandHeroCard] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // MIGRATED to Orval-generated hook (ações imediatas: "Migre hooks" after rode orval).
  // Uses exact customAxiosInstance (IdToken injection, no client secrets).
  // Stale/retry from orval.config (or overridden).
  const dashboardQuery = useGetCoreDashboard({
    query: {
      staleTime: 10000,
      retry: 2,
    },
  } as any);
  const rawDash: any = (dashboardQuery as any).data || {};
  const cents = typeof rawDash?.globalBalanceCents === 'number' ? rawDash.globalBalanceCents : typeof rawDash?.globalBalance === 'number' ? Math.round(rawDash.globalBalance * 100) : 0;
  if (cents !== globalBalanceCents) {
    updateBalanceCents(cents - globalBalanceCents);
  }
  const dashboard: DashboardData = { ...rawDash, globalBalanceCents: cents };
  const dashboardIsError = !!(dashboardQuery as any).isError;
  const dashboardIsFetching = !!(dashboardQuery as any).isFetching;
  const refetchDashboard = (dashboardQuery as any).refetch;

  const dashboardError = dashboardIsError ? 'Sistema Neural Indisponível' : null;

  // Sync authoritative cents from query data into global store (single source of truth for balance across app).
  useEffect(() => {
    if (dashboard?.globalBalanceCents != null && dashboard.globalBalanceCents !== globalBalanceCents) {
      updateBalanceCents(dashboard.globalBalanceCents - globalBalanceCents);
    }
  }, [dashboard?.globalBalanceCents]);

  return (
    <AppLayout activeTab="home" title="Visão Geral" showHeader={false}>
      {/* Header — exact match design: hamburger (opens full sidebar), REGENERA, bell */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center" aria-label="Menu">
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">REGENERA</p>
            <p className="text-[9px] text-gray-600 -mt-0.5 tracking-widest">Enterprise v4.0</p>
          </div>
        </div>
        <button onClick={() => navigate('/notifications')} className="relative w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
          <Bell className="w-4 h-4 text-gray-400" />
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-600 rounded-full text-[8px] flex items-center justify-center font-black border border-[#080d1a]">3</span>
        </button>
      </div>

      {/* Balance Card — exact per UX flow design: ENTERPRISE, lock icon, SALDO GLOBAL, eye toggle, RAPHAELA name, ····8429 ONLINE, green dot */}
      <div className="mx-4 mb-5">
        <div 
          className={`relative rounded-[2rem] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.6)] group transition-all duration-700 ease-out border border-white/10 ${expandHeroCard ? 'h-auto bg-[#0a0f1e]' : 'h-[300px] overflow-hidden'}`}
          style={{
            background: expandHeroCard
              ? 'linear-gradient(160deg, #020617 0%, #0f172a 100%)'
              : 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(15,23,42,1) 100%)'
          }}
        >
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-bold tracking-[0.3em] text-cyan-300 uppercase border border-cyan-500/30 px-3 py-1 rounded-full backdrop-blur-md bg-cyan-950/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
                Enterprise
              </span>
              <div className="p-2 bg-white/5 rounded-full border border-white/5 backdrop-blur-md shadow-inner">
                <Lock className="text-white/70 w-6 h-6" />
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Saldo Global</p>
                <button 
                  onClick={() => {
                    const nextVal = !showBalance;
                    setShowBalance(nextVal);
                    sessionStorage.setItem('showBalance', String(nextVal));
                  }} 
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-gray-400 tracking-tight animate-in fade-in zoom-in duration-700">
                {showBalance 
                  ? 'R$ ' + ((globalBalanceCents || dashboard?.globalBalanceCents || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                  : 'R$ •••••'}
              </h2>
            </div>

            {!expandHeroCard && (
              <div className="flex justify-between items-end border-t border-white/5 pt-4">
                <div>
                  <p className="font-bold text-white tracking-wide text-sm uppercase">{user?.name || 'Raphaela Cerveski'}</p>
                  <p className="text-[10px] text-gray-500 tracking-[0.2em] mt-1 font-mono">•••• {dashboard?.account || '8429'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#10b981]" />
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Online</span>
                </div>
              </div>
            )}

            <button 
              onClick={() => setExpandHeroCard(!expandHeroCard)} 
              className="absolute bottom-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all active:scale-95 border border-white/5"
            >
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-500 ${expandHeroCard ? 'rotate-180' : ''}`} />
            </button>

            {expandHeroCard && (
              <div className="pt-6 border-t border-white/10 space-y-4 animate-in slide-in-from-top-4 fade-in duration-500">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Agência</p>
                    <p className="font-mono text-white text-sm">0001</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Conta Corrente</p>
                    <p className="font-mono text-white text-sm">84920-5</p>
                  </div>
                </div>
                <div 
                  className="bg-white/5 p-3 rounded-xl border border-white/5 flex justify-between items-center group cursor-pointer"
                  onClick={() => copyToClipboard('BR45 0001 0000 0008 4920 5000')}
                >
                  <div>
                    <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">IBAN (Internacional)</p>
                    <p className="font-mono text-white text-xs">BR45 0001 0000 0008 4920 5000</p>
                  </div>
                  {copied ? (
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider animate-pulse">Copiado!</span>
                  ) : (
                    <Copy className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {dashboardError && (
          <div className="p-3 mt-2 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-400 text-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{dashboardError}. Saldo pode estar desatualizado.</span>
            </div>
            <button 
              onClick={() => refetchDashboard()} 
              disabled={dashboardIsFetching}
              className="text-xs px-3 py-1 bg-red-500/20 rounded text-red-300 flex items-center gap-1.5 disabled:opacity-50"
            >
              {dashboardIsFetching ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-red-300 border-t-transparent rounded-full animate-spin" />
                  <span>Carregando...</span>
                </>
              ) : (
                'Tentar novamente'
              )}
            </button>
          </div>
        )}
      </div>

      {/* Quick Actions — exact 4 per UX flow design SVG: PIX, CLOUD, CARTÕES, INVEST. */}
      <div className="px-4 mb-5">
        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-3 px-1">ACESSO RÁPIDO</p>
        <div className="grid grid-cols-4 gap-3">
          <button onClick={() => navigate('/pix')} className="flex flex-col items-center gap-1 p-3 bg-[#ffffff08] rounded-2xl border border-white/10 active:scale-[0.985] transition-all group">
            <Zap className="w-6 h-6 text-cyan-400" />
            <span className="text-[10px] text-gray-300 group-hover:text-white font-bold tracking-widest">PIX</span>
          </button>
          <button onClick={() => navigate('/cloud')} className="flex flex-col items-center gap-1 p-3 bg-[#ffffff08] rounded-2xl border border-white/10 active:scale-[0.985] transition-all group">
            <Cloud className="w-6 h-6 text-cyan-400" />
            <span className="text-[10px] text-gray-300 group-hover:text-white font-bold tracking-widest">CLOUD</span>
          </button>
          <button onClick={() => navigate('/cards')} className="flex flex-col items-center gap-1 p-3 bg-[#ffffff08] rounded-2xl border border-white/10 active:scale-[0.985] transition-all group">
            <CreditCard className="w-6 h-6 text-cyan-400" />
            <span className="text-[10px] text-gray-300 group-hover:text-white font-bold tracking-widest">CARTÕES</span>
          </button>
          <button onClick={() => navigate('/investments')} className="flex flex-col items-center gap-1 p-3 bg-[#ffffff08] rounded-2xl border border-white/10 active:scale-[0.985] transition-all group">
            <TrendingUp className="w-6 h-6 text-cyan-400" />
            <span className="text-[10px] text-gray-300 group-hover:text-white font-bold tracking-widest">INVEST.</span>
          </button>
        </div>
      </div>

      {/* Neural Core Banner - Sempre destacado (Raphaela A.I.) */}
      <div className="mx-4 mb-5">
        <button 
          onClick={() => navigate('/neural-core')}
          className="w-full bg-[#0d1526] border border-indigo-500/25 rounded-2xl p-5 text-left relative overflow-hidden group hover:border-indigo-400/40 active:scale-[0.995] transition-all"
        >
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
              <BrainCircuit className="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Neural Core • Raphaela A.I.</h3>
              <p className="text-[9px] text-indigo-400 uppercase tracking-widest font-black">Vertex AI • Análise em Tempo Real</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400 leading-relaxed">
              Detectei oportunidade de otimização em <strong className="text-white">Renda Fixa + Cripto</strong>. Quer que eu execute rebalanceamento?
            </p>
            <ChevronRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform flex-shrink-0 ml-2" />
          </div>
        </button>
      </div>

      {/* Contas Gerações - Design UI: Segmentação por Perfil (Kids / Senior / Pet) — cyan aligned to match primary theme + perfect grid alignment */}
      <div className="px-4 mb-5">
        <div className="flex items-center justify-between mb-3 px-1">
          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Contas Gerações • Lock-in Familiar</p>
          <button 
            onClick={() => navigate('/generations/kids')} 
            className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider active:opacity-70"
          >
            Ver Todas →
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {/* Kids */}
          <button 
            onClick={() => navigate('/generations/kids')}
            className="bg-[#0d1526] border border-cyan-500/20 rounded-2xl p-4 text-left active:scale-[0.985] transition-all group flex flex-col"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-md bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                <Baby className="w-3 h-3 text-cyan-400" />
              </div>
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Kids</span>
            </div>
            <p className="text-sm font-bold text-white mb-0.5">Meu Tesouro</p>
            <p className="text-[10px] text-gray-400 leading-tight">Missões + Educação Financeira</p>
          </button>

          {/* Senior */}
          <button 
            onClick={() => navigate('/generations/senior')}
            className="bg-[#0d1526] border border-cyan-500/20 rounded-2xl p-4 text-left active:scale-[0.985] transition-all group flex flex-col"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-md bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                <User className="w-3 h-3 text-cyan-400" />
              </div>
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Senior</span>
            </div>
            <p className="text-sm font-bold text-white mb-0.5">Concierge</p>
            <p className="text-[10px] text-gray-400 leading-tight">Acessibilidade + Raphaela</p>
          </button>

          {/* Pet */}
          <button 
            onClick={() => navigate('/generations/pet')}
            className="bg-[#0d1526] border border-cyan-500/20 rounded-2xl p-4 text-left active:scale-[0.985] transition-all group flex flex-col"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-md bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                <Dog className="w-3 h-3 text-cyan-400" />
              </div>
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Pet</span>
            </div>
            <p className="text-sm font-bold text-white mb-0.5">Apollo</p>
            <p className="text-[10px] text-gray-400 leading-tight">Saúde + Lembretes</p>
          </button>
        </div>
      </div>

      {/* Pilar Infra + Cloud */}
      <div className="px-4 mb-5">
        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-3 px-1">Infraestrutura Regenera (GCP)</p>
        <button 
          onClick={() => navigate('/cloud')}
          className="w-full bg-[#0d1526] border border-indigo-500/20 rounded-2xl p-4 flex items-center justify-between active:scale-[0.985] transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <Globe className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Regenera Cloud</p>
              <p className="text-[10px] text-gray-400">3 instâncias • southamerica-east1</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-0.5 transition" />
        </button>
      </div>

      {/* Recent Transactions — exact label + samples per design when no data */}
      <div className="px-4 pb-6">
        <div className="flex items-center justify-between mb-3 px-1">
          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">ÚLTIMAS TRANSAÇÕES</p>
          <button 
            onClick={() => navigate('/pix')} 
            className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider active:opacity-70"
          >
            Ver Extrato Completo →
          </button>
        </div>

        <div className="space-y-2">
          {((dashboard as any)?.recentTransactions && (dashboard as any).recentTransactions.length > 0) ? (
            (dashboard as any).recentTransactions.slice(0, 4).map((tx: any, index: number) => (
              <button 
                key={tx.id || index} 
                onClick={() => navigate('/pix')}
                className="w-full flex items-center justify-between p-4 bg-[#0d1526] border border-white/5 rounded-[18px] active:bg-white/5 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${Number(tx.amount) > 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                    {Number(tx.amount) > 0 ? 
                      <ArrowUpRight className="w-4 h-4 text-emerald-400 rotate-180" /> : 
                      <ArrowUpRight className="w-4 h-4 text-red-400" />
                    }
                  </div>
                  <div>
                    <p className="font-bold text-sm text-white">{tx.description || tx.type || 'Transação'}</p>
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-0.5">
                      {tx.party || tx.counterparty || 'Regenera'} · {tx.timestamp || tx.date || 'agora'}
                    </p>
                  </div>
                </div>
                <span className={`font-bold text-sm ${Number(tx.amount) > 0 ? 'text-emerald-400' : 'text-white'}`}>
                  {Number(tx.amount) > 0 ? '+' : ''}R$ {Math.abs(Number(tx.amount)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </button>
            ))
          ) : (
            /* Fallback samples matching exact UX flow SVG design for visual fidelity */
            <div className="space-y-2">
              {[
                { icon: Zap, label: 'Pix Recebido', sub: 'HOJE 14:30 • JOÃO SILVA', amt: '+R$2.500', pos: true },
                { icon: ShoppingCart, label: 'Compra Online', sub: 'ONTEM 19:45 • REGENERA STORE', amt: '-R$299,90', pos: false },
                { icon: UtensilsCrossed, label: 'Restaurante Savor', sub: '24/11 • CARTÃO FINAL 8429', amt: '-R$320', pos: false },
                { icon: Fuel, label: 'Posto Energia', sub: '23/11 • AUTOMÓVEL', amt: '-R$180', pos: false },
              ].map((t, i) => (
                <button key={i} onClick={() => navigate('/pix')} className="w-full flex items-center justify-between p-4 bg-[#0d1526] border border-white/5 rounded-[18px] active:bg-white/5 text-left">
                  <div className="flex items-center gap-3">
                    <t.icon className="w-4 h-4 text-cyan-400" />
                    <div>
                      <p className="font-bold text-sm text-white">{t.label}</p>
                      <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-0.5">{t.sub}</p>
                    </div>
                  </div>
                  <span className={`font-bold text-sm ${t.pos ? 'text-emerald-400' : 'text-red-400'}`}>{t.amt}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Links diretos para todas as rotas principais (Design UI completo) */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Explorar Todo o Sistema</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => navigate('/profile')} className="p-3 bg-white/5 rounded-xl text-left text-[10px] font-medium tracking-widest active:bg-white/10">Perfil & Segurança</button>
            <button onClick={() => navigate('/open-finance')} className="p-3 bg-white/5 rounded-xl text-left text-[10px] font-medium tracking-widest active:bg-white/10">Open Finance</button>
            <button onClick={() => navigate('/dream-vault')} className="p-3 bg-white/5 rounded-xl text-left text-[10px] font-medium tracking-widest active:bg-white/10">Dream Vault</button>
            <button onClick={() => navigate('/marketplace')} className="p-3 bg-white/5 rounded-xl text-left text-[10px] font-medium tracking-widest active:bg-white/10">Marketplace</button>
            <button onClick={() => navigate('/documents')} className="p-3 bg-white/5 rounded-xl text-left text-[10px] font-medium tracking-widest active:bg-white/10">Documentos</button>
            <button onClick={() => navigate('/neural-core')} className="p-3 bg-white/5 rounded-xl text-left text-[10px] font-medium tracking-widest active:bg-white/10">Raphaela A.I. Completa</button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
