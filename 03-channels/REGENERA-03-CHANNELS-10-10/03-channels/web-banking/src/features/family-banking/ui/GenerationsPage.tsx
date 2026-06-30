import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/design-system/AppLayout';
import {
  Fingerprint, Lock, ShieldAlert, Cpu, Activity, TrendingUp,
  ArrowLeft, Baby, Dog, User
} from 'lucide-react';

type GenerationType = 'kids' | 'senior' | 'pet';

interface GenerationNode {
  name: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  status: string;
  progress?: number;
  progressLabel?: string;
  colorType: 'purple' | 'emerald' | 'amber';
}

const configMap: Record<GenerationType, {
  title: string;
  subtitle: string;
  color: 'purple' | 'emerald' | 'amber';
  icon: React.ComponentType<any>;
  badge: string;
  desc: string;
}> = {
  kids: {
    title: 'Custódia Kids',
    subtitle: 'Mesada Cripto & DNA Financeiro Infantil',
    color: 'purple',
    icon: Baby,
    badge: 'Mesada Ativa',
    desc: 'Ensine educação financeira na prática. O Regenera cria carteiras monitoradas e executa pagamentos automáticos de mesadas baseados em metas educacionais.',
  },
  senior: {
    title: 'Custódia Sênior',
    subtitle: 'Oráculo de Sucessão & Prova de Vida',
    color: 'emerald',
    icon: User,
    badge: 'Oráculo Ativo',
    desc: 'Segurança e dignidade. O Regenera gerencia a liberação assistida de fundos e executa a partilha patrimonial instantânea em contratos inteligentes com verificação multifatorial.',
  },
  pet: {
    title: 'Custódia Pet',
    subtitle: 'Fundo Multipet & Saúde Descentralizada',
    color: 'amber',
    icon: Dog,
    badge: 'Fundo Pet Ativo',
    desc: 'O futuro do cuidado com quem você ama. Aloque fundos exclusivos para despesas veterinárias, ração premium e cuidados especiais integrados a smart contracts.',
  },
};

const colorStyles = {
  purple: {
    text: 'text-purple-400',
    textGlow: 'text-purple-400/80',
    border: 'border-purple-500/20',
    borderActive: 'border-purple-500/30',
    bgLight: 'bg-purple-500/10',
    bgHover: 'hover:bg-purple-500/10 hover:border-purple-500/50',
    shadow: 'shadow-[0_0_20px_rgba(168,85,247,0.2)]',
    glow: 'bg-purple-600/10',
    gradient: 'from-purple-500/10 to-indigo-500/10',
  },
  emerald: {
    text: 'text-emerald-400',
    textGlow: 'text-emerald-400/80',
    border: 'border-emerald-500/20',
    borderActive: 'border-emerald-500/30',
    bgLight: 'bg-emerald-500/10',
    bgHover: 'hover:bg-emerald-500/10 hover:border-emerald-500/50',
    shadow: 'shadow-[0_0_20px_rgba(16,185,129,0.2)]',
    glow: 'bg-emerald-600/10',
    gradient: 'from-emerald-500/10 to-cyan-500/10',
  },
  amber: {
    text: 'text-amber-400',
    textGlow: 'text-amber-400/80',
    border: 'border-amber-500/20',
    borderActive: 'border-amber-500/30',
    bgLight: 'bg-amber-500/10',
    bgHover: 'hover:bg-amber-500/10 hover:border-amber-500/50',
    shadow: 'shadow-[0_0_20px_rgba(245,158,11,0.2)]',
    glow: 'bg-amber-600/10',
    gradient: 'from-amber-500/10 to-orange-500/10',
  },
};

