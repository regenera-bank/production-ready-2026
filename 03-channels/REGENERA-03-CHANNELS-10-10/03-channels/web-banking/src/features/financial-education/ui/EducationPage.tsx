import React from 'react';
import { BookOpen, GraduationCap, PlayCircle, Award, ArrowLeft, BrainCircuit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/design-system/AppLayout';


export const EducationPage: React.FC = () => {
  const navigate = useNavigate();


  return (
    <AppLayout title="Academia">
      <div className="relative min-h-[calc(100vh-80px)] pb-32 overflow-hidden bg-[#020617]">
        {/* Deep Atmosphere Engine */}
        <div className="absolute inset-0 bg-noise opacity-[0.04] pointer-events-none mix-blend-overlay" />
        <div className="absolute inset-0 z-0 pointer-events-none stars-bg animate-twinkle opacity-50" />
        
        {/* Core Indigo Glows */}
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/15 rounded-full blur-[150px] pointer-events-none animate-pulse duration-1000" />
        <div className="absolute bottom-[20%] left-[-20%] w-[60%] h-[60%] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />


        <div className="relative z-10 px-6 pt-6 animate-slide-up">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate(-1)}
              className="w-12 h-12 rounded-[20px] glass-panel-hover flex items-center justify-center active:scale-95 transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-indigo-400" />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-md">Academia Regenera</h1>
              <p className="text-[10px] text-indigo-400 uppercase tracking-[0.4em] font-black text-glow">Elite Knowledge · Neural Access</p>
            </div>
            <div className="w-12 h-12 rounded-[20px] glass-panel border border-indigo-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <GraduationCap className="w-5 h-5 text-indigo-400" />
            </div>
          </div>


          <div className="glass-panel p-6 rounded-[24px] mb-8 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <h2 className="text-sm font-black text-white tracking-wide mb-2">Inteligência Financeira Descentralizada</h2>
            <p className="text-xs text-gray-400 leading-relaxed font-medium">
              Sua evolução técnica e estratégica não é uma opção, é um mandato. Acesse módulos de altíssimo nível, projetados para moldar os líderes do ecossistema Web3.
            </p>
          </div>


          <h2 className="text-[10px] font-black tracking-[0.3em] text-indigo-400/80 uppercase mb-4 pl-2 text-glow">Módulos Táticos</h2>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="glass-panel glass-panel-hover p-6 rounded-[32px] relative overflow-hidden group shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[40px] rounded-full pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="w-14 h-14 rounded-[20px] bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mb-5 text-indigo-400 shadow-inner">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-white mb-2 drop-shadow-md">Finanças Descentralizadas (DeFi)</h3>
              <p className="text-xs text-gray-400 mb-6 font-medium leading-relaxed">Aprenda como operar no ecossistema Web3 com segurança institucional, contratos inteligentes e pools de liquidez.</p>
              <button className="bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-xs font-black uppercase tracking-widest px-5 py-3 rounded-[16px] flex items-center gap-2 group-hover:gap-3 transition-all active:scale-95">
                Iniciar Módulo <PlayCircle className="w-4 h-4" />
              </button>
            </div>


            <div className="glass-panel glass-panel-hover p-6 rounded-[32px] relative overflow-hidden group shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[40px] rounded-full pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="w-14 h-14 rounded-[20px] bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-5 text-emerald-400 shadow-inner">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-white mb-2 drop-shadow-md">Liderança Executiva Alpha</h3>
              <p className="text-xs text-gray-400 mb-6 font-medium leading-relaxed">Desenvolvimento brutal de soft skills, neurociência da decisão e gestão de crise para líderes de altíssimo impacto.</p>
              <button className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-widest px-5 py-3 rounded-[16px] flex items-center gap-2 group-hover:gap-3 transition-all active:scale-95">
                Iniciar Módulo <PlayCircle className="w-4 h-4" />
              </button>
            </div>
          </div>


          <h2 className="text-[10px] font-black tracking-[0.3em] text-cyan-400/80 uppercase mb-4 pl-2 text-glow">Mentoria Avançada</h2>


          <div className="glass-panel-neural p-6 md:p-8 rounded-[32px] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-[0_0_30px_rgba(34,211,238,0.15)] border border-cyan-500/30 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent pointer-events-none" />
            <div className="flex gap-4 items-start relative z-10">
              <div className="w-12 h-12 rounded-[16px] bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 ai-pulse shadow-[0_0_15px_rgba(34,211,238,0.3)] flex-shrink-0">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white mb-1 drop-shadow-md">Conexão Neural Raphaela AI</h3>
                <p className="text-xs text-cyan-400/80 max-w-sm font-medium leading-relaxed">A sua tutora sintética de classe mundial está aguardando para otimizar sua curva de aprendizado em tempo real. 24/7 disponível.</p>
              </div>
            </div>
            <button className="w-full md:w-auto bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-400 px-8 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-all active:scale-95 relative z-10 text-glow">
              Estabelecer Uplink
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
