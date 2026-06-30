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

import React from 'react';
import { Globe, Leaf, Wind, Sun, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../../../shared/ui/AppLayout';


export const SustentabilidadePage: React.FC = () => {
 const navigate = useNavigate();


 return (
   <AppLayout title="Sustentabilidade">
     <div className="relative min-h-[calc(100vh-80px)] pb-32 overflow-hidden bg-[#020617]">
       {/* Deep Atmosphere Engine */}
       <div className="absolute inset-0 bg-noise opacity-[0.04] pointer-events-none mix-blend-overlay" />
       <div className="absolute inset-0 z-0 pointer-events-none stars-bg animate-twinkle opacity-50" />
      
       {/* Core Emerald Glows */}
       <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-emerald-600/15 rounded-full blur-[150px] pointer-events-none animate-pulse duration-1000" />
       <div className="absolute bottom-[10%] left-[-20%] w-[70%] h-[70%] bg-teal-800/10 rounded-full blur-[120px] pointer-events-none" />


       <div className="relative z-10 px-6 pt-6 animate-slide-up">
         {/* Header */}
         <div className="flex items-center gap-4 mb-8">
           <button
             onClick={() => navigate(-1)}
             className="w-12 h-12 rounded-[20px] glass-panel-hover flex items-center justify-center active:scale-95 transition-all"
           >
             <ArrowLeft className="w-5 h-5 text-emerald-400" />
           </button>
           <div className="flex-1">
             <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-md">Impacto Sustentável</h1>
             <p className="text-[10px] text-emerald-400 uppercase tracking-[0.4em] font-black text-glow">Eco Ledger · Zero Carbon</p>
           </div>
           <div className="w-12 h-12 rounded-[20px] glass-panel border border-emerald-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
             <Globe className="w-5 h-5 text-emerald-400" />
           </div>
         </div>


         <div className="glass-panel p-6 rounded-[24px] mb-8 relative overflow-hidden group">
           <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
           <ShieldCheck className="w-6 h-6 text-emerald-400/50 absolute top-6 right-6" />
           <h2 className="text-sm font-black text-white tracking-wide mb-2">Compromisso Planetário</h2>
           <p className="text-xs text-gray-400 leading-relaxed font-medium">
             Não basta neutralizar; nós regeneramos. Cada transação executada no Core Banking financia automaticamente a captura de carbono e o desenvolvimento de energias limpas.
           </p>
         </div>


         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
           <div className="glass-panel glass-panel-hover p-6 rounded-[32px] flex flex-col items-center justify-center text-center relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[40px] rounded-full pointer-events-none" />
             <Leaf className="w-8 h-8 text-emerald-400 mb-3 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
             <div className="text-3xl font-black text-white drop-shadow-md">450 <span className="text-sm text-gray-400">kg</span></div>
             <div className="text-[10px] text-emerald-400/80 uppercase tracking-widest font-black mt-2 text-glow">Carbono Extraído</div>
           </div>
          
           <div className="glass-panel glass-panel-hover p-6 rounded-[32px] flex flex-col items-center justify-center text-center relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[40px] rounded-full pointer-events-none" />
             <Wind className="w-8 h-8 text-cyan-400 mb-3 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
             <div className="text-3xl font-black text-white drop-shadow-md">1.2 <span className="text-sm text-gray-400">MWh</span></div>
             <div className="text-[10px] text-cyan-400/80 uppercase tracking-widest font-black mt-2 text-glow">Energia Limpa</div>
           </div>
          
           <div className="glass-panel glass-panel-hover p-6 rounded-[32px] flex flex-col items-center justify-center text-center relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[40px] rounded-full pointer-events-none" />
             <Sun className="w-8 h-8 text-amber-400 mb-3 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
             <div className="text-3xl font-black text-white drop-shadow-md">12</div>
             <div className="text-[10px] text-emerald-400/80 uppercase tracking-widest font-black mt-2 text-glow">Árvores Criptografadas</div>
           </div>
         </div>


         <h2 className="text-[10px] font-black tracking-[0.3em] text-emerald-400/80 uppercase mb-4 pl-2 text-glow">Matriz de Projetos</h2>
        
         <div className="glass-panel p-6 rounded-[32px] relative overflow-hidden group shadow-2xl">
           <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
           <div className="flex gap-5 items-start relative z-10">
             <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-[0_0_25px_rgba(16,185,129,0.4)] flex-shrink-0">
               <Globe className="w-8 h-8" />
             </div>
             <div className="flex-1">
               <h3 className="text-xl font-black text-white mb-1 drop-shadow-md">Fundo Amazônia Viva</h3>
               <p className="text-xs text-gray-400 mb-4 font-medium leading-relaxed">Seus investimentos recentes e o uso do cartão renderam <span className="text-emerald-400 font-bold">R$ 45,00</span> em injeções automáticas para reflorestamento e proteção de mananciais.</p>
              
               {/* Cyber Progress Bar */}
               <div className="relative h-3 bg-black/40 rounded-full overflow-hidden mb-2 border border-white/5 p-0.5 z-10">
                 <div
                   className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full relative transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(16,185,129,0.8)]"
                   style={{ width: '70%' }}
                 >
                   <div className="absolute top-0 right-0 h-full w-2 bg-white/50 blur-[2px] animate-pulse" />
                 </div>
               </div>
               <p className="text-[9px] text-right text-emerald-400 font-black tracking-widest uppercase">70% da Meta Atingida</p>
             </div>
           </div>
         </div>
       </div>
     </div>
   </AppLayout>
 );
};
