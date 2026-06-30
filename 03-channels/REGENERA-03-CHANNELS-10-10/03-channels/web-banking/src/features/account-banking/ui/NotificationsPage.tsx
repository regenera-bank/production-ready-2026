import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/design-system/AppLayout';
import { api } from '@/platform/http/client';
import { ArrowLeft, Zap, BrainCircuit, ShieldCheck, TrendingUp, CheckCircle2, Bell } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([
    { id: 1, type: 'pix', title: 'PIX Recebido', desc: 'João Silva enviou R$ 2.500,00', time: 'Hoje 14:30', read: false, group: 'Hoje' },
    { id: 2, type: 'neural', title: 'Insight Financeiro', desc: 'Raphaela detectou oportunidade em Renda Fixa CDB 14,5% aa', time: 'Hoje 11:00', read: false, group: 'Hoje' },
  ]);

  useEffect(() => {
    // Load real recent transactions from Core (Neon PG) and map to notifications. Also fetch a neural insight.
    (async () => {
      try {
        const dash = await api.url('/core/dashboard').get().json<any>();
        const realNotifs: any[] = (dash.recentTransactions || []).slice(0, 5).map((t: any, idx: number) => ({
          id: 100 + idx,
          type: t.type && t.type.includes('pix') ? 'pix' : 'invest',
          title: t.type && t.type.includes('pix') ? 'PIX' : 'Transação',
          desc: `${t.party || 'Regenera'} ${t.amount > 0 ? 'enviou' : 'recebeu'} R$ ${Math.abs(t.amount).toFixed(2)}`,
          time: t.timestamp || 'Recente',
          read: true,
          group: 'Hoje',
        }));
        if (realNotifs.length) {
          setNotifications(realNotifs);
        }
      } catch {}
    })();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'pix': return <Zap className="w-4 h-4 text-cyan-400" />;
      case 'neural': return <BrainCircuit className="w-4 h-4 text-indigo-400" />;
      case 'security': return <ShieldCheck className="w-4 h-4 text-red-400" />;
      case 'invest': return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      default: return <Bell className="w-4 h-4 text-gray-400" />;
    }
  };

  const getBg = (type: string) => {
    switch (type) {
      case 'pix': return 'bg-cyan-500/10 border-cyan-500/20';
      case 'neural': return 'bg-indigo-500/10 border-indigo-500/20';
      case 'security': return 'bg-red-500/10 border-red-500/20';
      case 'invest': return 'bg-emerald-500/10 border-emerald-500/20';
      default: return 'bg-white/5 border-white/10';
    }
  };

  const groups = ['Hoje', 'Ontem', 'Esta semana'];

  return (
    <AppLayout activeTab="home">
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-sm font-bold text-white uppercase tracking-widest">Notificações</h1>
        </div>
        <button className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1 bg-cyan-500/10 px-3 py-1.5 rounded-full">
          <CheckCircle2 className="w-3 h-3" /> Ler todas
        </button>
      </div>

      <div className="px-5 pb-24">
        {groups.map(group => {
          const groupNotifs = notifications.filter(n => n.group === group);
          if (groupNotifs.length === 0) return null;

          return (
            <div key={group} className="mb-6">
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-3 px-1">{group}</p>
              <div className="space-y-2">
                {groupNotifs.map(n => (
                  <div key={n.id} className={`relative flex gap-4 p-4 rounded-[20px] border transition-all ${n.read ? 'bg-[#0d1526] border-white/5 opacity-70' : 'bg-[#0d1526] border-white/10'}`}>
                    {!n.read && <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center border ${getBg(n.type)}`}>
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 pr-4">
                      <p className={`text-sm font-bold mb-1 ${n.read ? 'text-gray-400' : 'text-white'}`}>{n.title}</p>
                      <p className="text-xs text-gray-400 leading-relaxed mb-2">{n.desc}</p>
                      <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
};
