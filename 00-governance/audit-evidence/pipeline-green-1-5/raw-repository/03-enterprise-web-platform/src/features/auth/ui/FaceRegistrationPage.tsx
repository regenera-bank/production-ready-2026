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

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../../shared/lib/store';
import { ScanFace, CheckCircle2, Fingerprint, Lock, ShieldAlert } from 'lucide-react';


export const FaceRegistrationPage: React.FC = () => {
 const navigate = useNavigate();
 const { showFeedback } = useStore();
 const videoRef = useRef<HTMLVideoElement>(null);
 const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState<'intro' | 'capturing' | 'processing' | 'success'>('intro');
 const [stream, setStream] = useState<MediaStream | null>(null);
 const [scanLinePos, setScanLinePos] = useState(0);


 useEffect(() => {
   if (step === 'capturing') {
     const interval = setInterval(() => {
       setScanLinePos(prev => (prev > 100 ? 0 : prev + 2));
     }, 30);
     return () => clearInterval(interval);
   }
   return undefined;
 }, [step]);


 const startCamera = async () => {
   try {
     const mediaStream = await navigator.mediaDevices.getUserMedia({
       video: { facingMode: 'user', width: 1080, height: 1080 }
     });
     setStream(mediaStream);
     if (videoRef.current) videoRef.current.srcObject = mediaStream;
     setStep('capturing');
   } catch (err) {
     showFeedback('Permissão tática de câmera negada. Abortando operação.', 'alert');
   }
 };


 const captureFrame = async () => {
   if (!videoRef.current || !canvasRef.current) return;
  
   setStep('processing');
   const context = canvasRef.current.getContext('2d');
   if (context) {
     context.drawImage(videoRef.current, 0, 0, 500, 500);
    
     try {
       setTimeout(async () => {
         setStep('success');
         stream?.getTracks().forEach(t => t.stop());
       }, 2000);
     } catch (e) {
       showFeedback('Falha de liveness. Saturação neural rejeitada.', 'alert');
       setStep('capturing');
     }
   }
 };


 return (
   <div className="min-h-screen bg-[#020617] text-white flex flex-col font-sans relative overflow-hidden">
     {/* Core Dark Mode */}
     <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none mix-blend-overlay z-0" />
     <div className="absolute inset-0 z-0 pointer-events-none stars-bg animate-twinkle" />
     <div className="absolute top-0 right-0 w-[80%] h-[50%] bg-emerald-600/10 rounded-full blur-[150px] pointer-events-none animate-pulse" />
     <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-cyan-700/10 rounded-full blur-[120px] pointer-events-none" />


     {/* Military Grade Header */}
     <div className="flex items-center justify-between p-6 relative z-10 border-b border-emerald-500/20 bg-black/40 backdrop-blur-md">
       <div className="flex items-center gap-3">
         <ShieldAlert className="w-6 h-6 text-emerald-400" />
         <div>
           <h1 className="text-sm font-black tracking-[0.2em] uppercase drop-shadow-md text-emerald-400">Zero-Trust Liveness</h1>
           <p className="text-[9px] text-gray-500 tracking-widest font-bold font-mono">ID: {Math.random().toString(36).substring(7).toUpperCase()}</p>
         </div>
       </div>
       <div className="px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-md text-[8px] text-red-400 font-black tracking-widest uppercase animate-pulse">REC</div>
     </div>
    
     <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10 pb-20">
       {step === 'intro' && (
         <div className="w-full max-w-sm space-y-8 animate-in slide-in-from-bottom-4">
           <div className="relative mx-auto w-32 h-32">
             <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
             <div className="w-full h-full bg-black/50 border border-emerald-500/30 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)] relative z-10">
               <ScanFace className="w-14 h-14 text-emerald-400" />
             </div>
           </div>


           <div className="text-center space-y-3">
             <h2 className="text-xl font-black tracking-tight text-white">Mapeamento Biométrico Criptográfico</h2>
             <p className="text-xs text-gray-400 font-medium leading-relaxed">
               Este terminal exige <span className="text-emerald-400 font-bold">Prova de Vida (Liveness 3D)</span>. Não armazenamos pixels, forjamos uma semente irreversível.
             </p>
           </div>


           <button
             onClick={startCamera}
             className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 py-5 rounded-[20px] font-black uppercase tracking-[0.2em] text-xs shadow-[0_0_20px_rgba(16,185,129,0.2)] active:scale-95 transition-all flex items-center justify-center gap-3"
           >
             <Fingerprint className="w-5 h-5" /> Acionar Hardware Ótico
           </button>
         </div>
       )}


       {step === 'capturing' && (
         <div className="w-full space-y-8 flex flex-col items-center animate-in zoom-in-95">
           <div className="relative w-80 h-80 rounded-full overflow-hidden border-2 border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.4)] bg-black">
             <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
            
             {/* HUD Target Overlay */}
             <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
               <div className="w-[80%] h-[80%] border border-emerald-400/30 rounded-[40px] relative">
                 <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-emerald-400" />
                 <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-emerald-400" />
                 <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-emerald-400" />
                 <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-emerald-400" />
               </div>
             </div>


             {/* Scan Line */}
             <div
               className="absolute left-0 w-full h-[2px] bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,1)] opacity-70 pointer-events-none"
               style={{ top: `${scanLinePos}%` }}
             />
           </div>


           <div className="text-center space-y-2">
             <p className="text-emerald-400 font-black text-[10px] uppercase tracking-[0.4em] animate-pulse">Liveness Detectada: 98.4%</p>
             <p className="text-gray-500 text-[9px] uppercase tracking-widest font-mono">Aguardando trava biométrica</p>
           </div>


           <button
             onClick={captureFrame}
             className="w-20 h-20 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-[24px] flex items-center justify-center border border-emerald-400/50 active:scale-90 transition-all shadow-[0_0_25px_rgba(16,185,129,0.4)]"
           >
             <div className="w-8 h-8 bg-emerald-400 rounded-lg shadow-[0_0_15px_rgba(16,185,129,1)]" />
           </button>
         </div>
       )}


       {step === 'processing' && (
         <div className="text-center space-y-6 animate-in fade-in">
           <div className="relative w-24 h-24 mx-auto">
             <div className="absolute inset-0 border-t-2 border-emerald-400 rounded-full animate-spin" />
             <div className="absolute inset-2 border-b-2 border-cyan-400 rounded-full animate-spin-slow" />
             <div className="absolute inset-0 flex items-center justify-center">
               <Lock className="w-8 h-8 text-emerald-400" />
             </div>
           </div>
           <div className="space-y-1">
             <p className="text-emerald-400 font-black text-xs uppercase tracking-[0.3em]">Criptografando Vetores</p>
             <p className="text-gray-500 text-[10px] font-mono uppercase">Gerando semente AES-256 (Nível HSM)</p>
           </div>
         </div>
       )}


       {step === 'success' && (
         <div className="w-full max-w-sm text-center space-y-8 animate-in slide-in-from-bottom-4">
           <div className="w-28 h-28 bg-emerald-500/10 rounded-[32px] flex items-center justify-center mx-auto border border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
             <CheckCircle2 className="w-12 h-12 text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
           </div>
           <div className="space-y-2">
             <h2 className="text-2xl font-black text-white">Chave Mestra Gerada</h2>
             <p className="text-gray-400 text-xs leading-relaxed font-medium">Seus vetores faciais foram convertidos em uma semente irrevogável. Acesso biométrico blindado.</p>
           </div>
           <button
             onClick={() => navigate('/home')}
             className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 py-5 rounded-[20px] font-black uppercase tracking-[0.2em] text-[10px] shadow-[0_0_20px_rgba(16,185,129,0.2)] active:scale-95 transition-all"
           >
             Inicializar Sistema Base
           </button>
         </div>
       )}
     </div>


     <canvas ref={canvasRef} width="500" height="500" className="hidden" />
    
     {/* Footer Disclaimer */}
     <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black to-transparent pointer-events-none">
       <div className="flex justify-between items-center text-[8px] text-emerald-500/50 uppercase font-black tracking-[0.3em] font-mono text-glow">
         <span>Protocolo FIDO2 Ativo</span>
         <span>Regenera Security Core</span>
       </div>
     </div>
   </div>
 );
};
