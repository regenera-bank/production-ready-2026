import React from 'react';
import { Briefcase, Building, Search, ArrowLeft, Terminal, Cpu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/design-system/AppLayout';


export const EmpregosPage: React.FC = () => {
 const navigate = useNavigate();


 return (
   <AppLayout title="Carreiras">
     <div className="relative min-h-[calc(100vh-80px)] pb-32 overflow-hidden bg-[#020617]">
       {/* Deep Atmosphere Engine */}
       <div className="absolute inset-0 bg-noise opacity-[0.04] pointer-events-none mix-blend-overlay" />
       <div className="absolute inset-0 z-0 pointer-events-none stars-bg animate-twinkle opacity-60" />
      
       {/* Core Blue/Cyan Glows */}
       <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-blue-600/15 rounded-full blur-[150px] pointer-events-none animate-pulse duration-1000" />
       <div className="absolute bottom-[20%] left-[-20%] w-[50%] h-[50%] bg-cyan-700/10 rounded-full blur-[120px] pointer-events-none" />


       <div className="relative z-10 px-6 pt-6 animate-slide-up">
         {/* Header */}
         <div className="flex items-center gap-4 mb-8">
           <button
             onClick={() => navigate(-1)}
             className="w-12 h-12 rounded-[20px] glass-panel-hover flex items-center justify-center active:scale-95 transition-all"
           >
             <ArrowLeft className="w-5 h-5 text-blue-400" />
           </button>
           <div className="flex-1">
             <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-md">Nexus de Carreiras</h1>
             <p className="text-[10px] text-blue-400 uppercase tracking-[0.4em] font-black text-glow">Talent Grid · Tier 1</p>
           </div>
           <div className="w-12 h-12 rounded-[20px] glass-panel border border-blue-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.2)]">
             <Briefcase className="w-5 h-5 text-blue-400" />
           </div>
         </div>


         <div className="glass-panel p-6 rounded-[24px] mb-8 relative overflow-hidden group border border-blue-500/20">
           <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
           <Terminal className="w-6 h-6 text-blue-400/50 absolute top-6 right-6" />
           <h2 className="text-sm font-black text-white tracking-wide mb-2">Ecossistema de Alta Performance</h2>
           <p className="text-xs text-gray-400 leading-relaxed font-medium max-w-[90%]">
             Não oferecemos empregos, nós oferecemos acesso à rede de infraestrutura financeira do futuro. Posições de impacto global e stock options criptografadas para os melhores 1%.
           </p>
         </div>


         {/* Cyber Search Bar */}
         <div className="glass-panel p-2 rounded-[24px] flex items-center mb-8 border border-white/10 focus-within:border-blue-500/50 transition-colors shadow-2xl">
           <div className="pl-4 pr-3 text-blue-400/50">
             <Search className="w-5 h-5" />
           </div>
           <input
             type="text"
             placeholder="Injetar query: cargo, protocolo ou squad..."
             className="bg-transparent border-none text-white outline-none flex-1 text-sm placeholder:text-gray-600 font-medium tracking-wide"
           />
           <button className="bg-blue-600/20 border border-blue-500/40 hover:bg-blue-500/30 text-blue-400 px-6 py-3 rounded-[18px] text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
             Buscar
           </button>
         </div>


         <h2 className="text-[10px] font-black tracking-[0.3em] text-blue-400/80 uppercase mb-4 pl-2 text-glow">Acessos Prioritários</h2>
        
         <div className="space-y-4">
           <div className="glass-panel glass-panel-hover p-6 rounded-[32px] cursor-pointer group transition-all relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[40px] rounded-full pointer-events-none group-hover:bg-purple-500/20 transition-colors" />
             <div className="flex justify-between items-start mb-6 relative z-10">
               <div className="flex gap-5 items-center">
                 <div className="w-14 h-14 rounded-[20px] bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)] flex-shrink-0 group-hover:scale-110 transition-transform">
                   <Cpu className="w-6 h-6" />
                 </div>
                 <div>
                   <h3 className="text-xl font-black text-white group-hover:text-cyan-400 transition-colors drop-shadow-md mb-1">Engenheiro(a) de Core Sistêmico</h3>
                   <p className="text-xs text-gray-400 font-medium">Regenera Neural Core • São Paulo, SP (Remoto Global)</p>
                 </div>
               </div>
               <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-[0_0_10px_rgba(16,185,129,0.2)]">Alpha</div>
             </div>
             <div className="flex flex-wrap gap-2 relative z-10">
               <span className="text-[10px] font-bold tracking-wider uppercase bg-black/40 border border-white/10 px-4 py-2 rounded-[12px] text-gray-300">Rust</span>
               <span className="text-[10px] font-bold tracking-wider uppercase bg-black/40 border border-white/10 px-4 py-2 rounded-[12px] text-gray-300">Web3</span>
               <span className="text-[10px] font-bold tracking-wider uppercase bg-black/40 border border-white/10 px-4 py-2 rounded-[12px] text-gray-300">Machine Learning</span>
             </div>
           </div>


           <div className="glass-panel glass-panel-hover p-6 rounded-[32px] cursor-pointer group transition-all relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[40px] rounded-full pointer-events-none group-hover:bg-blue-500/20 transition-colors" />
             <div className="flex justify-between items-start mb-6 relative z-10">
               <div className="flex gap-5 items-center">
                 <div className="w-14 h-14 rounded-[20px] bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)] flex-shrink-0 group-hover:scale-110 transition-transform">
                   <Building className="w-6 h-6" />
                 </div>
                 <div>
                   <h3 className="text-xl font-black text-white group-hover:text-cyan-400 transition-colors drop-shadow-md mb-1">Arquiteto(a) de Protocolos DeFi</h3>
                   <p className="text-xs text-gray-400 font-medium">Regenera Crypto Labs • Singapura (Remoto Global)</p>
                 </div>
               </div>
             </div>
             <div className="flex flex-wrap gap-2 relative z-10">
               <span className="text-[10px] font-bold tracking-wider uppercase bg-black/40 border border-white/10 px-4 py-2 rounded-[12px] text-gray-300">Solidity</span>
               <span className="text-[10px] font-bold tracking-wider uppercase bg-black/40 border border-white/10 px-4 py-2 rounded-[12px] text-gray-300">Smart Contracts</span>
               <span className="text-[10px] font-bold tracking-wider uppercase bg-black/40 border border-white/10 px-4 py-2 rounded-[12px] text-gray-300">Auditoria</span>
             </div>
           </div>
         </div>


         <div className="mt-12 text-[10px] text-center text-gray-600 font-bold uppercase tracking-[0.2em]">
           Protocolo de Recrutamento Neural Ativado.
         </div>
       </div>
     </div>
   </AppLayout>
 );
};
