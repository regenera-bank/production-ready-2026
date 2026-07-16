
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useState } from 'react';
import {
  User, Settings, Shield, Bell, LogOut, LifeBuoy, ChevronRight, Mic2, Sparkles,
  Palette, Fingerprint, Send, Loader2, Activity, CheckCircle, XCircle,
} from 'lucide-react';
import type { ModuleId, UserProfile, AssistantSettings, OrbTheme, ChatMessage } from '../../types';
import { chatWithRaphaela } from '../../services/raphaelaChatService';
import {
  acceptConsent,
  fetchBffIntegrations,
  fetchConsentStatus,
  revokeConsent,
  sendTelegramViaBff,
  type BffIntegrationsHealth,
  type ConsentRecordDto,
} from '../../platform/bff-client';

interface ProfileHubProps {
    user: UserProfile;
    accessToken?: string;
    assistantSettings?: AssistantSettings;
    onAssistantSettingsChange?: (s: AssistantSettings) => void;
    onNavigate?: (module: ModuleId) => void;
    onLogout?: () => void;
}

// --- PROFILE HUB ---
const INTEGRATION_LABELS: Record<string, string> = {
  firebase: 'Firebase Auth',
  kycHomolog: 'KYC homolog',
  datavalid: 'DataValid',
  vision: 'Google Vision OCR',
  pep: 'Lista PEP',
  webauthn: 'WebAuthn / Passkey',
};

