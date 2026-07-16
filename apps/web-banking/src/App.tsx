

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ModuleId, Transaction, UserProfile, AssistantReply, ChatMessage, AssistantSettings, OrbTheme, MapLocation } from './types';
import { chatWithRaphaela, speakWithRaphaela } from './services/raphaelaChatService';
import { useSpeech } from './hooks/useSpeech';
import {
  fetchDashboard,
  fetchTransactions,
  fetchOnboardingStatus,
  ensureChannelJourney,
  centsToReais,
  mapTransactionDto,
  sendTelegramViaBff,
  formatBffUserError,
  revokeSession,
} from './platform/bff-client';
import {
  saveSession,
  loadSession,
  clearSession,
  isBffHomologToken,
} from './platform/session';
import { auth, isFirebaseConfigured } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

// Components

import LoginScreen from './components/Auth/LoginScreen';
import IntroScreen from './components/IntroScreen';
import SessionBootstrapScreen from './components/Auth/SessionBootstrapScreen';
import OnboardingScreen from './components/Auth/OnboardingScreen';
import PixArea from './components/Banking/PixArea';
import TransferArea from './components/Banking/TransferArea';
import Investments from './components/Modules/Investments';
import CardsModule from './components/Modules/Cards';
import { CryptoModule } from './components/Modules/Crypto';
import TransactionsModule from './components/Modules/Transactions';
import RaphaelaOrb from './components/Assistant/RaphaelaOrb';
import Manifesto from './Manifesto/Manifesto';
import SearchResults from './components/SearchResults';
import MapWidget from './components/UI/MapWidget';
import AppShell from './components/UI/AppShell';
// Extended Modules
import { LoansModule, SavingsModule, InsuranceModule } from './components/Modules/WealthExtended';
import { DreamVault, Marketplace, Rewards, TravelConcierge } from './components/Modules/LifestyleExtended';
import LifestyleModulePanel from './components/Modules/LifestyleModulePanel';
import { CreditModule, SeniorModule } from './components/Modules/WebAuxModules';
import { ProfileHub, Support } from './components/Modules/SystemExtended';
import StatementInsights from './components/Modules/StatementInsights';
import { resolveLifestyleView } from './platform/lifestyle-modules';

// Icons
import { 
  Menu, Bell, CreditCard, TrendingUp, Send, 
  ShoppingBag, Plane, Shield, 
  DollarSign, Zap, ArrowLeft,
  X, CheckCircle, User, Home, FileText,
  Gift, LifeBuoy, Bitcoin, Rocket, LogOut, PiggyBank, Umbrella,
  Fingerprint,
  AlertTriangle,
  Search,
  Eye, EyeOff,
  ChevronDown,
  BrainCircuit, Mic, Cloud, Baby, Tag, Calendar, Leaf, GraduationCap, BarChart3, HeartHandshake
} from 'lucide-react';

const LIFESTYLE_CUSTOM_MODULES: ModuleId[] = ['marketplace', 'rewards', 'travel', 'realizar'];

const EMPTY_PROFILE: UserProfile = {
  name: '',
  balance: 0,
  availableBalance: 0,
  accountNumber: '',
  memberSince: new Date().getFullYear().toString(),
};

const formatBalance = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const introSkippedOnLoad =
  typeof window !== 'undefined' &&
  !new URLSearchParams(window.location.search).has('replayIntro') &&
  (new URLSearchParams(window.location.search).has('skipIntro') ||
    sessionStorage.getItem('regenera_intro_done') === '1');

