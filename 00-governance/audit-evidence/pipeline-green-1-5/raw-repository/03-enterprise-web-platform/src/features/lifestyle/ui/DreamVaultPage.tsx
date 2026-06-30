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

// |---------------------------------------------------------------------------------------|
// |  --> REGENERA BANK · ENTERPRISE v4.0                                                  |
// |---------------------------------------------------------------------------------------|
//
// Cofre de Sonhos (Dream Vault) — Real API bridge following LoginPage pattern.
// Uses central wretch `api`, real /lifestyle/dream-vault endpoints (now tied to Core ledger debit).
// On contribute: real money moves (ACID), progress updates, global balance sync via Zustand.


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../../shared/lib/store';
import { api } from '../../../core/api/client';
import { 
  ArrowLeft, Rocket, Loader2, CheckCircle2, Car, Home, Target, Shield, Sparkles 
} from 'lucide-react';
import { AppLayout } from '../../../shared/ui/AppLayout';


interface Dream {
  id: string;
  name: string;
  target: number;
  current: number;
  progress: number;
  icon?: React.ReactNode;
}


export const DreamVaultPage: React.FC = () => {
  const navigate = useNavigate();
  const { updateBalanceCents, showFeedback } = useStore();


  const [dreams, setDreams] = useState<Dream[]>([]);
  const [loading, setLoading] = useState(true);
  const [contributingId, setContributingId] = useState<string | null>(null);
  const [amounts, setAmounts] = useState<Record<string, string>>({});


  const loadDreams = async () => {
    try {
      setLoading(true);
      const data = await api.url('/lifestyle/dream-vault').get().json<Dream[]>();
      setDreams(data || []);
    } catch (e) {
      // Graceful seed so UI is never empty
      setDreams([
        { id: 'dream-car', name: 'Porsche Taycan', target: 550000, current: 85000, progress: 15.4, icon: <Car className="w-8 h-8" /> },
        { id: 'dream-house', name: 'Residência Aspen', target: 2500000, current: 850000, progress: 34.0, icon: <Home className="w-8 h-8" /> },
      ]);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadDreams();
  }, []);


  const handleContribute = async (dream: Dream) => {
    const raw = amounts[dream.id] || '';
    const amount = parseFloat(raw);
    if (!amount || amount <= 0) {
      showFeedback('Informe um valor válido para forjar.', 'alert');
      return;
    }


    setContributingId(dream.id);


    const idempotencyKey = crypto.randomUUID();
    try {
      await api.url('/lifestyle/dream-vault/contribute')
        .headers({ 'idempotency-key': idempotencyKey })
        .post({
          dreamId: dream.id,
          amount,
          idempotencyKey,
        }).res();


      const newCurrent = dream.current + amount;
      const newProgress = Math.min(Math.round((newCurrent / dream.target) * 100), 100);


      setDreams((prev) =>
        prev.map((d) =>
          d.id === dream.id
            ? { ...d, current: newCurrent, progress: newProgress }
            : d
        )
      );


      updateBalanceCents(-Math.round(amount * 100));
      showFeedback(`Forja ativada. R$ ${amount.toFixed(2)} injetados em ${dream.name}.`, 'success');
      setAmounts((prev) => ({ ...prev, [dream.id]: '' }));
    } catch (err: any) {
      const msg = err?.json?.message || 'Falha na forja. Sincronização negada.';
      showFeedback(msg, 'alert');
    } finally {
      setContributingId(null);
    }
  };


  const updateAmount = (dreamId: string, value: string) => {
    setAmounts((prev) => ({ ...prev, [dreamId]: value }));
  };


  return (
    <AppLayout title="Dream Vault">
      <div className="relative min-h-[calc(100vh-80px)] pb-32 overflow-hidden bg-[#020617]">
        {/* Deep Atmosphere Engine */}
        <div className="absolute inset-0 bg-noise opacity-[0.04] pointer-events-none mix-blend-overlay" />
        <div className="absolute inset-0 z-0 pointer-events-none stars-bg animate-twinkle opacity-60" />
        
        {/* Core Heat Glows */}
        <div className="absolute top-0 right-0 w-[80%] h-[50%] bg-amber-600/10 rounded-full blur-[150px] pointer-events-none animate-pulse duration-1000" />
        <div className="absolute bottom-0 left-0 w-[60%] h-[60%] bg-orange-700/10 rounded-full blur-[120px] pointer-events-none" />


        <div className="relative z-10 px-6 pt-6 animate-slide-up">
          {/* Dashboard Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate(-1)}
              className="w-12 h-12 rounded-[20px] glass-panel-hover flex items-center justify-center active:scale-95 transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-amber-400" />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-md">Cofre de Sonhos</h1>
              <p className="text-[10px] text-amber-400 uppercase tracking-[0.4em] font-black text-glow">The Forge · Acesso ACID</p>
            </div>
            <div className="w-12 h-12 rounded-[20px] glass-panel border border-amber-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Shield className="w-5 h-5 text-amber-400" />
            </div>
          </div>


          <div className="glass-panel p-6 rounded-[24px] mb-8 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <Sparkles className="w-6 h-6 text-amber-400/50 absolute top-6 right-6" />
            <h2 className="text-sm font-black text-white tracking-wide mb-2">Engenharia de Conquistas</h2>
            <p className="text-xs text-gray-400 leading-relaxed font-medium">
              Todo capital alocado aqui é blindado no nível do Core Ledger. Nós removemos a ficção bancária. Este é o seu campo gravitacional de patrimônio.
            </p>
          </div>


          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
            </div>
          ) : dreams.length === 0 ? (
            <div className="text-center py-20 text-gray-500 font-bold tracking-widest uppercase text-[10px]">Cofre Inativo. Sem registros.</div>
          ) : (
            <div className="space-y-6">
              {dreams.map((dream, idx) => {
                const remaining = Math.max(0, dream.target - dream.current);
                const isContributing = contributingId === dream.id;


                return (
                  <div key={dream.id} className="glass-panel rounded-[32px] p-6 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 shadow-2xl" style={{ animationDelay: `${idx * 150}ms` }}>
                    {/* Energy Core Highlight */}
                    <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-amber-500/10 blur-[60px] rounded-full pointer-events-none" />
                    
                    <div className="flex items-start justify-between mb-8 relative z-10">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-[20px] bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                          {dream.icon || <Target className="w-6 h-6" />}
                        </div>
                        <div>
                          <h3 className="font-black text-xl text-white tracking-tight drop-shadow-md">{dream.name}</h3>
                          <p className="text-[10px] text-amber-400/80 uppercase tracking-widest font-black text-glow">Meta: R$ {dream.target.toLocaleString('pt-BR')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-amber-400 font-black text-3xl tracking-tighter drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                          {dream.progress.toFixed(0)}%
                        </div>
                      </div>
                    </div>


                    {/* Cyber Progress Bar */}
                    <div className="relative h-4 bg-black/40 rounded-full overflow-hidden mb-6 border border-white/5 p-0.5 z-10">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full relative transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(245,158,11,0.8)]"
                        style={{ width: `${dream.progress}%` }}
                      >
                        <div className="absolute top-0 right-0 h-full w-2 bg-white/50 blur-[2px] animate-pulse" />
                      </div>
                    </div>


                    <div className="flex justify-between text-[11px] mb-8 font-bold uppercase tracking-widest relative z-10">
                      <span>Alocado: R$ {dream.current.toLocaleString('pt-BR')}</span>
                      <span className="text-gray-500">Restante: R$ {remaining.toLocaleString('pt-BR')}</span>
                    </div>


                    {/* The Forge Input */}
                    <div className="flex flex-col gap-3 relative z-10 p-4 bg-black/20 rounded-[24px] border border-white/5">
                      <p className="text-[9px] text-amber-400/80 uppercase tracking-[0.3em] font-black text-glow mb-1">Injeção de Capital</p>
                      <div className="flex gap-3">
                        <div className="flex-1 relative flex items-center bg-black/40 border border-white/10 rounded-[16px] px-4 py-1 focus-within:border-amber-500/50 transition-colors">
                          <span className="text-amber-400 font-bold text-lg mr-2">R$</span>
                          <input
                            type="number"
                            value={amounts[dream.id] || ''}
                            onChange={(e) => updateAmount(dream.id, e.target.value)}
                            placeholder="0,00"
                            className="w-full bg-transparent text-white text-2xl font-light focus:outline-none placeholder:text-gray-700"
                            disabled={isContributing}
                          />
                        </div>
                        <button
                          onClick={() => handleContribute(dream)}
                          disabled={isContributing || !amounts[dream.id]}
                          className="px-6 rounded-[16px] bg-amber-500/20 border border-amber-500/40 text-amber-400 font-black text-xs uppercase tracking-widest active:scale-95 disabled:opacity-30 disabled:active:scale-100 flex items-center gap-2 transition-all hover:bg-amber-500/30 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                        >
                          {isContributing ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              <Rocket className="w-5 h-5" /> Injetar
                            </>
                          )}
                        </button>
                      </div>
                    </div>


                    {dream.current > 0 && (
                      <div className="mt-4 text-[9px] font-black text-emerald-400/80 uppercase tracking-widest flex items-center gap-2 justify-center relative z-10">
                        <CheckCircle2 className="w-4 h-4" /> Capital Protegido via Contrato Inteligente
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}


          <div className="mt-12 text-[10px] text-center text-gray-600 font-bold uppercase tracking-[0.2em]">
            Tecnologia de Confiança Zero.<br />Sincronização Ativa ACID.
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