export const ProfileHub: React.FC<ProfileHubProps> = ({
  user,
  accessToken,
  assistantSettings,
  onAssistantSettingsChange,
  onNavigate,
  onLogout,
}) => {
    const [integrations, setIntegrations] = useState<BffIntegrationsHealth | null>(null);
    const [telegramStatus, setTelegramStatus] = useState<string | null>(null);
    const [telegramLoading, setTelegramLoading] = useState(false);
    const [consents, setConsents] = useState<ConsentRecordDto[]>([]);
    const [consentLoading, setConsentLoading] = useState(false);

    useEffect(() => {
      void fetchBffIntegrations().then(setIntegrations);
    }, []);

    useEffect(() => {
      if (!accessToken) return;
      void fetchConsentStatus(accessToken)
        .then((r) => setConsents(r.items ?? []))
        .catch(() => setConsents([]));
    }, [accessToken]);

    const [consentError, setConsentError] = useState<string | null>(null);
    const [copied, setCopied] = useState<string | null>(null);

    const mutateConsent = async (type: string, action: 'accept' | 'revoke') => {
      if (!accessToken) return;
      setConsentLoading(true);
      setConsentError(null);
      try {
        if (action === 'accept') {
          await acceptConsent(accessToken, type);
        } else {
          await revokeConsent(accessToken, type);
        }
        const refreshed = await fetchConsentStatus(accessToken);
        setConsents(refreshed.items ?? []);
      } catch (error) {
        setConsentError(
          error instanceof Error ? error.message : 'Falha ao atualizar consentimento',
        );
      } finally {
        setConsentLoading(false);
      }
    };
    const handleAcceptConsent = (type: string) => mutateConsent(type, 'accept');

    const copyValue = (label: string, value?: string) => {
      if (!value || value === '—') return;
      void navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied((prev) => (prev === label ? null : prev)), 2000);
    };

    const MenuItem = ({ icon: Icon, label, value, onClick }: any) => (
        <button
          type="button"
          onClick={onClick}
          className="w-full text-left flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl mb-3 hover:bg-white/10 transition-colors cursor-pointer group hover:border-primary/30"
        >
            <div className="flex items-center gap-4">
                <div className="p-2.5 bg-white/5 rounded-xl group-hover:bg-primary/20 transition-colors border border-white/5 group-hover:border-primary/30">
                    <Icon className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                </div>
                <span className="font-bold text-white text-sm tracking-wide">{label}</span>
            </div>
            <div className="flex items-center gap-2">
                {value && (
                  <span className="text-xs text-gray-500 font-medium bg-black/20 px-2 py-1 rounded-lg">
                    {copied === label ? 'Copiado!' : value}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
            </div>
        </button>
    );

    const testTelegram = async () => {
      if (!accessToken) return;
      setTelegramLoading(true);
      setTelegramStatus(null);
      try {
        const result = await sendTelegramViaBff(
          accessToken,
          `Alerta teste Regenera — ${user.name} — saldo ${user.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
        );
        setTelegramStatus(result.ok ? 'Telegram enviado via BFF' : result.detail ?? 'Falha no envio');
      } catch (error) {
        setTelegramStatus(error instanceof Error ? error.message : 'Telegram indisponível no BFF');
      } finally {
        setTelegramLoading(false);
      }
    };

    const VoiceSelector = () => (
        <div className="p-5 bg-white/5 border border-white/5 rounded-2xl mb-4">
            <div className="flex items-center gap-2 mb-4">
                <Mic2 className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">Voz da Raphaela</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {['Kore', 'Fenrir', 'Puck', 'Zephyr', 'Charon'].map(v => (
                    <button
                        key={v}
                        onClick={() => onAssistantSettingsChange?.({ ...assistantSettings!, voice: v })}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${assistantSettings?.voice === v ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'bg-white/5 border-transparent text-gray-400 hover:text-white hover:bg-white/10'}`}
                    >
                        {v}
                    </button>
                ))}
            </div>
        </div>
    );

    const StyleSelector = () => (
        <div className="p-5 bg-white/5 border border-white/5 rounded-2xl mb-4">
            <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">Personalidade</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
                {[
                    { id: 'formal', label: 'Formal' },
                    { id: 'casual', label: 'Casual' },
                    { id: 'concise', label: 'Direta' }
                ].map(s => (
                    <button
                        key={s.id}
                        onClick={() => onAssistantSettingsChange?.({ ...assistantSettings!, style: s.id as any })}
                        className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${assistantSettings?.style === s.id ? 'bg-purple-500/20 border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'bg-white/5 border-transparent text-gray-400 hover:text-white hover:bg-white/10'}`}
                    >
                        {s.label}
                    </button>
                ))}
            </div>
        </div>
    );

    const OrbSelector = () => (
        <div className="p-5 bg-white/5 border border-white/5 rounded-2xl mb-4">
            <div className="flex items-center gap-2 mb-4">
                <Palette className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">Tema Visual</span>
            </div>
            <div className="grid grid-cols-5 gap-3">
                {(['cyan', 'purple', 'emerald', 'amber', 'crimson'] as OrbTheme[]).map(c => (
                    <button
                        key={c}
                        onClick={() => onAssistantSettingsChange?.({ ...assistantSettings!, orbTheme: c })}
                        className={`h-10 rounded-xl transition-all border-2 relative overflow-hidden group ${assistantSettings?.orbTheme === c ? 'border-white scale-105 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'}`}
                        style={{ backgroundColor: c === 'cyan' ? '#22d3ee' : c === 'purple' ? '#a855f7' : c === 'emerald' ? '#10b981' : c === 'amber' ? '#f59e0b' : '#f43f5e' }}
                    >
                         {assistantSettings?.orbTheme === c && <div className="absolute inset-0 bg-white/30 animate-pulse"></div>}
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="p-6 animate-in slide-in-from-bottom duration-500 pb-32" data-testid="view-profile">
            <div className="flex flex-col items-center mb-10 pt-4">
                <div className="relative group cursor-pointer">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-cyan-400 p-[3px] mb-4 relative shadow-[0_0_40px_rgba(34,211,238,0.4)] group-hover:scale-105 transition-transform duration-500">
                        <div className="w-full h-full rounded-full bg-bg-mid flex items-center justify-center overflow-hidden relative">
                             <div className="absolute inset-0 bg-black/20"></div>
                            <User className="w-16 h-16 text-white relative z-10" strokeWidth={1.5} />
                        </div>
                    </div>
                    <div className="absolute bottom-4 right-2 p-2.5 bg-emerald-500 rounded-full border-4 border-bg-deep z-10 shadow-lg">
                        <Fingerprint className="w-4 h-4 text-white" />
                    </div>
                </div>
                
                <h2 className="text-2xl font-bold text-white tracking-tight">{user.name}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-3 justify-center">
                    <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full uppercase tracking-widest">
                      Conta corrente
                    </span>
                    {user.document && (
                      <span className="text-[10px] text-gray-400 font-mono border border-white/10 px-2 py-1 rounded-full">
                        CPF {user.document}
                      </span>
                    )}
                </div>
                <p className="text-xs text-gray-500 mt-4 text-center">
                  Saldo ledger: {user.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  {' · '}Disponível: {user.availableBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
            </div>

            <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-4 pl-1">Personalização AI</h3>
                {assistantSettings && (
                    <>
                        <VoiceSelector />
                        <StyleSelector />
                        <OrbSelector />
                    </>
                )}
            </div>
            
            <div className="mt-8">
                 <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-4 pl-1">Integrações BFF</h3>
                 <div className="bg-white/5 border border-white/5 rounded-2xl p-5 mb-4 space-y-3">
                     <div className="flex items-center justify-between">
                       <span className="text-xs text-gray-400 flex items-center gap-2">
                         <Activity className="w-4 h-4 text-cyan-400" />
                         Status KYC / Auth
                       </span>
                       <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full border ${
                         integrations?.ready
                           ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                           : 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                       }`}>
                         {integrations?.ready ? 'Pronto' : 'Parcial'}
                       </span>
                     </div>
                     {integrations ? (
                       <div className="grid grid-cols-1 gap-2">
                         {Object.entries(integrations.integrations).map(([key, ok]) => (
                           <div key={key} className="flex items-center justify-between text-xs py-2 border-b border-white/5 last:border-0">
                             <span className="text-gray-300">{INTEGRATION_LABELS[key] ?? key}</span>
                             {ok ? (
                               <CheckCircle className="w-4 h-4 text-emerald-400" />
                             ) : (
                               <XCircle className="w-4 h-4 text-red-400" />
                             )}
                           </div>
                         ))}
                       </div>
                     ) : (
                       <p className="text-xs text-gray-500">BFF offline — rode npm run dev:canal-web</p>
                     )}
                     <button
                       type="button"
                       disabled={!accessToken || telegramLoading}
                       onClick={() => void testTelegram()}
                       className="w-full py-3 mt-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-300 hover:text-white hover:border-cyan-500/30 disabled:opacity-40 flex items-center justify-center gap-2"
                     >
                       {telegramLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                       Testar Telegram (env BFF)
                     </button>
                     {telegramStatus && (
                       <p className="text-[10px] text-gray-400 text-center">{telegramStatus}</p>
                     )}
                     <button
                       type="button"
                       onClick={() => onNavigate?.('support')}
                       className="w-full py-3 bg-cyan-600/20 border border-cyan-500/30 rounded-xl text-xs font-bold uppercase tracking-widest text-cyan-300 hover:bg-cyan-600/30"
                     >
                       Abrir suporte Raphaela
                     </button>
                 </div>
            </div>

            <div className="mt-8">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-4 pl-1">Consentimentos LGPD</h3>
                <div className="bg-white/5 border border-white/5 rounded-2xl p-5 mb-4 space-y-3" data-testid="consent-panel">
                  {consents.length === 0 ? (
                    <p className="text-xs text-gray-500">Nenhum consentimento registrado no BFF.</p>
                  ) : (
                    consents.map((c) => (
                      <div key={c.type} className="flex items-center justify-between text-xs py-2 border-b border-white/5 last:border-0">
                        <span className="text-gray-300 uppercase tracking-wide">{c.type}</span>
                        {c.acceptedAt && !c.revokedAt ? (
                          <span className="flex items-center gap-2">
                            <span className="text-emerald-400 font-bold">Aceito</span>
                            <button
                              type="button"
                              disabled={consentLoading}
                              onClick={() => void mutateConsent(c.type, 'revoke')}
                              className="px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-[10px] font-bold uppercase disabled:opacity-50"
                            >
                              Revogar
                            </button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={consentLoading}
                            onClick={() => void handleAcceptConsent(c.type)}
                            className="px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[10px] font-bold uppercase disabled:opacity-50"
                          >
                            Aceitar
                          </button>
                        )}
                      </div>
                    ))
                  )}
                  {consentError && (
                    <p className="text-[10px] text-red-400 text-center">{consentError}</p>
                  )}
                </div>
            </div>

            <div className="mt-8">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-4 pl-1">Conta & Segurança</h3>
                <MenuItem icon={User} label="Agência" value={user.agency ?? '—'} onClick={() => copyValue('Agência', user.agency)} />
                <MenuItem icon={Shield} label="Conta" value={user.accountNumber ?? '—'} onClick={() => copyValue('Conta', user.accountNumber)} />
                <MenuItem icon={Settings} label="Disponível" value={user.availableBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} onClick={() => onNavigate?.('transactions')} />
            </div>

            <div className="mt-8">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-4 pl-1">Preferências</h3>
                <MenuItem
                  icon={Bell}
                  label="Notificações"
                  value={integrations?.integrations?.telegram ? 'Telegram ativo' : 'Testar Telegram'}
                  onClick={() => void testTelegram()}
                />
            </div>

            <button
              type="button"
              onClick={() => onLogout?.()}
              className="w-full mt-12 py-5 border border-red-500/20 bg-red-500/5 rounded-2xl text-red-400 text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-red-500/10 transition-all hover:scale-[1.02] shadow-lg shadow-red-900/10"
            >
                <LogOut className="w-5 h-5" /> Encerrar Sessão
            </button>
        </div>
    );
};

interface SupportProps {
  accessToken: string;
  user: UserProfile;
}

// --- Suporte ---
export const Support: React.FC<SupportProps> = ({ accessToken, user }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'assistant',
      text: `Olá, ${user.name || 'cliente'}. Sou a Raphaela — suporte digital com sessão autenticada. Como posso ajudar?`,
      timestamp: Date.now(),
    },
  ]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    const text = draft.trim();
    if (!text || loading) return;
    setDraft('');
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    try {
      const context = `SUPORTE | Cliente: ${user.name} | Saldo: ${user.balance} | Conta: ${user.accountNumber ?? '—'}`;
      const response = await chatWithRaphaela(text, context, { voice: 'Kore', style: 'formal', orbTheme: 'cyan', telegramToken: '', telegramChatId: '', googleCloudToken: '' }, accessToken);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: response.text,
          timestamp: Date.now(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: 'assistant',
          text: 'Falha ao contatar o BFF. Verifique configuração do BFF e a sessão.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 h-[80vh] flex flex-col pb-32 animate-in slide-in-from-right duration-500">
      <div className="bg-gradient-to-br from-bg-mid to-bg-deep border border-white/10 rounded-[2rem] p-6 text-center mb-4">
        <LifeBuoy className="w-10 h-10 text-primary mx-auto mb-2" />
        <h2 className="text-xl font-bold text-white">Suporte Raphaela</h2>
        <p className="text-[10px] text-primary/70 uppercase tracking-widest font-bold mt-1">
          Atendimento com sessão autenticada
        </p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar mb-4 p-2">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary/20 border border-primary/30 text-white rounded-tr-sm'
                  : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-sm'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
              <span className="text-xs text-gray-400">Processando...</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void send()}
          placeholder="Descreva sua solicitação..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-400/50"
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={loading || !draft.trim()}
          className="px-4 py-3 bg-primary rounded-xl text-white disabled:opacity-40"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};