const App: React.FC = () => {
  // --- STATE ---
  const [bootstrapping, setBootstrapping] = useState(true);
  const [introDone, setIntroDone] = useState(introSkippedOnLoad);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [onboardingRequired, setOnboardingRequired] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>(EMPTY_PROFILE);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Navigation State
  const [activeModule, setActiveModule] = useState<ModuleId>('home');
  const [navHistory, setNavHistory] = useState<ModuleId[]>(['home']);
  const [menuOpen, setMenuOpen] = useState(false);
  
  // UI State
  const [showBalance, setShowBalance] = useState(true);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [expandHeroCard, setExpandHeroCard] = useState(false); // New Expanded State

  // Dynamic Props for Modules (passed from AI action)
  const [moduleProps, setModuleProps] = useState<any>({});
  
  // Settings State
  const [assistantSettings, setAssistantSettings] = useState<AssistantSettings>({
      voice: 'Kore',
      style: 'formal',
      orbTheme: 'cyan',
      telegramToken: '',
      telegramChatId: '',
      googleCloudToken: ''
  });

  // Notification State
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'alert' | 'security'} | null>(null);

  // Chat de suporte (estado de UI)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '0', role: 'assistant', text: 'Raphaela pronta. Como posso ajudar com sua conta?', timestamp: Date.now() }
  ]);
  const [currentSearchResults, setCurrentSearchResults] = useState<any[]>([]);
  const [showMapWidget, setShowMapWidget] = useState(false);
  const [currentMapLocations, setCurrentMapLocations] = useState<MapLocation[]>([]);

  const [isAssistantThinking, setIsAiThinking] = useState(false);
  const [thinkingModel, setThinkingModel] = useState<string | null>(null);
  const [isAssistantSpeaking, setIsAiSpeaking] = useState(false);
  const [showAssistantChat, setShowAssistantChat] = useState(false);
  const [lastAiMessage, setLastAiMessage] = useState<string | null>(null);
  
  // Refs de áudio
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Custom Hooks
  const { isListening, transcript, startListening, stopListening, resetTranscript, error: speechError } = useSpeech();

  const showFeedback = (msg: string, type: 'success' | 'alert' | 'security' = 'success') => {
    setNotification({ message: msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const refreshBanking = useCallback(async (token: string) => {
    const [dashboard, txResponse] = await Promise.all([
      fetchDashboard(token),
      fetchTransactions(token),
    ]);
    setUserProfile((prev) => ({
      ...prev,
      balance: centsToReais(dashboard.balanceCents),
      availableBalance: centsToReais(dashboard.availableCents),
      agency: dashboard.agency,
      document: dashboard.document,
      accountNumber: dashboard.maskedAccount || prev.accountNumber,
    }));
    setTransactions(txResponse.items.map(mapTransactionDto));
  }, []);

  const enterAfterAuth = useCallback(
    async (
      session: { accessToken: string; displayName: string },
      message: string,
    ) => {
      saveSession({ accessToken: session.accessToken, displayName: session.displayName });
      setAccessToken(session.accessToken);
      await ensureChannelJourney(session.accessToken);
      const onboarding = await fetchOnboardingStatus(session.accessToken);
      setUserProfile((prev) => ({
        ...prev,
        name: onboarding.displayName?.trim() || session.displayName,
        memberSince: new Date().getFullYear().toString(),
      }));
      if (onboarding.accountStatus !== 'ACTIVE') {
        setOnboardingRequired(true);
        setIsAuthenticated(true);
        showFeedback(message, 'success');
        return;
      }
      await refreshBanking(session.accessToken);
      setOnboardingRequired(false);
      setIsAuthenticated(true);
      showFeedback(message, 'success');
    },
    [refreshBanking],
  );

  const handleSessionReady = useCallback(
    async (session: { accessToken: string; displayName: string }, message: string) => {
      try {
        await enterAfterAuth(session, message);
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Falha na autenticação';
        showFeedback(msg, 'alert');
      }
    },
    [enterAfterAuth],
  );

  const handleOnboardingComplete = useCallback(async () => {
    if (!accessToken) return;
    try {
      const onboarding = await fetchOnboardingStatus(accessToken);
      setUserProfile((prev) => ({
        ...prev,
        name: onboarding.displayName?.trim() || prev.name,
      }));
      await refreshBanking(accessToken);
      setOnboardingRequired(false);
      showFeedback('Conta ativa — bem-vindo ao Regenera Bank!', 'success');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Falha ao carregar conta';
      showFeedback(msg, 'alert');
    }
  }, [accessToken, refreshBanking]);

  const handleBankingMutation = useCallback(async () => {
    if (!accessToken) return;
    try {
      await refreshBanking(accessToken);
    } catch {
      showFeedback('Não foi possível atualizar o saldo.', 'alert');
    }
  }, [accessToken, refreshBanking]);

  const resetToLogin = useCallback(() => {
    if (accessToken) {
      // Revoga a sessão no BFF (POST /auth/session/revoke) — logout real, best-effort.
      void revokeSession(accessToken).catch(() => {});
    }
    if (isFirebaseConfigured() && auth) {
      void signOut(auth);
    }
    clearSession();
    setAccessToken(null);
    setTransactions([]);
    setUserProfile(EMPTY_PROFILE);
    setIsAuthenticated(false);
    setOnboardingRequired(false);
  }, [accessToken]);

  useEffect(() => {
    const bootstrap = async () => {
      const session = loadSession();
      if (!session) {
        setBootstrapping(false);
        return;
      }

      let token = session.accessToken;
      if (isFirebaseConfigured() && auth && !isBffHomologToken(token)) {
        await new Promise<void>((resolve) => {
          let settled = false;
          const finish = () => {
            if (settled) {
              return;
            }
            settled = true;
            resolve();
          };
          const timeout = window.setTimeout(finish, 8_000);
          const unsub = onAuthStateChanged(auth!, async (user) => {
            window.clearTimeout(timeout);
            unsub();
            if (!user) {
              resetToLogin();
              setBootstrapping(false);
              finish();
              return;
            }
            try {
              token = await user.getIdToken(false);
              saveSession({ accessToken: token, displayName: session.displayName });
            } catch (error) {
              const code = (error as { code?: string })?.code;
              if (code === 'auth/quota-exceeded') {
                await signOut(auth!);
                showFeedback(
                  'Login Google/Firebase indisponível (cota excedida). Use CPF e senha.',
                  'alert',
                );
                resetToLogin();
                setBootstrapping(false);
                finish();
                return;
              }
            }
            finish();
          });
        });
      }

      setAccessToken(token);
      try {
        const onboarding = await fetchOnboardingStatus(token);
        setUserProfile((prev) => ({
          ...prev,
          name: onboarding.displayName?.trim() || session.displayName,
        }));
        if (onboarding.accountStatus !== 'ACTIVE') {
          setOnboardingRequired(true);
          setIsAuthenticated(true);
          return;
        }
        await refreshBanking(token);
        setIsAuthenticated(true);
      } catch (error) {
        showFeedback(formatBffUserError(error), 'alert');
        resetToLogin();
      } finally {
        setBootstrapping(false);
      }
    };
    void bootstrap();
  }, [refreshBanking, resetToLogin, showFeedback]);
  
  // --- REAL INTEGRATIONS ---
  const executeRealTelegram = async (message: string) => {
      if (!accessToken) {
          showFeedback('Sessão expirada — faça login novamente.', 'alert');
          return;
      }
      try {
          const result = await sendTelegramViaBff(accessToken, message);
          if (result.ok) showFeedback('Telegram enviado com sucesso!', 'success');
          else showFeedback(result.detail ?? 'Falha ao enviar Telegram.', 'alert');
      } catch (error) {
          const msg = error instanceof Error ? error.message : 'Erro de conexão com Telegram.';
          showFeedback(msg, 'alert');
      }
  };

  const executeRealCloud = async (params?: { service?: string; action?: string }) => {
    void params;
    showFeedback(
      'Admin Cloud (Compute/GCP) — EXTERNAL_ACTIVATION. Use operations-bff com IAM institucional.',
      'alert',
    );
  };

  // --- Áudio ---
  const playAudio = async (base64Audio: string) => {
    try {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        if (audioSourceRef.current) {
            try { audioSourceRef.current.stop(); } catch { /* already stopped */ }
        }

        const audioCtx = audioContextRef.current;
        
        const binaryString = window.atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        const int16Data = new Int16Array(bytes.buffer);
        const sampleRate = 24000;
        const audioBuffer = audioCtx.createBuffer(1, int16Data.length, sampleRate);
        const channelData = audioBuffer.getChannelData(0);
        
        for (let i = 0; i < int16Data.length; i++) {
            channelData[i] = int16Data[i] / 32768.0;
        }

        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);
        
        source.onended = () => setIsAiSpeaking(false);
        audioSourceRef.current = source;
        
        setIsAiSpeaking(true);
        source.start(0);
    } catch (e) {
        console.error("Audio Playback Error:", e);
        setIsAiSpeaking(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    if (!accessToken) {
      showFeedback('Faça login para usar a Raphaela.', 'alert');
      return;
    }

    setChatMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: text, timestamp: Date.now() }]);
    setIsAiThinking(true);
    
    const msg = text.toLowerCase();
    if (msg.length > 50 || msg.includes('analise') || msg.includes('investir') || msg.includes('sugestão') || msg.includes('planejamento') || msg.includes('futuro') || msg.includes('sonho')) {
        setThinkingModel('Deep Thought (Pro)');
    } else if (msg.includes('onde') || msg.includes('mapa') || msg.includes('fica') || msg.includes('preço') || msg.includes('quanto tá') || msg.includes('cotação')) {
        setThinkingModel('Search & Maps (Flash)');
    } else {
        setThinkingModel('Reflex (Lite)');
    }

    setCurrentSearchResults([]);
    setShowMapWidget(false);

    const recentTxString = transactions
      .slice(0, 10)
      .map((t) => `${t.date}: ${t.title} ${t.type === 'inflow' ? '+' : '-'}${t.amount}`)
      .join(' | ');

    const context = `
      [CONTA]
      NOME: ${userProfile.name}
      SALDO: R$ ${userProfile.balance.toLocaleString('pt-BR')}
      CONTA: ${userProfile.accountNumber || '—'}
      TELA_ATUAL: ${activeModule}

      [EXTRATO_RECENTE]
      ${recentTxString || 'sem movimentações'}

      [SEGURANCA]
      ALERTA: nominal
    `.trim();

    const response: AssistantReply = await chatWithRaphaela(text, context, assistantSettings, accessToken);

    setIsAiThinking(false);
    setThinkingModel(null);
    
    setChatMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', text: response.text, timestamp: Date.now() }]);
    setLastAiMessage(response.text);
    setTimeout(() => setLastAiMessage(null), 8000);

    if (response.searchResults && response.searchResults.length > 0) {
        setCurrentSearchResults(response.searchResults);
    }

    if (response.mapResults && response.mapResults.length > 0) {
        setCurrentMapLocations(response.mapResults);
    } else {
        setCurrentMapLocations([]);
    }

    if (response.action && response.action !== 'none') {
        switch (response.action) {
            case 'navigate':
                if (response.params?.module) handleNavigate(response.params.module as ModuleId);
                break;
            case 'pix_send':
                setModuleProps({ initialAction: { type: 'send', value: response.params?.value, to: response.params?.to } });
                handleNavigate('pix');
                showFeedback("Preparando infraestrutura Pix...", 'success');
                break;
            case 'pix_receive':
                 setModuleProps({ initialAction: { type: 'receive', value: response.params?.value } });
                handleNavigate('pix');
                break;
            case 'transfer_send':
                setModuleProps({ initialAction: { type: 'send', value: response.params?.value, to: response.params?.to } });
                handleNavigate('transfer');
                showFeedback('Abrindo transferência interna...', 'success');
                break;
            case 'show_balance':
                setShowBalance(true);
                handleNavigate('home');
                break;
            case 'toggle_balance':
                setShowBalance(prev => !prev);
                break;
            case 'change_theme':
                if (response.params?.theme) {
                    const theme = response.params.theme as OrbTheme;
                    setAssistantSettings(prev => ({ ...prev, orbTheme: theme }));
                    showFeedback(`Espectro ${theme} sincronizado.`, 'success');
                }
                break;
            case 'search_transactions':
                if (response.params?.query) {
                    setGlobalSearchTerm(String(response.params.query));
                    handleNavigate('transactions');
                }
                break;
            case 'statement_insights':
                handleNavigate('statement-insights');
                break;
            case 'manifesto':
                handleNavigate('manifesto');
                break;
            case 'block_card':
                setModuleProps({ highlightBlock: true });
                handleNavigate('cards');
                showFeedback("Protocolo de Bloqueio Iniciado", 'security');
                break;
            case 'invest_suggestion':
                 handleNavigate('investments');
                 break;
            case 'map_search':
                 setShowMapWidget(true);
                 showFeedback("Renderizando localização geográfica...", 'success');
                 break;
            case 'market_check':
                showFeedback("Dados de mercado atualizados.", 'success');
                break;
            case 'fraud_scan':
                const url = response.params?.url || 'URL';
                showFeedback(`Análise de Segurança: ${url}`, 'security');
                break;
            case 'send_telegram':
                if (response.params?.message) executeRealTelegram(String(response.params.message));
                break;
            case 'manage_cloud':
                executeRealCloud(
                  response.params as { service?: string; action?: string } | undefined,
                );
                break;
            case 'send_email':
                showFeedback(
                  'E-mail institucional — EXTERNAL_ACTIVATION. Canal web não chama Gmail API diretamente.',
                  'alert',
                );
                break;
        }
    }

    const audioData = await speakWithRaphaela(response.text, assistantSettings.voice, accessToken);
    if (audioData) {
        playAudio(audioData);
    }
  };

  useEffect(() => {
    if (transcript && !isListening) {
        handleSendMessage(transcript);
        resetTranscript();
    }
  }, [transcript, isListening]);

  useEffect(() => {
    if (speechError && speechError !== 'no-speech') {
        showFeedback(speechError === 'not-allowed' ? 'Permita o microfone para falar com Raphaela.' : `Falha no Audio: ${speechError}`, 'alert');
    }
  }, [speechError]);

  useEffect(() => {
    setGlobalSearchTerm('');
  }, [activeModule]);

  const handleNavigate = (module: ModuleId) => {
    if (activeModule !== module) {
        setNavHistory(prev => [...prev, module]);
        setActiveModule(module);
    }
    setMenuOpen(false);
  };

  const handleBack = () => {
      if (navHistory.length > 1) {
          const newHistory = [...navHistory];
          newHistory.pop();
          const previous = newHistory[newHistory.length - 1];
          setNavHistory(newHistory);
          setActiveModule(previous);
      } else {
          setActiveModule('home');
      }
      setModuleProps({});
  };

  const handleThemeCycle = () => {
      const themes: OrbTheme[] = ['cyan', 'purple', 'emerald', 'amber', 'crimson'];
      const currentIndex = themes.indexOf(assistantSettings.orbTheme);
      const nextIndex = (currentIndex + 1) % themes.length;
      setAssistantSettings(prev => ({ ...prev, orbTheme: themes[nextIndex] }));
  };

  const renderAiChat = () => (
    <div className={`absolute inset-0 z-[70] transition-all duration-500 ${showAssistantChat ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowAssistantChat(false)}></div>
        <div className={`absolute bottom-0 left-0 right-0 h-[70vh] bg-bg-deep border-t border-white/10 rounded-t-[3rem] transform transition-transform duration-500 ${showAssistantChat ? 'translate-y-0' : 'translate-y-full'} flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.5)]`}>
            <div className="p-6 border-b border-white/5 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 p-[2px]">
                        <div className="w-full h-full rounded-full bg-bg-mid flex items-center justify-center">
                            <BrainCircuit className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <div>
                        <h3 className="font-bold text-white tracking-tight">Assistente Raphaela</h3>
                        <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">Suporte digital</p>
                    </div>
                </div>
                <button onClick={() => setShowAssistantChat(false)} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {chatMessages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                        <div className={`max-w-[85%] p-4 rounded-2xl ${
                            msg.role === 'user' 
                                ? 'bg-primary/20 border border-primary/30 text-white rounded-tr-sm' 
                                : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-sm'
                        }`}>
                            <p className="text-sm leading-relaxed">{msg.text}</p>
                            <span className="text-[9px] text-gray-500 mt-2 block font-bold">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                ))}
                {isAssistantThinking && (
                    <div className="flex justify-start animate-pulse">
                        <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm p-4 flex flex-col gap-2">
                            <div className="flex items-center gap-3">
                                <div className="flex gap-1">
                                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"></div>
                                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                </div>
                                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Processando...</span>
                            </div>
                            {thinkingModel && (
                                <div className="flex items-center gap-2 px-2 py-1 bg-cyan-400/10 rounded-lg border border-cyan-400/20">
                                    <Zap className="w-3 h-3 text-cyan-400" />
                                    <span className="text-[8px] font-bold text-cyan-400/80 uppercase tracking-tighter">{thinkingModel}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <div className="p-6 border-t border-white/5 bg-bg-mid/50 shrink-0">
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Pergunte sobre sua conta..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-6 pr-14 text-sm text-white focus:outline-none focus:border-cyan-400/50 transition-all"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleSendMessage(e.currentTarget.value);
                                e.currentTarget.value = '';
                            }
                        }}
                    />
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-cyan-500 rounded-xl text-white shadow-lg shadow-cyan-500/20 active:scale-95 transition-transform">
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    </div>
  );

  const renderHeader = (title?: string, backBtn = false) => (
    <header className="app-header sticky top-0 z-30 backdrop-blur-xl flex items-center justify-between safe-top">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {backBtn || activeModule !== 'home' ? (
          <button onClick={handleBack} className="header-icon-btn touch-manipulation flex-shrink-0" aria-label="Voltar">
            <ArrowLeft className="w-[18px] h-[18px]" />
          </button>
        ) : (
          <button onClick={() => setMenuOpen(true)} className="header-icon-btn touch-manipulation flex-shrink-0" aria-label="Menu Principal">
            <Menu className="w-[18px] h-[18px]" />
          </button>
        )}
        {activeModule === 'transactions' ? (
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input type="text" value={globalSearchTerm} onChange={(e) => setGlobalSearchTerm(e.target.value)} placeholder="Buscar transações..." className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-9 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400/50 focus:bg-white/10 transition-all" />
          </div>
        ) : (
          <div className="header-title-wrap min-w-0">
            {!backBtn && activeModule === 'home' && (
              <span className="header-kicker">Private Financial OS</span>
            )}
            <h1 id="header-title" className="font-extrabold text-sm uppercase truncate text-white">
              {title || 'Visão Geral'}
            </h1>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 pl-2 flex-shrink-0">
        <button onClick={() => setShowBalance(!showBalance)} className="header-icon-btn touch-manipulation" aria-label="Ocultar ou revelar saldo">
          {showBalance ? <Eye className="w-[18px] h-[18px]" /> : <EyeOff className="w-[18px] h-[18px]" />}
        </button>
        <button className="header-icon-btn relative touch-manipulation" aria-label="Notificações">
          <Bell className="w-[17px] h-[17px]" />
          <span className="absolute top-[8px] right-[8px] w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
        </button>
      </div>
    </header>
  );

  const renderSidebar = () => {
      const MenuItem = ({ id, icon: Icon, label, onClick }: any) => (
        <button onClick={() => onClick ? onClick() : handleNavigate(id)} className="w-full flex items-center gap-4 p-4 hover:bg-white/5 rounded-xl transition-colors text-left group border border-transparent hover:border-white/5 active:bg-white/10 touch-manipulation">
            <Icon className="w-6 h-6 text-gray-500 group-hover:text-cyan-400 transition-colors" />
            <span className="font-medium text-base text-gray-300 group-hover:text-white tracking-wide">{label}</span>
        </button>
      );
      const MenuSection = ({ title, children }: any) => (
          <div className="mb-6">
              <h3 className="px-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">{title}</h3>
              <div className="space-y-1">{children}</div>
          </div>
      );
      return (
        <div className={`side-menu-layer ${menuOpen ? 'is-open' : ''}`} aria-hidden={!menuOpen}>
            <button type="button" className="side-menu-backdrop" onClick={() => setMenuOpen(false)} aria-label="Fechar menu" />
            <aside className="side-menu-panel flex flex-col" role="dialog" aria-modal="true" aria-label="Menu principal">
                <div className="p-8 border-b border-white/5 bg-gradient-to-r from-bg-mid to-bg-deep shrink-0">
                    <div className="flex justify-between items-center mb-6">
                        <span className="font-bold text-2xl tracking-tighter text-white">REGENERA <span className="text-primary text-sm align-top">PRO</span></span>
                        <button onClick={() => setMenuOpen(false)} className="p-2 -mr-2 text-gray-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
                    </div>
                    <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-cyan-400 p-[2px] shadow-lg shadow-cyan-500/20">
                             <div className="w-full h-full rounded-full bg-bg-mid flex items-center justify-center overflow-hidden">
                                 <User className="text-white w-6 h-6" />
                             </div>
                         </div>
                         <div>
                             <p className="font-bold text-white text-sm">{userProfile.name || 'Cliente'}</p>
                             <p className="text-[10px] text-emerald-400 tracking-wide font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full inline-block border border-emerald-500/20">CONTA ATIVA</p>
                         </div>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar pb-20">
                    <MenuSection title="Banco">
                        <MenuItem id="home" icon={Home} label="Visão Geral" />
                        <MenuItem id="transactions" icon={FileText} label="Extrato" />
                        <MenuItem id="pix" icon={Zap} label="Pix" />
                        <MenuItem id="transfer" icon={Send} label="Transferência interna" />
                        <MenuItem id="cards" icon={CreditCard} label="Cartões" />
                        <MenuItem id="statement-insights" icon={BrainCircuit} label="Resumo do extrato" />
                    </MenuSection>
                    <MenuSection title="Patrimônio">
                        <MenuItem id="investments" icon={TrendingUp} label="Investimentos" />
                        <MenuItem id="savings" icon={PiggyBank} label="Poupança" />
                        <MenuItem id="crypto" icon={Bitcoin} label="Cripto (BRL)" />
                        <MenuItem id="loans" icon={DollarSign} label="Empréstimos" />
                        <MenuItem id="credit" icon={DollarSign} label="Linhas de crédito" />
                        <MenuItem id="insurance" icon={Umbrella} label="Seguros" />
                    </MenuSection>
                    <MenuSection title="Lifestyle">
                        <MenuItem id="realizar" icon={Rocket} label="Realizar" />
                        <MenuItem id="marketplace" icon={ShoppingBag} label="Marketplace" />
                        <MenuItem id="rewards" icon={Gift} label="Rewards" />
                        <MenuItem id="travel" icon={Plane} label="Viagens" />
                        <MenuItem id="benefits" icon={Tag} label="Descontos" />
                        <MenuItem id="kids" icon={Baby} label="Kids" />
                        <MenuItem id="senior" icon={HeartHandshake} label="Senior" />
                        <MenuItem id="pet-savings" icon={HeartHandshake} label="Pets" />
                        <MenuItem id="events" icon={Calendar} label="Eventos" />
                        <MenuItem id="sustainability" icon={Leaf} label="Sustentabilidade" />
                        <MenuItem id="academy" icon={GraduationCap} label="Academy" />
                        <MenuItem id="analytics" icon={BarChart3} label="Analytics" />
                        <MenuItem id="protection" icon={Shield} label="Proteção" />
                        <MenuItem id="cloud" icon={Cloud} label="Cloud" />
                    </MenuSection>
                    <MenuSection title="Sistema">
                        <MenuItem id="profile" icon={User} label="Perfil & integrações" />
                        <MenuItem id="support" icon={LifeBuoy} label="Suporte Raphaela" />
                        <MenuItem id="logout" icon={LogOut} label="Sair" onClick={() => { resetToLogin(); setMenuOpen(false); }} />
                    </MenuSection>
                </div>
            </aside>
        </div>
      );
  };

  if (bootstrapping) {
    return (
      <AppShell className="font-sans text-white overflow-hidden">
        <SessionBootstrapScreen />
      </AppShell>
    );
  }

  if (!isAuthenticated) {
    if (!introDone) {
      return (
        <AppShell className="font-sans text-white overflow-hidden">
          <IntroScreen
            onComplete={() => {
              sessionStorage.setItem('regenera_intro_done', '1');
              setIntroDone(true);
            }}
          />
        </AppShell>
      );
    }
    return (
      <AppShell className="font-sans text-white overflow-hidden">
        <div className="absolute inset-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <LoginScreen onSessionReady={handleSessionReady} />
        </div>
      </AppShell>
    );
  }

  if (onboardingRequired && accessToken) {
    return (
      <AppShell className="font-sans text-white overflow-hidden">
        <OnboardingScreen
          accessToken={accessToken}
          onComplete={() => void handleOnboardingComplete()}
          onError={(msg) => showFeedback(msg, 'alert')}
          onBackToLogin={resetToLogin}
        />
      </AppShell>
    );
  }

  return (
    <AppShell withCosmic className="font-sans text-white overflow-hidden flex flex-col">
      <div id="main-workspace" className="main-workspace">
      {isAssistantThinking && (
         <div className="absolute top-0 left-0 right-0 h-1 z-[100] bg-cyan-900/30">
            <div className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 w-full animate-[shimmer_1s_infinite_linear]"></div>
         </div>
      )}
      {currentSearchResults.length > 0 && !isAssistantThinking && (
          <div className="absolute bottom-28 left-0 right-0 px-6 z-50 animate-in slide-in-from-bottom">
             <div className="bg-bg-deep/90 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-4 shadow-2xl relative">
                <button onClick={() => setCurrentSearchResults([])} className="absolute -top-2 -right-2 p-2 bg-white rounded-full text-black hover:bg-gray-200 transition-colors shadow-lg touch-manipulation"><X className="w-4 h-4"/></button>
                <SearchResults results={currentSearchResults} />
             </div>
          </div>
      )}
      {showMapWidget && (
          <MapWidget locations={currentMapLocations} onClose={() => setShowMapWidget(false)} />
      )}
      {renderSidebar()}
      {renderAiChat()}
      {lastAiMessage && !showAssistantChat && (
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-[60] w-[80%] max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-500 pointer-events-none">
              <div className="bg-bg-deep/40 backdrop-blur-md border border-white/5 p-4 rounded-2xl shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
                  <p className="text-xs text-gray-300 leading-relaxed font-medium italic">
                      <span className="text-cyan-400 font-bold not-italic mr-2">RAPHAELA:</span>
                      {lastAiMessage}
                  </p>
              </div>
          </div>
      )}
      {notification && (
        <div className={`absolute top-24 left-1/2 -translate-x-1/2 z-[60] backdrop-blur-xl px-6 py-4 rounded-2xl border shadow-2xl animate-slide-up flex items-center gap-3 w-[90%] max-w-sm ${
            notification.type === 'security' ? 'bg-red-950/80 border-red-500/50 shadow-red-900/50' : 
            notification.type === 'alert' ? 'bg-amber-950/80 border-amber-500/50 shadow-amber-900/50' :
            'bg-bg-mid/90 border-cyan-500/50 shadow-cyan-900/50'
        }`}>
            {notification.type === 'security' ? <Shield className="w-6 h-6 text-red-400 animate-pulse" /> : 
             notification.type === 'alert' ? <AlertTriangle className="w-6 h-6 text-amber-400" /> :
             <CheckCircle className="w-6 h-6 text-cyan-400" />}
            <span className="text-sm font-bold text-white tracking-wide">{notification.message}</span>
        </div>
      )}
      <div id="screens-viewport" className="screens-viewport custom-scrollbar">
      {activeModule === 'home' && (
        <div id="view-home" className="screen-transition module-view">
          {renderHeader()}
          <div className="p-6 space-y-8 relative z-10">
            <div id="hero-card" className={`relative rounded-[2rem] p-7 shadow-2xl group transition-all duration-500 ease-out border border-white/10 ${expandHeroCard ? 'h-auto' : 'h-[260px] overflow-hidden'}`}>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-bold tracking-[0.3em] text-cyan-300 uppercase border border-cyan-500/30 px-3 py-1 rounded-full backdrop-blur-md bg-cyan-950/20">Enterprise</span>
                        <div className="p-2 bg-white/5 rounded-full border border-white/5 backdrop-blur-md shadow-inner">
                            <Fingerprint className="text-white/70 w-6 h-6" />
                        </div>
                    </div>
                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                             <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Saldo Global</p>
                             <button onClick={() => setShowBalance(!showBalance)} className="text-gray-500 hover:text-white transition-colors">
                                 {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                             </button>
                        </div>
                        <h2 id="hero-balance-text" className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-gray-400 tracking-tight">
                            {showBalance ? formatBalance(userProfile.balance) : 'R$ ••••••••'}
                        </h2>
                        <p className="text-[10px] text-gray-500 mt-1">
                          Disponível: {showBalance ? formatBalance(userProfile.availableBalance) : '••••••'}
                        </p>
                    </div>
                    {!expandHeroCard && (
                        <div className="flex justify-between items-end border-t border-white/5 pt-4">
                            <div>
                                <p className="font-bold text-white tracking-wide text-sm">{userProfile.name.toUpperCase()}</p>
                                <p className="text-[10px] text-gray-500 tracking-[0.2em] mt-1 font-mono">{userProfile.accountNumber || '···· ----'}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#10b981]"></div>
                                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Online</span>
                            </div>
                        </div>
                    )}
                    <button onClick={() => setExpandHeroCard(!expandHeroCard)} className="absolute bottom-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all active:scale-95 border border-white/5">
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-500 ${expandHeroCard ? 'rotate-180' : ''}`} />
                    </button>
                    {expandHeroCard && (
                        <div className="pt-6 border-t border-white/10 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                    <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Agência</p>
                                    <p className="font-mono text-white text-sm">{userProfile.agency}</p>
                                </div>
                                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                    <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Conta Corrente</p>
                                    <p className="font-mono text-white text-sm">{userProfile.accountNumber}</p>
                                </div>
                            </div>
                            {userProfile.document && (
                              <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">CPF</p>
                                <p className="font-mono text-white text-xs">{userProfile.document}</p>
                              </div>
                            )}
                             <div className="flex justify-between items-center pt-2">
                                <span className="text-[10px] text-gray-500 uppercase">Membro desde</span>
                                <span className="text-[10px] text-white font-bold">{userProfile.memberSince}</span>
                             </div>
                        </div>
                    )}
                </div>
            </div>
            <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-4 ml-1 pl-2 border-l-2 border-primary/50">Acesso Rápido</h3>
                <div className="home-quick-grid grid grid-cols-4 sm:grid-cols-4 gap-3">
                    {[
                        {id: 'pix', label: 'Pix', icon: Zap},
                        {id: 'transfer', label: 'Transf.', icon: Send},
                        {id: 'cards', label: 'Cartões', icon: CreditCard},
                        {id: 'investments', label: 'Invest.', icon: TrendingUp},
                        {id: 'transactions', label: 'Extrato', icon: FileText},
                        {id: 'statement-insights', label: 'Resumo', icon: BrainCircuit},
                        {id: 'rewards', label: 'Rewards', icon: Gift},
                        {id: 'support', label: 'Suporte', icon: LifeBuoy},
                    ].map(action => (
                        <button key={action.id} onClick={() => handleNavigate(action.id as ModuleId)} className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-primary/10 hover:border-primary/30 transition-all active:scale-95 group touch-manipulation backdrop-blur-sm">
                            <action.icon className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
                            <span className="text-[10px] font-bold text-gray-500 group-hover:text-primary tracking-wide">{action.label}</span>
                        </button>
                    ))}
                </div>
            </div>
            <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-4 ml-1 pl-2 border-l-2 border-emerald-500/50">Patrimônio</h3>
                <div className="home-quick-grid grid grid-cols-4 gap-3 mb-8">
                    {[
                        {id: 'savings', label: 'Poupança', icon: PiggyBank},
                        {id: 'loans', label: 'Crédito', icon: DollarSign},
                        {id: 'crypto', label: 'Cripto', icon: Bitcoin},
                        {id: 'marketplace', label: 'Shop', icon: ShoppingBag},
                    ].map(action => (
                        <button key={action.id} onClick={() => handleNavigate(action.id as ModuleId)} className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all active:scale-95 touch-manipulation backdrop-blur-sm">
                            <action.icon className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
                            <span className="text-[10px] font-bold text-gray-500 tracking-wide">{action.label}</span>
                        </button>
                    ))}
                </div>
            </div>
            <div>
                 <div className="flex justify-between items-center mb-4">
                     <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] ml-1 pl-2 border-l-2 border-cyan-500/50">Últimas Transações</h3>
                     <button onClick={() => handleNavigate('transactions')} className="text-[10px] text-primary hover:text-white font-bold uppercase tracking-wider p-2 transition-colors">Ver extrato</button>
                 </div>
                 <div id="home-tx-list" className="space-y-3">
                    {transactions.slice(0, 5).map((t, idx) => (
                        <div key={t.id} className="bg-bg-mid/60 border border-white/5 p-4 rounded-2xl flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer active:scale-[0.98] backdrop-blur-sm" style={{ animationDelay: `${idx * 100}ms` }} onClick={() => handleNavigate('transactions')}>
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border border-white/5 shadow-inner ${t.type === 'inflow' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                    <span className="material-symbols-outlined text-xl">{t.icon}</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-gray-200">{t.title}</h4>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">{t.date} • {t.party}</p>
                                </div>
                            </div>
                            <span className={`font-mono text-sm font-bold ${t.type === 'inflow' ? 'text-emerald-400' : 'text-gray-400'} ${!showBalance ? 'blur-sm select-none' : ''}`}>
                                {t.type === 'inflow' ? '+' : '-'} {Math.abs(t.amount).toLocaleString('pt-BR')}
                            </span>
                        </div>
                    ))}
                 </div>
            </div>
          </div>
        </div>
      )}
      {activeModule === 'pix' && (
          <div className="screen-transition module-view" data-testid="view-pix">
              {renderHeader('Área Pix', true)}
              <PixArea initialAction={moduleProps.initialAction} accessToken={accessToken ?? ''} availableBalance={userProfile.balance} transactions={transactions} onOperationComplete={handleBankingMutation} />
          </div>
      )}
      {activeModule === 'transfer' && (
          <div className="screen-transition module-view" data-testid="view-transfer">
              {renderHeader('Transferências', true)}
              <TransferArea initialAction={moduleProps.initialAction} accessToken={accessToken ?? ''} transactions={transactions} onOperationComplete={handleBankingMutation} />
          </div>
      )}
      {activeModule === 'cards' && (
          <div className="screen-transition module-view">
              {renderHeader('Carteira Digital', true)}
              <CardsModule
                highlightBlock={moduleProps.highlightBlock}
                accessToken={accessToken ?? ''}
              />
          </div>
      )}
      {activeModule === 'transactions' && (
          <div className="screen-transition module-view">
               {renderHeader('Análise de Fluxo', true)}
               <TransactionsModule
                 globalSearchQuery={globalSearchTerm}
                 transactions={transactions}
                 accessToken={accessToken ?? ''}
               />
          </div>
      )}
      {activeModule === 'statement-insights' && (
          <div className="screen-transition module-view">
               {renderHeader('Resumo do extrato', true)}
               <StatementInsights transactions={transactions} onAction={(action, params) => handleSendMessage(`Executar ${action} com ${JSON.stringify(params)}`)} />
          </div>
      )}
      {activeModule === 'investments' && accessToken && (
          <div className="screen-transition module-view">
              {renderHeader('Investimentos', true)}
              <Investments user={userProfile} transactions={transactions} accessToken={accessToken} onNavigate={handleNavigate} />
          </div>
      )}
      {activeModule === 'crypto' && accessToken && (
          <div className="screen-transition module-view">
              {renderHeader('Cripto', true)}
              <CryptoModule user={userProfile} transactions={transactions} accessToken={accessToken} onNavigate={handleNavigate} />
          </div>
      )}
      {activeModule === 'loans' && accessToken && (
          <div className="screen-transition module-view">
              {renderHeader('Crédito', true)}
              <LoansModule user={userProfile} transactions={transactions} accessToken={accessToken} onNavigate={handleNavigate} />
          </div>
      )}
      {activeModule === 'savings' && accessToken && (
          <div className="screen-transition module-view">
              {renderHeader('Poupança', true)}
              <SavingsModule user={userProfile} transactions={transactions} accessToken={accessToken} onNavigate={handleNavigate} />
          </div>
      )}
      {activeModule === 'insurance' && accessToken && (
          <div className="screen-transition module-view">
              {renderHeader('Seguros', true)}
              <InsuranceModule user={userProfile} transactions={transactions} accessToken={accessToken} onNavigate={handleNavigate} />
          </div>
      )}
      {activeModule === 'realizar' && accessToken && (
          <div className="screen-transition module-view">
              {renderHeader('Realizar', true)}
              <DreamVault user={userProfile} transactions={transactions} accessToken={accessToken} onNavigate={handleNavigate} />
          </div>
      )}
      {activeModule === 'marketplace' && accessToken && (
          <div className="screen-transition module-view">
              {renderHeader('Marketplace', true)}
              <Marketplace user={userProfile} transactions={transactions} accessToken={accessToken} onNavigate={handleNavigate} />
          </div>
      )}
      {activeModule === 'rewards' && accessToken && (
          <div className="screen-transition module-view">
              {renderHeader('Rewards', true)}
              <Rewards user={userProfile} transactions={transactions} accessToken={accessToken} onNavigate={handleNavigate} />
          </div>
      )}
      {activeModule === 'travel' && accessToken && (
          <div className="screen-transition module-view">
              {renderHeader('Viagens', true)}
              <TravelConcierge user={userProfile} transactions={transactions} accessToken={accessToken} onNavigate={handleNavigate} />
          </div>
      )}
      {activeModule === 'credit' && accessToken && (
          <div className="screen-transition module-view">
              {renderHeader('Linhas de crédito', true)}
              <CreditModule
                user={userProfile}
                transactions={transactions}
                accessToken={accessToken}
                onNavigate={handleNavigate}
              />
          </div>
      )}
      {activeModule === 'senior' && (
          <div className="screen-transition module-view">
              {renderHeader('Conta Senior', true)}
              <SeniorModule
                user={userProfile}
                transactions={transactions}
                accessToken={accessToken ?? ''}
                onNavigate={handleNavigate}
              />
          </div>
      )}
      {accessToken && resolveLifestyleView(activeModule) && !LIFESTYLE_CUSTOM_MODULES.includes(activeModule) && (
          <div className="screen-transition module-view">
              {renderHeader(resolveLifestyleView(activeModule)!.label, true)}
              <LifestyleModulePanel
                moduleId={resolveLifestyleView(activeModule)!.moduleId}
                moduleLabel={resolveLifestyleView(activeModule)!.label}
                accessToken={accessToken}
                viewTestId={
                  activeModule === 'discounts' || activeModule === 'benefits'
                    ? 'view-discounts'
                    : activeModule === 'pet-savings'
                      ? 'view-pets'
                      : `view-${activeModule}`
                }
              />
          </div>
      )}
      {activeModule === 'profile' && (
          <div className="screen-transition module-view">
              {renderHeader('Perfil', true)}
              <ProfileHub
                user={userProfile}
                accessToken={accessToken ?? undefined}
                assistantSettings={assistantSettings}
                onAssistantSettingsChange={setAssistantSettings}
                onNavigate={handleNavigate}
                onLogout={resetToLogin}
              />
          </div>
      )}
      {activeModule === 'manifesto' && (
          <div className="screen-transition module-view">
              {renderHeader('Manifesto', true)}
              <Manifesto />
          </div>
      )}
      {activeModule === 'support' && accessToken && (
          <div className="screen-transition module-view">
              {renderHeader('Suporte', true)}
              <Support accessToken={accessToken} user={userProfile} />
          </div>
      )}
      </div>
      <footer className="bottom-nav-surface absolute bottom-0 left-0 right-0 backdrop-blur-md border-t flex items-center justify-between z-50 safe-bottom">
        <div className="flex justify-around items-center w-full max-w-4xl mx-auto">
            <button onClick={() => handleNavigate('home')} className={`bottom-nav-item touch-manipulation ${activeModule === 'home' ? 'is-active' : ''}`} aria-label="Início">
                <Home className={`w-5 h-5 ${activeModule === 'home' ? 'fill-current' : ''}`} />
                <span className="text-[9px] font-bold uppercase tracking-wide">Início</span>
            </button>
            <button onClick={() => handleNavigate('transactions')} className={`bottom-nav-item touch-manipulation ${activeModule === 'transactions' ? 'is-active' : ''}`} aria-label="Extrato">
                <FileText className="w-5 h-5" />
                <span className="text-[9px] font-bold uppercase tracking-wide">Extrato</span>
            </button>
            <div className="orbit-dock relative">
                <RaphaelaOrb isListening={isListening} isThinking={isAssistantThinking} isSpeaking={isAssistantSpeaking} onClick={() => setShowAssistantChat(true)} theme={assistantSettings.orbTheme} onThemeCycle={handleThemeCycle} />
                <button onClick={(e) => { e.stopPropagation(); isListening ? stopListening() : startListening(); }} className={`absolute -bottom-2 -right-2 p-2 rounded-full border transition-all duration-500 shadow-xl z-50 ${isListening ? 'bg-red-500 border-red-400 scale-110 shadow-red-500/40' : 'bg-bg-mid border-white/10 hover:bg-white/10'}`}>
                    <Mic className={`w-3 h-3 ${isListening ? 'text-white animate-pulse' : 'text-gray-400'}`} />
                </button>
            </div>
            <button onClick={() => handleNavigate('pix')} className={`bottom-nav-item touch-manipulation ${activeModule === 'pix' ? 'is-active' : ''}`} aria-label="Pix">
                <Zap className="w-5 h-5" />
                <span className="text-[9px] font-bold uppercase tracking-wide">Pix</span>
            </button>
            <button onClick={() => handleNavigate('profile')} className={`bottom-nav-item touch-manipulation ${activeModule === 'profile' ? 'is-active' : ''}`} aria-label="Perfil">
                <User className="w-5 h-5" />
                <span className="text-[9px] font-bold uppercase tracking-wide">Perfil</span>
            </button>
        </div>
      </footer>
      </div>
    </AppShell>
  );
};

export default App;