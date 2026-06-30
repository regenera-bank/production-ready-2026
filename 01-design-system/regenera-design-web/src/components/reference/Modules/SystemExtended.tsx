
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { User, Settings, Shield, Bell, Eye, LogOut, LifeBuoy, MessageSquare, Phone, ChevronRight, Mic2, Sparkles, Palette, Fingerprint, Cloud, Send, Key } from 'lucide-react';
import { UserProfile, AiSettings, OrbTheme } from '../../types';

interface ProfileHubProps {
    user: UserProfile;
    aiSettings?: AiSettings;
    onAiSettingsChange?: (s: AiSettings) => void;
}

// --- PROFILE HUB ---
export const ProfileHub: React.FC<ProfileHubProps> = ({ user, aiSettings, onAiSettingsChange }) => {
    const MenuItem = ({ icon: Icon, label, value }: any) => (
        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl mb-3 hover:bg-white/10 transition-colors cursor-pointer group hover:border-primary/30">
            <div className="flex items-center gap-4">
                <div className="p-2.5 bg-white/5 rounded-xl group-hover:bg-primary/20 transition-colors border border-white/5 group-hover:border-primary/30">
                    <Icon className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                </div>
                <span className="font-bold text-white text-sm tracking-wide">{label}</span>
            </div>
            <div className="flex items-center gap-2">
                {value && <span className="text-xs text-gray-500 font-medium bg-black/20 px-2 py-1 rounded-lg">{value}</span>}
                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
            </div>
        </div>
    );

    const IntegrationInput = ({ icon: Icon, label, field, placeholder }: { icon: any, label: string, field: keyof AiSettings, placeholder: string }) => (
        <div className="mb-4">
             <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                 <Icon className="w-3 h-3" /> {label}
             </label>
             <input 
                 type="text" 
                 value={aiSettings?.[field] as string || ''}
                 onChange={(e) => onAiSettingsChange?.({ ...aiSettings!, [field]: e.target.value })}
                 placeholder={placeholder}
                 className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-600 focus:border-cyan-500 outline-none font-mono"
             />
        </div>
    );

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
                        onClick={() => onAiSettingsChange?.({ ...aiSettings!, voice: v })}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${aiSettings?.voice === v ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'bg-white/5 border-transparent text-gray-400 hover:text-white hover:bg-white/10'}`}
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
                        onClick={() => onAiSettingsChange?.({ ...aiSettings!, style: s.id as any })}
                        className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${aiSettings?.style === s.id ? 'bg-purple-500/20 border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'bg-white/5 border-transparent text-gray-400 hover:text-white hover:bg-white/10'}`}
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
                        onClick={() => onAiSettingsChange?.({ ...aiSettings!, orbTheme: c })}
                        className={`h-10 rounded-xl transition-all border-2 relative overflow-hidden group ${aiSettings?.orbTheme === c ? 'border-white scale-105 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'}`}
                        style={{ backgroundColor: c === 'cyan' ? '#22d3ee' : c === 'purple' ? '#a855f7' : c === 'emerald' ? '#10b981' : c === 'amber' ? '#f59e0b' : '#f43f5e' }}
                    >
                         {aiSettings?.orbTheme === c && <div className="absolute inset-0 bg-white/30 animate-pulse"></div>}
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="p-6 animate-in slide-in-from-bottom duration-500 pb-32">
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
                <div className="flex items-center gap-3 mt-3">
                    <span className="text-[10px] font-bold bg-primary/10 text-primary border border-primary/30 px-3 py-1 rounded-full uppercase tracking-widest shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                        {user.accountType}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono border border-white/10 px-2 py-1 rounded-full">ID: 8492-AF</span>
                </div>
            </div>

            <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-4 pl-1">Personalização AI</h3>
                {aiSettings && (
                    <>
                        <VoiceSelector />
                        <StyleSelector />
                        <OrbSelector />
                    </>
                )}
            </div>
            
            <div className="mt-8">
                 <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-4 pl-1">Integrações Reais (Real-World API)</h3>
                 <div className="bg-white/5 border border-white/5 rounded-2xl p-5 mb-4">
                     <IntegrationInput icon={Send} label="Telegram Bot Token" field="telegramToken" placeholder="Ex: 123456:ABC-DEF..." />
                     <IntegrationInput icon={MessageSquare} label="Chat ID (Telegram)" field="telegramChatId" placeholder="Ex: 123456789" />
                     <IntegrationInput icon={Cloud} label="Google Cloud Access Token" field="googleCloudToken" placeholder="Ex: ya29.a0..." />
                     <p className="text-[9px] text-gray-500 mt-2 flex items-center gap-1">
                         <Key className="w-3 h-3" /> Chaves armazenadas apenas na sessão atual (Secure Memory).
                     </p>
                 </div>
            </div>

            <div className="mt-8">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-4 pl-1">Conta & Segurança</h3>
                <MenuItem icon={User} label="Dados Pessoais" />
                <MenuItem icon={Shield} label="Biometria & Senhas" value="Face ID Ativo" />
                <MenuItem icon={Settings} label="Limites Pix" value="R$ 150k" />
                <MenuItem icon={Eye} label="Open Finance" value="3 Conexões" />
            </div>

            <div className="mt-8">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-4 pl-1">Preferências</h3>
                <MenuItem icon={Bell} label="Notificações" value="Tudo Ativo" />
            </div>

            <button className="w-full mt-12 py-5 border border-red-500/20 bg-red-500/5 rounded-2xl text-red-400 text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-red-500/10 transition-all hover:scale-[1.02] shadow-lg shadow-red-900/10">
                <LogOut className="w-5 h-5" /> Encerrar Sessão
            </button>
        </div>
    );
};

