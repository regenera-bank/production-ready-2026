/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useRef } from 'react';
import { 
  ScanFace, Lock, CheckCircle, ShieldAlert, Cpu, 
  Activity, UserCheck, Eye, EyeOff, Fingerprint, 
  Mail, User, ArrowRight, Sparkles, UserPlus 
} from 'lucide-react';

interface LoginScreenProps {
  onAuthenticated: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onAuthenticated }) => {
  // Navigation State between Biometrics and Email tabs
  const [activeTab, setActiveTab] = useState<'biometrics' | 'email'>('biometrics');
  
  // Email Form State
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('don.paulo@regenera.bank');
  const [password, setPassword] = useState('••••••••••••');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Biometrics Scan State
  const [phase, setPhase] = useState<'waiting' | 'scanning' | 'analyzing' | 'authorized' | 'denied'>('waiting');
  const [method, setMethod] = useState<'face' | 'fingerprint'>('face');
  const [scanProgress, setScanProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [apiKeyStatus, setApiKeyStatus] = useState<'system' | 'dynamic' | 'missing'>('missing');

  // Verify Gemini API Key
  useEffect(() => {
    let key = '';
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const queryKey = urlParams.get('key') || urlParams.get('apiKey') || urlParams.get('GEMINI_API_KEY');
      if (queryKey) {
        setApiKeyStatus('dynamic');
        return;
      }
      const localKey = localStorage.getItem('GEMINI_API_KEY_OVERRIDE');
      if (localKey) {
        setApiKeyStatus('dynamic');
        return;
      }
    }
    if (process.env.API_KEY || process.env.GEMINI_API_KEY) {
      setApiKeyStatus('system');
    } else {
      setApiKeyStatus('missing');
    }
  }, []);

  // Biometrics Automation Flow
  const startBiometric = async (selectedMethod: 'face' | 'fingerprint') => {
    setMethod(selectedMethod);
    setPhase('scanning');
    setScanProgress(0);

    if (selectedMethod === 'face') {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: "user" } 
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Camera access denied or unavailable", err);
        }
    }

    let progress = 0;
    const interval = setInterval(() => {
        progress += 2;
        setScanProgress(progress);
        if (progress >= 100) {
            clearInterval(interval);
            setPhase('analyzing');
            setTimeout(() => {
                setPhase('authorized');
                setTimeout(() => {
                    onAuthenticated();
                }, 1000);
            }, 1500);
        }
    }, 35);
  };

  // Email Submit Handler
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    // Form Validations
    if (!email || !email.includes('@')) {
      setFormError('Por favor, insira um e-mail corporativo válido.');
      return;
    }
    if (!password || password.length < 6) {
      setFormError('A senha deve conter no mínimo 6 caracteres de segurança neural.');
      return;
    }
    if (authMode === 'register' && !name.trim()) {
      setFormError('Insira seu nome completo de assinante.');
      return;
    }

    setIsSubmitting(true);

    // Simulate futuristic auth handshake
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setScanProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setIsSubmitting(false);
        if (authMode === 'register') {
          setFormSuccess('Cadastro Neural Gravado! Sincronizando biometria...');
          setTimeout(() => {
            // Automatically switch to biometrics scanning as a premium security step!
            setActiveTab('biometrics');
            startBiometric('face');
          }, 1500);
        } else {
          setFormSuccess('Chaves de segurança autenticadas. Acessando...');
          setTimeout(() => {
            onAuthenticated();
          }, 1200);
        }
      }
    }, 100);
  };

  useEffect(() => {
    return () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
    };
  }, []);

  return (
    <div id="screen-login" className="fixed inset-0 z-50 bg-bg-deep flex flex-col items-center justify-center overflow-y-auto px-4 py-8 font-mono">
        
        {/* API KEY CONNECTION INDICATOR */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 bg-bg-mid/60 backdrop-blur-md border border-white/5 px-4 py-2 rounded-full flex items-center gap-2 shadow-lg animate-in fade-in duration-1000">
            <div className={`w-2 h-2 rounded-full ${apiKeyStatus !== 'missing' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-amber-500 shadow-[0_0_8px_#f59e0b]'} animate-pulse`}></div>
            <span className="text-[9px] uppercase tracking-[0.25em] text-gray-400 font-bold whitespace-nowrap">
                {apiKeyStatus === 'dynamic' && 'CONEXÃO GEMINI: ATIVA (URL/PERSISTENTE)'}
                {apiKeyStatus === 'system' && 'CONEXÃO GEMINI: ATIVA (SISTEMA)'}
                {apiKeyStatus === 'missing' && 'CONEXÃO GEMINI: CHAVE AUSENTE (?key=CHAVE_API no link)'}
            </span>
        </div>
        
        {/* ATMOSPHERE LAYERS */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary-dark/20 via-bg-deep to-bg-deep z-0"></div>
        
        {/* HOLOGRAPHIC VIDEO FEED (Active during webcam scan) */}
        {activeTab === 'biometrics' && method === 'face' && phase !== 'waiting' && (
            <div className="absolute inset-0 z-10 opacity-30 pointer-events-none mix-blend-screen">
                <video 
                    ref={videoRef}
                    autoPlay 
                    playsInline 
                    muted 
                    className={`w-full h-full object-cover transition-all duration-500 ${phase === 'authorized' ? 'blur-md scale-105' : 'scale-100'}`}
                    style={{ 
                        filter: 'grayscale(100%) brightness(0.6) sepia(100%) hue-rotate(170deg) saturate(400%) contrast(1.2)' 
                    }}
                />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] pointer-events-none"></div>
            </div>
        )}

        {/* Grid Overlay */}
        <div className="absolute inset-0 opacity-20 pointer-events-none z-10" 
             style={{ 
                 backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.2) 1px, transparent 1px)', 
                 backgroundSize: '60px 60px' 
             }}>
        </div>

        {/* SCANNER LINE ANIMATION */}
        {(phase === 'scanning' || isSubmitting) && (
            <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400/80 shadow-[0_0_50px_rgba(34,211,238,1)] animate-[scan_2s_ease-in-out_infinite] z-20"></div>
        )}

        {/* HUD PANEL */}
        <div className="relative z-30 w-full max-w-md bg-bg-mid/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl flex flex-col items-center">
            
            {/* BRAND LOGO */}
            <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-cyan-400 p-[1px] flex items-center justify-center">
                    <div className="w-full h-full rounded-xl bg-bg-deep flex items-center justify-center">
                        <Cpu className="text-cyan-400 w-5 h-5 animate-pulse" />
                    </div>
                </div>
                <span className="text-xl font-black tracking-tighter text-white">REGENERA <span className="text-primary text-sm align-top">PRO</span></span>
            </div>

            {/* TAB SELECTOR */}
            {phase === 'waiting' && !isSubmitting && (
              <div className="flex w-full bg-black/40 rounded-2xl p-1 mb-8 border border-white/5">
                  <button 
                      onClick={() => { setActiveTab('biometrics'); setFormError(null); }}
                      className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${activeTab === 'biometrics' ? 'bg-primary/20 text-cyan-400 border border-primary/30 shadow-lg shadow-primary/10' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                      Biometria Neural
                  </button>
                  <button 
                      onClick={() => { setActiveTab('email'); setFormError(null); }}
                      className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${activeTab === 'email' ? 'bg-primary/20 text-cyan-400 border border-primary/30 shadow-lg shadow-primary/10' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                      Acesso E-mail
                  </button>
              </div>
            )}

            {/* --- TAB CONTENT: BIOMETRICS --- */}
            {activeTab === 'biometrics' && (
              phase === 'waiting' ? (
                  <div className="flex flex-col items-center w-full animate-in fade-in zoom-in duration-500">
                      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 border border-primary/30 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                          <Fingerprint className="w-10 h-10 text-primary animate-pulse" />
                      </div>
                      <h2 className="text-lg font-black tracking-tight text-white mb-2 text-center uppercase">AUTENTICAÇÃO NEURAL</h2>
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.4em] mb-8 text-center">Segurança Ativa Regenera</p>
                      
                      <div className="grid grid-cols-2 gap-4 w-full">
                          <button 
                              onClick={() => startBiometric('face')}
                              className="flex flex-col items-center gap-3 p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-primary/50 transition-all group active:scale-95"
                          >
                              <ScanFace className="w-8 h-8 text-gray-400 group-hover:text-primary transition-colors" />
                              <span className="text-[9px] font-bold text-gray-500 group-hover:text-white uppercase tracking-widest">Face ID</span>
                          </button>
                          <button 
                              onClick={() => startBiometric('fingerprint')}
                              className="flex flex-col items-center gap-3 p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-primary/50 transition-all group active:scale-95"
                          >
                              <Fingerprint className="w-8 h-8 text-gray-400 group-hover:text-primary transition-colors" />
                              <span className="text-[9px] font-bold text-gray-500 group-hover:text-white uppercase tracking-widest">Digital ID</span>
                          </button>
                      </div>
                  </div>
              ) : (
                  <div className="relative w-72 h-72 mb-8 flex items-center justify-center">
                      {/* Rotating Rings */}
                      <div className={`absolute inset-0 border-[2px] border-cyan-500/30 rounded-full ${phase === 'authorized' ? 'border-emerald-500/80 scale-105 shadow-[0_0_50px_rgba(16,185,129,0.4)]' : 'border-t-cyan-400 border-b-transparent animate-[spin_4s_linear_infinite]'}`}></div>
                      <div className={`absolute inset-4 border border-dashed border-primary/60 rounded-full ${phase === 'authorized' ? 'border-emerald-500/50' : 'animate-[spin_8s_linear_infinite_reverse]'}`}></div>
                      
                      {/* Iris Tracking Reticle */}
                      {phase === 'scanning' && method === 'face' && (
                          <div className="absolute inset-0 flex items-center justify-center animate-pulse">
                              <div className="w-16 h-16 border border-cyan-400/50 rounded-full flex items-center justify-center">
                                  <div className="w-1 h-1 bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee]"></div>
                                  <div className="absolute w-full h-full border-t border-b border-cyan-400/20 scale-150"></div>
                                  <div className="absolute w-full h-full border-l border-r border-cyan-400/20 scale-150"></div>
                              </div>
                          </div>
                      )}

                      {/* HUD Brackets */}
                      <div className="absolute top-0 left-0 w-10 h-10 border-t-[3px] border-l-[3px] border-cyan-400 rounded-tl-xl drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
                      <div className="absolute top-0 right-0 w-10 h-10 border-t-[3px] border-r-[3px] border-cyan-400 rounded-tr-xl drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
                      <div className="absolute bottom-0 left-0 w-10 h-10 border-b-[3px] border-l-[3px] border-cyan-400 rounded-bl-xl drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
                      <div className="absolute bottom-0 right-0 w-10 h-10 border-b-[3px] border-r-[3px] border-cyan-400 rounded-br-xl drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>

                      {/* Biometric Center */}
                      <div className="absolute inset-0 flex items-center justify-center">
                          {phase === 'authorized' ? (
                              <div className="relative animate-in zoom-in duration-500">
                                  <UserCheck className="w-24 h-24 text-emerald-400 drop-shadow-[0_0_30px_rgba(52,211,153,1)]" strokeWidth={1.5} />
                                  <div className="absolute inset-0 bg-emerald-400/20 blur-3xl rounded-full"></div>
                              </div>
                          ) : (
                              <div className="relative flex flex-col items-center">
                                  {method === 'face' ? (
                                      <>
                                          {!videoRef.current?.srcObject && (
                                              <ScanFace className="w-24 h-24 text-cyan-400/50 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" strokeWidth={0.5} />
                                          )}
                                          <div className="absolute top-1/3 left-1/4 w-1.5 h-1.5 bg-cyan-200 rounded-full animate-ping shadow-[0_0_10px_white]"></div>
                                          <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-cyan-200 rounded-full animate-ping delay-75 shadow-[0_0_10px_white]"></div>
                                          <div className="absolute bottom-1/3 left-1/2 w-1.5 h-1.5 bg-cyan-200 rounded-full animate-ping delay-150 shadow-[0_0_10px_white]"></div>
                                      </>
                                  ) : (
                                      <div className="relative">
                                          <Fingerprint className="w-24 h-24 text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.4)]" strokeWidth={1} />
                                          <div className="absolute inset-0 bg-cyan-400/10 rounded-full blur-2xl animate-pulse"></div>
                                          <div className="absolute top-0 left-0 w-full h-0.5 bg-cyan-400 shadow-[0_0_15px_#22d3ee] animate-[scan_1.5s_ease-in-out_infinite]"></div>
                                      </div>
                                  )}
                              </div>
                          )}
                      </div>

                      {/* Biometric Status Badge */}
                      <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-full flex justify-center">
                          <div className={`px-4 py-1.5 rounded-full border backdrop-blur-xl flex items-center gap-2 transition-all duration-500 shadow-2xl ${
                              phase === 'authorized' 
                              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                              : 'bg-bg-deep/80 border-cyan-500/50 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]'
                          }`}>
                              {phase === 'authorized' ? <CheckCircle className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5 animate-pulse" />}
                              <span className="text-[9px] font-bold tracking-[0.2em] uppercase whitespace-nowrap">
                                  {phase === 'scanning' && (method === 'face' ? 'Escaneando Íris...' : 'Lendo Digital...')}
                                  {phase === 'analyzing' && 'Validando Biometria...'}
                                  {phase === 'authorized' && 'Acesso Autorizado'}
                              </span>
                          </div>
                      </div>
                  </div>
              )
            )}

            {/* --- TAB CONTENT: EMAIL AUTH --- */}
            {activeTab === 'email' && (
              <form onSubmit={handleEmailSubmit} className="w-full space-y-5 animate-in fade-in zoom-in duration-500">
                  <div className="text-center mb-2">
                      <h2 className="text-base font-black tracking-tight text-white uppercase">
                          {authMode === 'login' ? 'Acesso por E-mail' : 'Criar Novo Cadastro'}
                      </h2>
                      <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">
                          {authMode === 'login' ? 'Entre com sua credencial' : 'Preencha os dados de membro'}
                      </p>
                  </div>

                  {/* Form Error Message */}
                  {formError && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-3 text-[10px] text-red-400 animate-shake">
                          <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
                          <span>{formError}</span>
                      </div>
                  )}

                  {/* Form Success Message */}
                  {formSuccess && (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-3 text-[10px] text-emerald-400">
                          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                          <span>{formSuccess}</span>
                      </div>
                  )}

                  {/* Name field (Register only) */}
                  {authMode === 'register' && (
                      <div className="space-y-1.5">
                          <label className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block">Seu Nome</label>
                          <div className="relative">
                              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                              <input 
                                  type="text" 
                                  value={name}
                                  onChange={(e) => { setName(e.target.value); setFormError(null); }}
                                  placeholder="Digite seu nome completo"
                                  className="w-full bg-black/30 border border-white/5 focus:border-cyan-400/50 rounded-xl py-3 pl-11 pr-4 text-xs text-white focus:outline-none transition-all"
                                  disabled={isSubmitting}
                              />
                          </div>
                      </div>
                  )}

                  {/* Email Field */}
                  <div className="space-y-1.5">
                      <label className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block">E-mail Corporativo</label>
                      <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <input 
                              type="email" 
                              value={email}
                              onChange={(e) => { setEmail(e.target.value); setFormError(null); }}
                              placeholder="nome@regenera.bank"
                              className="w-full bg-black/30 border border-white/5 focus:border-cyan-400/50 rounded-xl py-3 pl-11 pr-4 text-xs text-white focus:outline-none transition-all"
                              disabled={isSubmitting}
                          />
                      </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-1.5">
                      <label className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block">Senha de Acesso</label>
                      <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <input 
                              type={showPassword ? 'text' : 'password'} 
                              value={password}
                              onChange={(e) => { setPassword(e.target.value); setFormError(null); }}
                              placeholder="Sua senha neural"
                              className="w-full bg-black/30 border border-white/5 focus:border-cyan-400/50 rounded-xl py-3 pl-11 pr-12 text-xs text-white focus:outline-none transition-all"
                              disabled={isSubmitting}
                          />
                          <button 
                              type="button" 
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                          >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                      </div>
                  </div>

                  {/* Submit Button */}
                  <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 bg-gradient-to-r from-primary to-cyan-400 rounded-xl border border-cyan-400/20 shadow-lg text-[10px] font-bold uppercase tracking-widest text-white flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                  >
                      {isSubmitting ? (
                          <>
                              <Cpu className="w-4 h-4 animate-spin text-white" />
                              <span>Processando Chaves...</span>
                          </>
                      ) : (
                          <>
                              <span>{authMode === 'login' ? 'Conectar' : 'Registrar Assinatura'}</span>
                              <ArrowRight className="w-4 h-4 text-white" />
                          </>
                      )}
                  </button>

                  {/* Switch Auth Mode Toggle */}
                  <div className="text-center pt-2">
                      <button 
                          type="button"
                          onClick={() => { 
                              setAuthMode(authMode === 'login' ? 'register' : 'login'); 
                              setFormError(null); 
                              setFormSuccess(null);
                              if (authMode === 'login') {
                                setEmail('');
                                setPassword('');
                              } else {
                                setEmail('don.paulo@regenera.bank');
                                setPassword('••••••••••••');
                              }
                          }}
                          className="text-[9px] text-cyan-400 hover:text-white uppercase tracking-widest transition-colors font-bold underline decoration-cyan-400/30 underline-offset-4"
                      >
                          {authMode === 'login' ? 'Criar Cadastro' : 'Acessar por E-mail'}
                      </button>
                  </div>
              </form>
            )}

            {/* --- DATA STREAM (During Biometrics Scan or Submit) --- */}
            {phase !== 'waiting' && activeTab === 'biometrics' && (
                <div className="w-full mt-8 space-y-2 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex justify-between items-center text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                        <span>Canal de Dados</span>
                        <span className={phase === 'authorized' ? 'text-emerald-500' : 'text-cyan-500'}>{phase === 'authorized' ? 'CONECTADO' : 'SYNCING...'}</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-100 ease-out ${phase === 'authorized' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-cyan-500 shadow-[0_0_10px_#22d3ee]'}`} 
                            style={{ width: `${scanProgress}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                        <span>CHAVE: DON-PAULO-AGI-01</span>
                        <span>{Math.round(scanProgress)}%</span>
                    </div>
                </div>
            )}

        </div>

        {/* BOTTOM BRANDING */}
        <div className="mt-8 text-center animate-in slide-in-from-bottom-4 fade-in duration-1000 delay-500 z-30">
             <div className="flex items-center justify-center gap-2 text-white/30 mb-2">
                <ShieldAlert className="w-4 h-4" />
                <span className="text-[9px] uppercase tracking-[0.3em]">Ambiente Seguro</span>
             </div>
             <p className="text-[10px] text-gray-500 font-mono">Regenera Private OS v4.0</p>
        </div>

    </div>
  );
};

export default LoginScreen;
