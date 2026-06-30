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
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../lib/store';
import { HeaderNavigation } from './HeaderNavigation';
import { api } from '../../core/api/client';
import { FileText, CreditCard, Home, Zap, ArrowUpRight, TrendingUp, ShoppingBag, Shield, User, LogOut, ChevronRight, Bitcoin, Rocket, Plane, Baby, Dog, X, Leaf, GraduationCap, Briefcase, PiggyBank, Scale, Umbrella, Server, Heart, Gift, Tag, Calendar, Headphones } from 'lucide-react';
import { RaphaelaOrb } from './RaphaelaOrb';

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab?: 'extrato' | 'home' | 'cartoes';
  title?: string;
  showHeader?: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, activeTab, title, showHeader }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setAuthenticated, sidebarOpen, setSidebarOpen } = useStore();

  // Bottom nav central orb: real mic permission + LISTENING state per spec (Aura IA)
  const [isListening, setIsListening] = React.useState(false);
  const [mediaStream, setMediaStream] = React.useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = React.useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = React.useState<Blob[]>([]);
  const [isThinking, setIsThinking] = React.useState(false);
  const [isSpeaking, setIsSpeaking] = React.useState(false);
  const [orbTheme, setOrbTheme] = React.useState<'cyan' | 'purple' | 'emerald' | 'amber' | 'crimson'>('cyan');

  const handleThemeCycle = () => {
    const themes: ('cyan' | 'purple' | 'emerald' | 'amber' | 'crimson')[] = ['cyan', 'purple', 'emerald', 'amber', 'crimson'];
    const currentIndex = themes.indexOf(orbTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setOrbTheme(themes[nextIndex] || 'cyan');
  };

  const toggleListening = async () => {
    if (isListening) {
      // Stop recording and POST real audio to motor
      if (mediaRecorder) {
        mediaRecorder.stop();
      }
      if (mediaStream) {
        mediaStream.getTracks().forEach(t => t.stop());
      }
      setMediaStream(null);
      setMediaRecorder(null);
      setIsListening(false);

      // If chunks, POST real to /neural/voice (backend processes Speech-to-Text + Gemini)
      if (audioChunks.length > 0) {
        const blob = new Blob(audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          try {
            setIsThinking(true);
            const res = await api.url('/neural/voice').post({ audioBase64: base64, timestamp: new Date().toISOString() }).json<any>();
            setIsThinking(false);
            // play TTS if returned, or show text
            if (res.audioBase64) {
              setIsSpeaking(true);
              const audio = new Audio(`data:audio/mp3;base64,${res.audioBase64}`);
              audio.onended = () => setIsSpeaking(false);
              audio.play();
            }
            alert(res.text || 'Comando processado no motor Neural (real POST).');
          } catch (e) {
            setIsThinking(false);
            alert('Áudio enviado (demo). Adicione /neural/voice no backend para full motor.');
          }
        };
        reader.readAsDataURL(blob);
        setAudioChunks([]);
      }
      return;
    }

    try {
      // REAL getUserMedia
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(stream);
      setIsListening(true);

      // Start real recording
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      const chunks: Blob[] = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => setAudioChunks(chunks);
      recorder.start();

      // Auto stop after 8s (or user toggle)
      setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop();
        if (stream) stream.getTracks().forEach(t => t.stop());
        setMediaStream(null);
        setIsListening(false);
        setMediaRecorder(null);
      }, 8000);
    } catch (e) {
      alert('Permissão de microfone negada. Ative para ativar o modo LISTENING da Aura IA.');
      setIsListening(false);
    }
  };

  const menuSections = [
    { title: '1. ESSENCIAL', items: [
      { label: 'Visão Geral', icon: Home, path: '/home' },
      { label: 'Extrato & Fluxo', icon: FileText, path: '/pix' },
      { label: 'Área Pix', icon: Zap, path: '/pix' },
      { label: 'Transferências', icon: ArrowUpRight, path: '/transfer' },
      { label: 'Meus Cartões', icon: CreditCard, path: '/cards' },
    ]},
    { title: '2. GESTÃO REGENERA', items: [
      { label: 'Investimentos AI', icon: TrendingUp, path: '/investments' },
      { label: 'Criptoativos', icon: Bitcoin, path: '/investments' },
      { label: 'Reserva de Valor', icon: PiggyBank, path: '/fixed-income' },
      { label: 'Crédito & Alavancagem', icon: Scale, path: '/security' },
      { label: 'Proteção Patrimonial', icon: Umbrella, path: '/security' },
    ]},
    { title: '3. INFRAESTRUTURA', items: [
      { label: 'Regenera Cloud (GCP)', icon: Server, path: '/cloud' },
    ]},
    { title: '4. GERAÇÕES REGENERA', items: [
      { label: 'Conta Kids', icon: Baby, path: '/generations/kids' },
      { label: 'Conta Sênior', icon: Heart, path: '/generations/senior' },
      { label: 'Conta Pet', icon: Dog, path: '/generations/pet' },
    ]},
    { title: '5. FACILIDADES REGENERA', items: [
      { label: 'Sonhos & Metas', icon: Rocket, path: '/dream-vault' },
      { label: 'Marketplace', icon: ShoppingBag, path: '/marketplace' },
      { label: 'Rewards', icon: Gift, path: '/marketplace?tab=rewards' },
      { label: 'Descontos', icon: Tag, path: '/marketplace?tab=discounts' },
      { label: 'Eventos', icon: Calendar, path: '/vip-lounges' },
      { label: 'Concierge Viagem', icon: Plane, path: '/vip-lounges' },
    ]},
    { title: '6. REGENERA VIDA', items: [
      { label: 'Sustentabilidade', icon: Leaf, path: '/sustainability' },
      { label: 'Educação', icon: GraduationCap, path: '/education' },
      { label: 'Empregos', icon: Briefcase, path: '/careers' },
    ]},
    { title: '7. SISTEMA', items: [
      { label: 'Perfil', icon: User, path: '/profile' },
      { label: 'Suporte', icon: Headphones, path: '/profile' },
      { label: 'Sair', icon: LogOut, path: '/login' },
    ]},
  ];

  const initials = user?.name ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('') : 'DP';

  return (
    <div className="min-h-screen bg-[#080d1a] text-white font-sans max-w-md mx-auto relative grid-bg" style={{ backgroundImage: 'linear-gradient(rgba(59,130,246,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.1) 1px, transparent 1px)', backgroundSize: '50px 50px' }}>
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex justify-start" style={{ maxWidth: '448px', left: '50%', transform: 'translateX(-50%)' }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-80 bg-[#0a0e1a] border-r border-white/10 flex flex-col h-full z-10">
            {/* fixed header */}
            <div className="flex-shrink-0">
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <div className="flex items-center gap-3">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="Avatar" className="w-11 h-11 rounded-full object-cover border-2 border-cyan-400/50" />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-black text-sm border-2 border-cyan-400/50">{initials}</div>
                  )}
                  <div>
                    <p className="font-bold text-sm">{user?.name || 'Raphaela Cerveski'}</p>
                    <span className="text-[9px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-full px-2 py-0.5 font-bold uppercase">ENTERPRISE</span>
                  </div>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-full bg-white/5">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-5 py-2 border-b border-white/5 bg-[#111530]">
                <span className="text-[10px] font-black tracking-tight text-cyan-400">REGENERA</span><span className="text-white text-[10px] font-black tracking-tight"> PRO ENTERPRISE</span>
              </div>
            </div>

            {/* scrollable menu sections */}
            <div className="flex-1 overflow-y-auto pb-4">
              {menuSections.map((section) => (
                <div key={section.title}>
                  <p className="text-[9px] text-gray-600 uppercase tracking-widest font-bold px-5 pt-5 pb-2">{section.title}</p>
                  <div className="grid grid-cols-1">
                    {section.items.map((item) => {
                      const isSair = item.label === 'Sair';
                      if (isSair) return null;
                      const isActive = (location.pathname + location.search) === item.path;
                      return (
                        <button
                          key={item.label}
                          onClick={() => {
                            navigate(item.path);
                            setSidebarOpen(false);
                          }}
                          className={`w-full grid grid-cols-[24px,1fr,16px] items-center gap-3 px-5 py-3.5 text-left hover:bg-white/5 active:bg-white/10 transition-colors ${isActive ? 'text-cyan-400 bg-cyan-500/5' : 'text-gray-300'}`}
                        >
                          <item.icon className="w-4 h-4 text-current" />
                          <span className="text-sm font-medium truncate">{item.label}</span>
                          <ChevronRight className="w-3 h-3 opacity-30 justify-self-end" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* fixed footer */}
            <div className="flex-shrink-0 mt-auto border-t border-white/10 bg-[#0a0e1a] p-5 pb-8 space-y-4">
              <div>
                <div className="text-[9px] text-gray-600 uppercase tracking-widest font-bold pb-1">Premium / Ultra</div>
                <div className="opacity-30 pointer-events-none text-sm text-gray-400 py-1 flex items-center gap-1"><Shield className="w-3 h-3" /> [Funcionalidade Premium]</div>
                <div className="opacity-30 pointer-events-none text-sm text-gray-400 py-1 flex items-center gap-1"><Shield className="w-3 h-3" /> [Ultra Tier Only]</div>
              </div>

              <button
                onClick={() => {
                  setAuthenticated(false);
                  navigate('/login');
                  setSidebarOpen(false);
                }}
                className="w-full grid grid-cols-[24px,1fr,16px] items-center gap-3 py-2 px-1 text-left text-red-400 hover:bg-white/5 rounded transition-colors"
              >
                <LogOut className="w-4 h-4 text-red-400" />
                <span className="text-sm font-medium truncate">Sair do Sistema</span>
                <ChevronRight className="w-3 h-3 opacity-30 justify-self-end text-red-400" />
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Consistent Global Header with real Back button (fixes "labirinto sem saída" and Nielsen Control & Freedom) */}
      {showHeader !== false && (
        <HeaderNavigation title={title} />
      )}

      <div className="pb-24 min-h-screen">{children}</div>
      {/* Sound wave keyframes for LISTENING orb visualizer (spec exact) */}
      <style>{`
        @keyframes sound { 0%,100%{height:4px} 50%{height:14px} }
        .animate-\\[sound_0\\.6s_ease-in-out_infinite\\] { animation: sound 0.6s ease-in-out infinite; }
        .animate-\\[sound_0\\.7s_ease-in-out_infinite_0\\.1s\\] { animation: sound 0.7s ease-in-out infinite 0.1s; }
        .animate-\\[sound_0\\.5s_ease-in-out_infinite_0\\.2s\\] { animation: sound 0.5s ease-in-out infinite 0.2s; }
        .animate-\\[sound_0\\.65s_ease-in-out_infinite\\] { animation: sound 0.65s ease-in-out infinite; }
      `}</style>
      {/* Bottom Navigation - EXACT spec: 5 positions (INÍCIO / EXTRATO / central Aura IA orb / CARTÕES / PERFIL).
         Orb supports real mic LISTENING (getUserMedia permission + visualizer waves in cian) per detailed spec.
         Active icon = cyan #00f0ff + glow. */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40">
        <div className="bg-[#0a0e1a]/95 backdrop-blur-xl border-t border-white/10 px-5 pt-2 pb-5 relative h-[62px]">
          <div className="flex items-center justify-between h-full px-1">
            <button
              onClick={() => navigate('/home')}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 ${location.pathname === '/home' ? 'text-cyan-400' : 'text-gray-500'} active:opacity-80 transition-colors`}
            >
              <Home className="w-5 h-5" />
              <span className="text-[8px] font-black uppercase tracking-[1px]">INÍCIO</span>
            </button>

            <button
              onClick={() => navigate('/pix')}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 ${(location.pathname === '/pix' || location.pathname.startsWith('/pix')) ? 'text-cyan-400' : 'text-gray-500'} active:opacity-80 transition-colors`}
            >
              <FileText className="w-5 h-5" />
              <span className="text-[8px] font-black uppercase tracking-[1px]">EXTRATO</span>
            </button>

            {/* Spacer for center Orb */}
            <div className="flex-1" />

            <button
              onClick={() => navigate('/cards')}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 ${activeTab === 'cartoes' ? 'text-cyan-400' : 'text-gray-500'} active:opacity-80 transition-colors`}
            >
              <CreditCard className="w-5 h-5" />
              <span className="text-[8px] font-black uppercase tracking-[1px]">CARTÕES</span>
            </button>

            <button
              onClick={() => navigate('/profile')}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 ${location.pathname === '/profile' ? 'text-cyan-400' : 'text-gray-500'} active:opacity-80 transition-colors`}
            >
              <User className="w-5 h-5" />
              <span className="text-[8px] font-black uppercase tracking-[1px]">PERFIL</span>
            </button>
          </div>

          {/* Centered Orb - Aura IA per spec: "R" + orbits. Click = toggle real mic LISTENING (waves + glow cian). */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-6 z-50">
            <RaphaelaOrb
              isListening={isListening}
              isThinking={isThinking}
              isSpeaking={isSpeaking}
              onClick={toggleListening}
              theme={orbTheme}
              onThemeCycle={handleThemeCycle}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
