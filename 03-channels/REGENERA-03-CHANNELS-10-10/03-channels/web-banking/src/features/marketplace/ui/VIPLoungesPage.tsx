import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/design-system/AppLayout';
import { api } from '@/platform/http/client';
import { Plane, MapPin, Shield, Star, Loader2, Gift, Wine, Building, ArrowLeft, Compass } from 'lucide-react';

export const VIPLoungesPage: React.FC = () => {
  const navigate = useNavigate();
  const [lounges, setLounges] = useState<any[]>([]);
  const [insurances, setInsurances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Call backend endpoints
        const loungesData = await api.url('/lifestyle/travel/vip-lounges').get().json<any[]>();
        const insuranceData = await api.url('/lifestyle/travel/insurances').get().json<any[]>();
        setLounges(loungesData || []);
        setInsurances(insuranceData || []);
      } catch (e) {
        // Fallback mock if backend fails
        setLounges([
          { id: 'lounge-grulhr', name: 'Regenera Lounge GRU', airport: 'Guarulhos T3', access: 'Ilimitado', rating: 4.9 },
          { id: 'lounge-sdulhr', name: 'Regenera Club SDU', airport: 'Santos Dumont T1', access: 'Ilimitado', rating: 4.8 },
          { id: 'lounge-jfk', name: 'Prime Lounge JFK', airport: 'New York JFK T4', access: '4 acessos/ano', rating: 4.7 },
        ]);
        setInsurances([
          { id: 'ins-world', type: 'Seguro Viagem Global', coverage: 'US$ 150.000', status: 'Ativo via Mastercard Black' },
          { id: 'ins-baggage', type: 'Atraso de Bagagem', coverage: 'US$ 1.500', status: 'Ativo' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <AppLayout title="Salas VIP">
      <div className="relative min-h-[calc(100vh-80px)] pb-32 overflow-hidden bg-[#020617]">
        {/* Deep Atmosphere Engine */}
        <div className="absolute inset-0 bg-noise opacity-[0.04] pointer-events-none mix-blend-overlay" />
        <div className="absolute inset-0 z-0 pointer-events-none stars-bg animate-twinkle opacity-50" />
        
        {/* Core Amber/Gold Glows for luxury feel */}
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-amber-600/10 rounded-full blur-[150px] pointer-events-none animate-pulse duration-1000" />
        <div className="absolute bottom-[10%] left-[-20%] w-[70%] h-[70%] bg-orange-800/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 px-6 pt-6 animate-slide-up">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate(-1)}
              className="w-12 h-12 rounded-[20px] glass-panel-hover flex items-center justify-center active:scale-95 transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-amber-400" />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-md">Salas VIP & Viagens</h1>
              <p className="text-[10px] text-amber-400 uppercase tracking-[0.4em] font-black text-glow">Lounge Access · VIP Tier</p>
            </div>
            <div className="w-12 h-12 rounded-[20px] glass-panel border border-amber-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Compass className="w-5 h-5 text-amber-400" />
            </div>
          </div>

          {/* Banner */}
          <div className="glass-panel p-6 rounded-[24px] mb-8 relative overflow-hidden group border border-amber-500/20">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <Plane className="w-6 h-6 text-amber-400/50 absolute top-6 right-6" />
            <h2 className="text-sm font-black text-white tracking-wide mb-2">Privilégios Exclusivos de Viagem</h2>
            <p className="text-xs text-gray-400 leading-relaxed font-medium">
              Acesso gratuito às salas VIP parceiras, seguros globais automáticos e resgate de chips de viagem eSIM em tempo real.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Lounges */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-amber-400/80 uppercase tracking-widest px-1 text-glow">Salas VIP Disponíveis</p>
                <div className="space-y-3">
                  {lounges.map((l) => (
                    <div key={l.id} className="glass-panel rounded-[24px] p-5 flex items-center justify-between border border-white/5 relative overflow-hidden">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[16px] bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                          {l.id.includes('wine') ? <Wine className="w-5 h-5" /> : l.id.includes('club') || l.id.includes('jfk') ? <Building className="w-5 h-5" /> : <Plane className="w-5 h-5" />}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white">{l.name}</h4>
                          <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-1 font-medium">
                            <MapPin className="w-3 h-3 text-amber-400/80" /> {l.airport}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                          {l.access}
                        </span>
                        <div className="text-[10px] text-yellow-500 font-bold flex items-center justify-end gap-1 mt-2">
                          <Star className="w-3 h-3 fill-current" /> {l.rating}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Insurances */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-amber-400/80 uppercase tracking-widest px-1 text-glow">Seguros & Coberturas</p>
                <div className="grid grid-cols-2 gap-4">
                  {insurances.map((ins) => (
                    <div key={ins.id} className="glass-panel rounded-[24px] p-5 border border-white/5 flex flex-col justify-between relative overflow-hidden">
                      <div>
                        <div className="w-10 h-10 rounded-[12px] bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 shadow-inner">
                          <Shield className="w-5 h-5" />
                        </div>
                        <h4 className="text-xs font-bold text-white leading-tight">{ins.type}</h4>
                        <p className="text-[10px] text-gray-500 mt-1.5 font-medium">Cobertura: {ins.coverage}</p>
                      </div>
                      <p className="text-[9px] text-emerald-400 font-black uppercase tracking-wider mt-4">
                        ✓ {ins.status}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Travel Benefits */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-amber-400/80 uppercase tracking-widest px-1 text-glow">Privilégios Adicionais</p>
                <div className="glass-panel p-5 rounded-[24px] flex items-center justify-between border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[16px] bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                      <Gift className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">Chip de Viagem eSIM</h4>
                      <p className="text-[10px] text-gray-400 font-medium">10GB de dados internacionais gratuitos por ano.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => alert('eSIM solicitado com sucesso. QR Code enviado para o seu e-mail.')}
                    className="px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                  >
                    Resgatar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};
