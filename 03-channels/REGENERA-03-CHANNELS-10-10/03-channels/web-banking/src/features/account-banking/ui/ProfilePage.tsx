
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/foundation/store';
import { CardGlass } from '@/design-system/CardGlass';
import { Button } from '@/design-system/Button';
import { ArrowLeft, User, ShieldCheck, CreditCard, LogOut, ChevronRight, Camera, Save, X } from 'lucide-react';
import { api } from '@/platform/http/client';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, setUser, showToast } = useStore();

  const [section, setSection] = useState<'menu' | 'dados-pessoais'>('menu');

  // Form states for real editing (connected to store + backend)
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // AI Prefs real (save to backend, use in Neural)
  const [voice, setVoice] = useState(user?.prefs?.voice || 'Kora');
  const [personality, setPersonality] = useState(user?.prefs?.personality || 'FORMAL');
  const [themeColor, setThemeColor] = useState(user?.prefs?.theme || 'cyan');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep form in sync if user hydrates/changes externally (e.g. after /auth/me)
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user?.name, user?.email, user?.phone]);

  const initials = (user?.name || 'DP').split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase();

  const currentAvatar = photoPreview || user?.photoURL || null;

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Selecione uma imagem válida', 'alert');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setPhotoPreview(dataUrl); // live preview in UI
      setAvatarBase64(dataUrl); // will send to backend (data URL accepted)
    };
    reader.readAsDataURL(file);
  };

  const triggerPhotoPicker = () => {
    fileInputRef.current?.click();
  };

  const clearPhotoSelection = () => {
    setPhotoPreview(null);
    setAvatarBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const payload: any = {};
      if (name.trim() && name !== user.name) payload.name = name.trim();
      if (email.trim() && email !== user.email) payload.email = email.trim();
      if (phone !== (user.phone || '')) payload.phone = phone.trim();
      if (avatarBase64) payload.avatarBase64 = avatarBase64;
      payload.prefs = { voice, personality, theme: themeColor }; // real save for Neural use

      if (Object.keys(payload).length === 0) {
        showToast('Nenhuma alteração para salvar', 'success');
        setSection('menu');
        return;
      }

      // REAL call: PATCH /auth/me with IdToken (auto via client middleware), Firebase-backed update
      const updatedUser = await api
        .url('/auth/me')
        .patch(payload)
        .json<any>();

      // Update global store (connected to App hydration, Home, Layout, etc.)
      setUser(updatedUser);

      // Clear local edit state
      setPhotoPreview(null);
      setAvatarBase64(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      showToast('Dados pessoais atualizados com sucesso', 'success');

      // Optional: re-sync from authoritative /auth/me (in case backend enriches)
      try {
        const fresh = await api.url('/auth/me').get().json<any>();
        setUser(fresh);
      } catch {}

      setSection('menu');
    } catch (err: any) {
      const msg = err?.message || err?.json?.message || 'Erro ao atualizar perfil. Tente novamente.';
      showToast(msg, 'alert');
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    // reset to store values
    setName(user?.name || '');
    setEmail(user?.email || '');
    setPhone(user?.phone || '');
    clearPhotoSelection();
    setSection('menu');
  };

  const menuItems = [
    { icon: User, label: 'Dados Pessoais', desc: 'Atualize suas informações', action: () => setSection('dados-pessoais') },
    { icon: CreditCard, label: 'Limites e Cartões', desc: 'Gerencie seus gastos', action: () => showToast('Em breve: integração com cartões via backend', 'success') },
    { icon: ShieldCheck, label: 'Privacidade e Segurança', desc: 'Senhas e biometria', action: () => navigate('/security') }
  ];

  return (
    <div className="min-h-screen p-6 pb-32">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="glass" size="icon" onClick={() => section === 'dados-pessoais' ? cancelEdit() : navigate('/home')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-sm font-bold uppercase tracking-widest text-white">
          {section === 'dados-pessoais' ? 'Dados Pessoais' : 'Perfil'}
        </h1>
      </div>

      {/* Avatar + identity header (always visible, updates live with photoPreview) */}
      <div className="flex flex-col items-center mb-8">
        <div 
          onClick={section === 'dados-pessoais' ? triggerPhotoPicker : undefined}
          className={`w-28 h-28 rounded-[32px] overflow-hidden border border-white/20 shadow-neon-cyan mb-6 flex items-center justify-center bg-gradient-to-br from-neural-cyan to-blue-600 relative ${section === 'dados-pessoais' ? 'cursor-pointer group' : ''}`}
        >
          {currentAvatar ? (
            <img 
              src={currentAvatar} 
              alt="Foto de perfil" 
              className="w-full h-full object-cover" 
            />
          ) : (
            <span className="text-4xl font-black text-white tracking-tighter">{initials}</span>
          )}
          {section === 'dados-pessoais' && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
              <Camera className="w-8 h-8 text-white" />
            </div>
          )}
        </div>
        <h2 className="text-3xl font-light tracking-tight">{name || user?.name || 'Don Paulo'}</h2>
        <div className="flex items-center gap-2 mt-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-emerald-400">ID: {user?.neuralId || '2098233287'}</span>
        </div>
        {section === 'dados-pessoais' && (
          <button 
            onClick={triggerPhotoPicker} 
            className="mt-3 text-[10px] text-cyan-400 flex items-center gap-1 hover:underline"
          >
            <Camera className="w-3 h-3" /> Alterar foto do perfil
          </button>
        )}
        <input 
          ref={fileInputRef} 
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={handlePhotoSelect} 
        />
      </div>

      {/* Perfil AI prefs real: salvar no backend, usar no Neural (context/TTS) */}
      <div className="mx-5 mb-6 bg-[#0d1526] border border-white/5 rounded-2xl p-5">
        <p className="text-[9px] text-cyan-400 uppercase font-black tracking-widest mb-3">Personalização AI (salva real)</p>
        <div className="space-y-3 text-sm">
          <div>
            <span className="text-[10px] text-gray-500">Voz da Raphaela</span>
            <div className="flex gap-2 mt-1">
              {['Kora','Fenrir','Puck','Zephyr','Charon'].map(v => (
                <button key={v} onClick={() => setVoice(v)} className={`px-3 py-1 rounded-full text-xs ${voice===v ? 'bg-cyan-500 text-black' : 'bg-white/10'}`}>{v}</button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-[10px] text-gray-500">Personalidade</span>
            <div className="flex gap-2 mt-1">
              {['FORMAL','CASUAL','DIRETA'].map(p => (
                <button key={p} onClick={() => setPersonality(p)} className={`px-3 py-1 rounded-full text-xs ${personality===p ? 'bg-purple-500 text-white' : 'bg-white/10'}`}>{p}</button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-[10px] text-gray-500">Tema Visual</span>
            <div className="flex gap-2 mt-1">
              {['cyan','purple','emerald','amber','rose'].map(c => (
                <button key={c} onClick={() => setThemeColor(c)} className={`w-6 h-6 rounded-full border ${themeColor===c ? 'border-white scale-110' : 'border-white/30'}`} style={{background: c==='cyan'?'#00f0ff':c==='purple'?'#7000ff':c==='emerald'?'#10b981':c==='amber'?'#f59e0b':'#f43f5e'}} />
              ))}
            </div>
          </div>
          <button onClick={() => { /* prefs saved on any save, or trigger save */ handleSaveProfile(); }} className="text-[10px] text-cyan-400 mt-2">Salvar prefs no motor Neural</button>
        </div>
      </div>

      {section === 'menu' && (
        <>
          <CardGlass className="p-2 mb-8">
            {menuItems.map((item, idx) => (
              <button 
                key={idx}
                onClick={item.action}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 rounded-2xl transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-neural-cyan/10 transition-colors">
                    <item.icon className="w-5 h-5 text-gray-400 group-hover:text-neural-cyan" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm text-gray-200 group-hover:text-white">{item.label}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">{item.desc}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
              </button>
            ))}
          </CardGlass>

          <Button 
            variant="danger" 
            className="w-full" 
            leftIcon={<LogOut className="w-4 h-4" />}
            onClick={logout}
          >
            Encerrar Sessão Segura
          </Button>
        </>
      )}

      {section === 'dados-pessoais' && (
        <div className="space-y-6">
          <CardGlass className="p-6">
            <h3 className="text-sm font-bold uppercase tracking-widest mb-4 text-cyan-400">Editar Informações Básicas</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Nome completo</label>
                <input 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="w-full bg-[#0a0f1e] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-cyan-500/50 outline-none"
                  placeholder="Seu nome completo"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Email</label>
                <input 
                  type="email"
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className="w-full bg-[#0a0f1e] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-cyan-500/50 outline-none"
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Telefone</label>
                <input 
                  type="tel"
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  className="w-full bg-[#0a0f1e] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-cyan-500/50 outline-none"
                  placeholder="+55 (11) 99999-0000"
                />
              </div>

              {avatarBase64 && (
                <div className="flex items-center justify-between bg-white/5 rounded-xl p-3 text-sm">
                  <span className="text-emerald-400">Nova foto selecionada (pronta para envio)</span>
                  <button onClick={clearPhotoSelection} className="text-red-400 flex items-center gap-1 text-xs">
                    <X className="w-3 h-3" /> Remover
                  </button>
                </div>
              )}
            </div>
          </CardGlass>

          <div className="flex gap-3">
            <Button 
              variant="glass" 
              className="flex-1" 
              onClick={cancelEdit}
              leftIcon={<X className="w-4 h-4" />}
            >
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              className="flex-1" 
              onClick={handleSaveProfile}
              disabled={saving}
              leftIcon={saving ? undefined : <Save className="w-4 h-4" />}
            >
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>

          <p className="text-[10px] text-gray-500 text-center">
            As alterações são salvas de forma segura no Firebase Auth via backend (PATCH /auth/me com IdToken fresco).
          </p>
        </div>
      )}

      {section === 'menu' && (
        <p className="text-center text-[10px] text-gray-600 font-mono uppercase mt-8">
          Regenera Enterprise v4.0 · Compilação 842.1
        </p>
      )}
    </div>
  );
};