// --- SUPPORT PREMIUM ---
export const Support: React.FC = () => {
    return (
        <div className="p-6 h-[80vh] flex flex-col pb-32 animate-in slide-in-from-right duration-500">
             <div className="bg-gradient-to-br from-bg-mid to-bg-deep border border-white/10 rounded-[2rem] p-8 text-center mb-6 shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
                 <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                     <LifeBuoy className="w-10 h-10 text-primary animate-pulse" />
                 </div>
                 <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Regenera Concierge</h2>
                 <p className="text-xs text-primary/60 font-bold uppercase tracking-widest">Atendimento Exclusivo 24/7</p>
             </div>

             <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar mb-6 p-2">
                 <div className="flex justify-start">
                     <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm p-5 max-w-[85%] backdrop-blur-sm">
                         <p className="text-sm text-gray-200 leading-relaxed">Olá, Don Paulo. Sou o Gerente Digital da sua conta Enterprise. Como posso auxiliar hoje?</p>
                         <span className="text-[10px] text-gray-500 mt-2 block font-bold">10:42</span>
                     </div>
                 </div>
                 <div className="flex justify-end">
                     <div className="bg-gradient-to-br from-primary to-blue-600 text-white rounded-2xl rounded-tr-sm p-5 max-w-[85%] shadow-lg shadow-primary/20">
                         <p className="text-sm font-medium">Preciso aumentar meu limite do cartão Black.</p>
                         <span className="text-[10px] text-white/60 mt-2 block font-bold text-right">10:43</span>
                     </div>
                 </div>
                 <div className="flex justify-start">
                     <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm p-5 max-w-[85%] backdrop-blur-sm">
                         <p className="text-sm text-gray-200 leading-relaxed">Com certeza. Analisando seu perfil de investimentos atual, já liberei um pré-aprovado de +R$ 50.000. Deseja confirmar?</p>
                         <span className="text-[10px] text-gray-500 mt-2 block font-bold">10:43</span>
                     </div>
                 </div>
             </div>

             <div className="flex gap-3">
                 <button className="flex-[2] py-4 bg-primary hover:bg-primary-dark rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/30 uppercase tracking-widest hover:scale-[1.02]">
                     <MessageSquare className="w-5 h-5" /> Iniciar Chat
                 </button>
                 <button className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all hover:border-white/20">
                     <Phone className="w-5 h-5" />
                 </button>
             </div>
        </div>
    );
};