const nodesMap: Record<GenerationType, GenerationNode[]> = {
  kids: [
    {
      name: 'Herdeiro Alfa (14 anos)',
      subtitle: 'Smart Contract: Liberação aos 18',
      icon: Cpu,
      status: 'Ativo',
      progress: 77,
      progressLabel: 'Progresso do Gatilho Temporal',
      colorType: 'purple',
    },
    {
      name: 'Herdeira Beta (10 anos)',
      subtitle: 'Conta Supervisionada: Metas de Estudo',
      icon: Cpu,
      status: 'Ativo',
      progress: 55,
      progressLabel: 'Metas Acadêmicas Concluídas',
      colorType: 'purple',
    },
  ],
  senior: [
    {
      name: 'Gestão Sênior (Patriarca)',
      subtitle: 'Oráculo Médico Integrado',
      icon: Activity,
      status: 'Ativo',
      progress: 100,
      progressLabel: 'Verificação Biométrica Regular',
      colorType: 'emerald',
    },
    {
      name: 'Matriarca Co-titular',
      subtitle: 'Smart Contract: Sucessão Direta',
      icon: Fingerprint,
      status: 'Standby',
      colorType: 'emerald',
    },
  ],
  pet: [
    {
      name: 'Pet Custodiado (Giga)',
      subtitle: 'Oráculo Veterinário & Microchip',
      icon: Dog,
      status: 'Ativo',
      progress: 100,
      progressLabel: 'Fundo de Saúde Veterinária',
      colorType: 'amber',
    },
    {
      name: 'Clínica Credenciada Tática',
      subtitle: 'Gatilho de Reembolso Automático',
      icon: ShieldAlert,
      status: 'Conectado',
      colorType: 'amber',
    },
  ],
};

export const GenerationsPage: React.FC = () => {
  const { type } = useParams<{ type: GenerationType }>();
  const navigate = useNavigate();

  const currentType: GenerationType = type && configMap[type] ? type : 'kids';
  const currentConfig = configMap[currentType];
  const styles = colorStyles[currentConfig.color];
  const nodes = nodesMap[currentType];

  useEffect(() => {
    // Analytics tracking or logs if needed
  }, [type]);

  const IconComponent = currentConfig.icon;

  return (
    <AppLayout title={currentConfig.title} activeTab="home">
      <div className="relative w-full pb-32 min-h-[calc(100vh-80px)] overflow-hidden bg-[#020617]">
        {/* Core DNA Background */}
        <div className="absolute inset-0 bg-noise opacity-[0.05] pointer-events-none mix-blend-overlay" />
        <div className={`absolute top-[-10%] right-[-10%] w-[60%] h-[60%] ${styles.glow} rounded-full blur-[150px] pointer-events-none animate-pulse duration-[4000ms]`} />
        <div className="absolute bottom-[-10%] left-[-20%] w-[50%] h-[50%] bg-cyan-800/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 px-5 pt-6 animate-slide-up">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate(-1)}
              className="w-12 h-12 rounded-[20px] glass-panel-hover flex items-center justify-center active:scale-95 transition-all"
            >
              <ArrowLeft className={`w-5 h-5 ${styles.text}`} />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-md">{currentConfig.title}</h1>
              <p className={`text-[10px] ${styles.text} uppercase tracking-[0.4em] font-black text-glow`}>Bloodline Protocol · Nível 9</p>
            </div>
            <div className={`w-12 h-12 rounded-[20px] glass-panel border ${styles.borderActive} flex items-center justify-center ${styles.shadow}`}>
              <IconComponent className={`w-5 h-5 ${styles.text}`} />
            </div>
          </div>

          {/* Banner */}
          <div className={`glass-panel p-6 rounded-[32px] mb-8 relative overflow-hidden group shadow-2xl border ${styles.border}`}>
            <div className={`absolute inset-0 bg-gradient-to-r ${styles.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`} />
            <Fingerprint className="w-8 h-8 text-white/10 absolute top-6 right-6" />
            <h2 className="text-sm font-black text-white tracking-wide mb-2">{currentConfig.subtitle}</h2>
            <p className="text-xs text-gray-400 leading-relaxed font-medium max-w-[90%]">
              {currentConfig.desc}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className={`glass-panel p-5 rounded-[24px] bg-black/40 border ${styles.border}`}>
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className={`w-4 h-4 ${styles.text}`} />
                <span className="text-[9px] text-gray-400 uppercase tracking-widest font-black">Patrimônio Alocado</span>
              </div>
              <div className="text-2xl font-light text-white">
                {currentType === 'kids' && <>R$ 4.250<span className="text-sm text-gray-500">,00</span></>}
                {currentType === 'senior' && <>R$ 850.000<span className="text-sm text-gray-500">,00</span></>}
                {currentType === 'pet' && <>R$ 1.500<span className="text-sm text-gray-500">,00</span></>}
              </div>
            </div>
            <div className="glass-panel p-5 rounded-[24px] bg-black/40 border border-cyan-500/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-cyan-500" />
                <span className="text-[9px] text-gray-400 uppercase tracking-widest font-black">Yield Estimado</span>
              </div>
              <div className="text-2xl font-light text-white">
                {currentType === 'kids' && <>+14.2<span className="text-sm text-gray-500">%</span></>}
                {currentType === 'senior' && <>+12.8<span className="text-sm text-gray-500">%</span></>}
                {currentType === 'pet' && <>+9.5<span className="text-sm text-gray-500">%</span></>}
              </div>
            </div>
          </div>

          <h2 className={`text-[10px] font-black tracking-[0.3em] ${styles.textGlow} uppercase pl-2 text-glow mb-4`}>Nodos da Linhagem</h2>

          {/* Nodes list */}
          <div className="space-y-4 mb-8">
            {nodes.map((node, index) => {
              const NodeIcon = node.icon;
              return (
                <div key={index} className="glass-panel glass-panel-hover p-6 rounded-[24px] relative overflow-hidden border border-white/10 group">
                  <div className={`absolute top-0 right-0 w-24 h-24 ${styles.glow} blur-[30px] rounded-full pointer-events-none`} />
                  <div className="flex justify-between items-center relative z-10">
                    <div className="flex gap-4 items-center">
                      <div className={`w-12 h-12 rounded-[16px] ${styles.bgLight} border ${styles.borderActive} flex items-center justify-center ${styles.text} shadow-inner group-hover:scale-110 transition-transform`}>
                        <NodeIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white mb-0.5">{node.name}</h3>
                        <p className="text-[9px] text-gray-400 font-bold tracking-widest uppercase">{node.subtitle}</p>
                      </div>
                    </div>
                    <div className={`text-[9px] ${styles.bgLight} ${styles.text} border ${styles.borderActive} px-3 py-1.5 rounded-[8px] font-black uppercase tracking-widest`}>
                      {node.status}
                    </div>
                  </div>
                  {node.progress !== undefined && (
                    <div className="mt-4 relative z-10">
                      <div className="flex justify-between text-[8px] font-black tracking-widest uppercase text-gray-500 mb-1.5">
                        <span>{node.progressLabel || 'Progresso do Gatilho'}</span>
                        <span className={styles.text}>{node.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
                        <div
                          className={`h-full ${currentConfig.color === 'purple' ? 'bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.8)]' : currentConfig.color === 'emerald' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.8)]'} rounded-full`}
                          style={{ width: `${node.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button className={`w-full bg-black/40 border border-dashed ${styles.borderActive} ${styles.text} py-5 rounded-[24px] font-black uppercase tracking-[0.2em] text-[10px] ${styles.bgHover} transition-all active:scale-95 flex items-center justify-center gap-2`}>
            <Lock className="w-4 h-4" /> Criptografar Novo Nodo
          </button>

          <div className="mt-12 text-[9px] text-center text-gray-600 font-black uppercase tracking-[0.3em] font-mono pb-8 text-glow">
            Protocolo de Herança Blockchain Ativo.
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

