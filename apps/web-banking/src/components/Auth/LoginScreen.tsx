
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShieldAlert, Fingerprint, WifiOff, RefreshCw, Loader2 } from 'lucide-react';
import {
  BffError,
  checkBffHealth,
  createFirebaseSession,
  confirmPasswordReset,
  createSession,
  fetchPasskeyStatus,
  registerAccount,
  requestPasswordReset,
  RegisterProfile,
  SessionResponse,
} from '../../platform/bff-client';
import {
  isPlatformAuthenticatorAvailable,
  loginWithTouchId,
  registerTouchId,
} from '../../platform/webauthn';
import { formatCep, lookupCep } from '../../platform/address';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';
import { auth } from '../../services/firebase';

interface LoginScreenProps {
  onSessionReady: (session: SessionResponse, message: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onSessionReady }) => {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [forgotStep, setForgotStep] = useState<'request' | 'confirm'>('request');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [document, setDocument] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('SP');
  const [postalCode, setPostalCode] = useState('');
  const [cepError, setCepError] = useState<string | null>(null);
  const cepLookupSeq = useRef(0);
  const [bffOnline, setBffOnline] = useState<boolean | null>(null);
  const [checkingBff, setCheckingBff] = useState(false);
  const [touchIdAvailable, setTouchIdAvailable] = useState(false);
  const [passkeyEnrolled, setPasskeyEnrolled] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [touchIdLoading, setTouchIdLoading] = useState(false);
  const firebaseAuth = useFirebaseAuth();
  const useFirebase = firebaseAuth.enabled;

  const probeBff = useCallback(async () => {
    setCheckingBff(true);
    const ok = await checkBffHealth();
    setBffOnline(ok);
    setCheckingBff(false);
  }, []);

  useEffect(() => {
    void probeBff();
    void isPlatformAuthenticatorAvailable().then(setTouchIdAvailable);
  }, [probeBff]);

  const handleCepChange = (raw: string) => {
    const formatted = formatCep(raw);
    setPostalCode(formatted);
    const digits = formatted.replace(/\D/g, '');
    setCepError(null);
    if (digits.length !== 8) {
      return;
    }
    if (!bffOnline) {
      setCepError('BFF offline — não consulta CEP');
      return;
    }
    const seq = ++cepLookupSeq.current;
    void lookupCep(digits).then((result) => {
      if (seq !== cepLookupSeq.current) {
        return;
      }
      if (!result) {
        setCepError('CEP inválido (Correios/ViaCEP)');
        return;
      }
      setStreet(result.street);
      setNeighborhood(result.neighborhood);
      setCity(result.city);
      setState(result.state);
    });
  };

  useEffect(() => {
    const doc = document.replace(/\D/g, '');
    if (doc.length < 11 || !bffOnline) {
      setPasskeyEnrolled(false);
      return;
    }
    void fetchPasskeyStatus(doc)
      .then((status) => setPasskeyEnrolled(status.enrolled))
      .catch(() => setPasskeyEnrolled(false));
  }, [document, bffOnline]);

  const birthDateReady = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return false;
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return true;
    const br = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    return br ? true : false;
  };

  const normalizeBirthDate = (value: string): string => {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const br = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (br) return `${br[3]}-${br[2]}-${br[1]}`;
    return trimmed;
  };

  const registerReady =
    displayName.trim() &&
    email.trim() &&
    phone.trim() &&
    birthDateReady(birthDate) &&
    street.trim() &&
    number.trim() &&
    neighborhood.trim() &&
    city.trim() &&
    state.trim() &&
    postalCode.replace(/\D/g, '').length === 8;

  const registerBlockers = (): string[] => {
    const missing: string[] = [];
    if (!displayName.trim()) missing.push('nome');
    if (!email.trim()) missing.push('e-mail');
    if (!phone.trim()) missing.push('telefone');
    if (!birthDateReady(birthDate)) missing.push('data de nascimento');
    if (postalCode.replace(/\D/g, '').length !== 8) missing.push('CEP');
    if (!street.trim()) missing.push('rua');
    if (!number.trim()) missing.push('número');
    if (!neighborhood.trim()) missing.push('bairro');
    if (!city.trim()) missing.push('cidade');
    if (!state.trim()) missing.push('UF');
    return missing;
  };

  const passwordReady = () => {
    const pwd = password.trim();
    if (!pwd) return false;
    if (useFirebase && authMode === 'login') {
      return Boolean(email.trim());
    }
    const doc = document.trim();
    if (!doc) return false;
    if (authMode === 'register' && !registerReady) return false;
    return true;
  };

  const touchIdReady = () => {
    const doc = document.trim();
    if (!doc) return false;
    if (authMode === 'login' && passkeyEnrolled) return true;
    const pwd = password.trim();
    if (!pwd) return false;
    if (authMode === 'register' && !registerReady) return false;
    return true;
  };

  const buildRegisterProfile = (): RegisterProfile | null => {
    const doc = document.trim();
    const pwd = password.trim();
    const name = displayName.trim();
    if (!doc || !pwd || !registerReady) return null;
    return {
      document: doc,
      password: pwd,
      displayName: name,
      email: email.trim(),
      phone: phone.trim(),
      birthDate: normalizeBirthDate(birthDate),
      address: {
        street: street.trim(),
        number: number.trim(),
        neighborhood: neighborhood.trim(),
        city: city.trim(),
        state: state.trim(),
        postalCode: postalCode.trim(),
      },
    };
  };

  const ensureBffOnline = async (): Promise<boolean> => {
    if (bffOnline === true) return true;
    setCheckingBff(true);
    const ok = await checkBffHealth();
    setBffOnline(ok);
    setCheckingBff(false);
    return ok;
  };

  const handlePasswordAuth = async () => {
    if (busy) return;

    setAuthError(null);

    const online = await ensureBffOnline();
    if (!online) {
      setAuthError('BFF offline — rode npm run dev:canal-web na raiz do monorepo.');
      return;
    }

    const doc = document.trim();
    const pwd = password.trim();
    if (useFirebase && authMode === 'login') {
      if (!email.trim() || !pwd) {
        setAuthError('Informe e-mail e senha.');
        return;
      }
    } else if (!doc || !pwd) {
      setAuthError('Informe CPF e senha.');
      return;
    }
    if (authMode === 'register') {
      const blockers = registerBlockers();
      if (blockers.length > 0) {
        setAuthError(`Preencha: ${blockers.join(', ')}.`);
        return;
      }
    }

    setPasswordLoading(true);

    try {
      const doc = document.trim();
      const pwd = password.trim();
      let session: SessionResponse;

      if (useFirebase) {
        if (authMode === 'register') {
          const profile = buildRegisterProfile();
          if (!profile) {
            setAuthError('Dados de cadastro incompletos — revise os campos.');
            return;
          }
          session = await firebaseAuth.register(email.trim(), pwd, profile);
        } else {
          session = await firebaseAuth.login(email.trim(), pwd);
        }
        finishFirebaseSession(session);
        return;
      } else if (authMode === 'register') {
        const profile = buildRegisterProfile();
        if (!profile) {
          setAuthError('Dados de cadastro incompletos — revise os campos.');
          return;
        }
        session = await registerAccount(profile);
        if (session.accountStatus === 'ACTIVE') {
          onSessionReady(session, 'Bem-vindo de volta!');
        } else {
          onSessionReady(session, 'Cadastro persistido — conclua o KYC');
        }
      } else {
        session = await createSession(doc, pwd);
        if (session.accountStatus === 'ACTIVE') {
          onSessionReady(session, 'Bem-vindo de volta!');
        } else if (session.kycStatus === 'APPROVED') {
          onSessionReady(session, 'KYC aprovado — abra sua conta');
        } else {
          onSessionReady(session, 'Bem-vindo — continue o cadastro');
        }
      }
    } catch (error) {
      if (
        useFirebase &&
        authMode === 'register' &&
        error instanceof BffError &&
        error.status === 409 &&
        auth?.currentUser
      ) {
        try {
          const idToken = await auth.currentUser.getIdToken();
          const session = await createFirebaseSession(idToken);
          onSessionReady(
            session,
            'Conta Firebase ativa — continue a abertura de conta',
          );
          return;
        } catch {
          setAuthError(
            'CPF já cadastrado — entre com e-mail e senha na aba Entrar.',
          );
          return;
        }
      }
      if (
        useFirebase &&
        authMode === 'register' &&
        (error as { code?: string })?.code === 'auth/email-already-in-use'
      ) {
        setAuthError('E-mail já cadastrado — use a aba Entrar.');
        setAuthMode('login');
        return;
      }
      if (
        !useFirebase &&
        authMode === 'register' &&
        error instanceof BffError &&
        error.status === 409
      ) {
        try {
          const doc = document.trim();
          const pwd = password.trim();
          const session = await createSession(doc, pwd);
          if (session.accountStatus === 'ACTIVE') {
            onSessionReady(session, 'Bem-vindo de volta!');
          } else if (session.kycStatus === 'APPROVED') {
            onSessionReady(session, 'KYC aprovado — abra sua conta');
          } else {
            onSessionReady(
              session,
              'CPF já cadastrado — continue a abertura de conta',
            );
          }
          return;
        } catch {
          setAuthError(
            'CPF já cadastrado — use Entrar com a senha correta ou recupere o acesso.',
          );
          return;
        }
      }
      const message =
        error instanceof Error ? error.message : 'Falha na autenticação';
      setAuthError(message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleTouchId = async () => {
    if (!bffOnline || !touchIdReady() || !touchIdAvailable) return;

    setAuthError(null);
    setTouchIdLoading(true);

    try {
      const doc = document.trim();
      const pwd = password.trim();
      let session: SessionResponse;

      if (authMode === 'register') {
        const profile = buildRegisterProfile();
        if (!profile) return;
        await registerAccount(profile);
      }

      if (passkeyEnrolled) {
        session = await loginWithTouchId(doc);
        onSessionReady(session, 'Touch ID validado — bem-vindo!');
        return;
      }

      session = await registerTouchId(doc, pwd);
      setPasskeyEnrolled(true);
      onSessionReady(session, 'Digital cadastrada no Touch ID deste dispositivo.');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Falha na leitura do Touch ID';
      setAuthError(message);
    } finally {
      setTouchIdLoading(false);
    }
  };

  const finishFirebaseSession = (session: SessionResponse) => {
    if (session.accountStatus === 'ACTIVE') {
      onSessionReady(session, 'Bem-vindo de volta!');
    } else if (session.kycStatus === 'APPROVED') {
      onSessionReady(session, 'KYC aprovado — abra sua conta');
    } else if (authMode === 'register') {
      onSessionReady(session, 'Cadastro persistido — conclua o KYC');
    } else {
      onSessionReady(session, 'Bem-vindo — continue o cadastro');
    }
  };

  const handleGoogleAuth = async () => {
    if (busy || !useFirebase || authMode !== 'login') return;
    setAuthError(null);
    const online = await ensureBffOnline();
    if (!online) {
      setAuthError('BFF offline — rode npm run dev:canal-web na raiz do monorepo.');
      return;
    }
    setPasswordLoading(true);
    try {
      const session = await firebaseAuth.loginWithGoogle();
      finishFirebaseSession(session);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Falha no login com Google';
      if (message !== 'Login com Google cancelado.') {
        setAuthError(message);
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handlePasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void handlePasswordAuth();
    }
  };

  const handleForgotRequest = async () => {
    if (busy) return;
    setAuthError(null);
    setResetMessage(null);
    const online = await ensureBffOnline();
    if (!online) {
      setAuthError('BFF offline — rode npm run dev:canal-web na raiz do monorepo.');
      return;
    }
    setPasswordLoading(true);
    try {
      if (useFirebase) {
        if (!email.trim()) {
          setAuthError('Informe o e-mail cadastrado.');
          return;
        }
        const result = await firebaseAuth.requestPasswordReset(email.trim());
        setResetMessage(result.message);
        setForgotStep('confirm');
      } else {
        if (!document.trim()) {
          setAuthError('Informe o CPF cadastrado.');
          return;
        }
        const result = await requestPasswordReset(document.trim());
        setResetMessage(result.message);
        if (result.devToken) {
          setResetToken(result.devToken);
        }
        setForgotStep('confirm');
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Falha ao solicitar recuperação';
      setAuthError(message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleForgotConfirm = async () => {
    if (busy || useFirebase) return;
    setAuthError(null);
    const online = await ensureBffOnline();
    if (!online) {
      setAuthError('BFF offline — rode npm run dev:canal-web na raiz do monorepo.');
      return;
    }
    if (!resetToken.trim() || !newPassword.trim()) {
      setAuthError('Informe o token e a nova senha.');
      return;
    }
    if (newPassword.trim().length < 8) {
      setAuthError('Nova senha deve ter no mínimo 8 caracteres.');
      return;
    }
    setPasswordLoading(true);
    try {
      await confirmPasswordReset(resetToken.trim(), newPassword.trim());
      setAuthMode('login');
      setForgotStep('request');
      setResetToken('');
      setNewPassword('');
      setPassword('');
      setResetMessage('Senha alterada — entre com a nova senha.');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Falha ao redefinir senha';
      setAuthError(message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const busy = passwordLoading || touchIdLoading || checkingBff;
  const formReady = passwordReady();
  const canSubmitPassword = bffOnline !== false && formReady && !busy;
  const canSubmitTouchId = bffOnline !== false && touchIdReady() && !busy;

  return (
    <div id="screen-login" className="absolute inset-0 z-50 bg-bg-deep flex flex-col items-center justify-center overflow-hidden font-sans safe-top safe-bottom px-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary-dark/20 via-bg-deep to-bg-deep z-0"></div>

        <div className="absolute inset-0 opacity-20 pointer-events-none z-10"
             style={{
                 backgroundImage: 'linear-gradient(rgba(34, 211, 238, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 238, 0.2) 1px, transparent 1px)',
                 backgroundSize: '60px 60px',
             }}>
        </div>

        <div className="relative z-30 flex flex-col items-center w-full max-w-sm">
            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-700 w-full px-4">
                <div className="relative w-56 h-56 mb-8 flex items-center justify-center">
                    <div className="absolute inset-0 border border-cyan-500/10 rounded-full animate-ping [animation-duration:3s]"></div>
                    <div className="absolute inset-2 border border-dashed border-cyan-500/30 rounded-full animate-[spin_20s_linear_infinite]"></div>
                    <div className="absolute inset-6 border border-cyan-500/10 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-cyan-400 rounded-tl-lg shadow-[0_0_8px_rgba(34,211,238,0.3)]"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-cyan-400 rounded-tr-lg shadow-[0_0_8px_rgba(34,211,238,0.3)]"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-cyan-400 rounded-bl-lg shadow-[0_0_8px_rgba(34,211,238,0.3)]"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-cyan-400 rounded-br-lg shadow-[0_0_8px_rgba(34,211,238,0.3)]"></div>
                    <div className="relative z-10 text-cyan-400 p-5 bg-cyan-500/5 rounded-full border border-cyan-500/20">
                      <Fingerprint className="w-14 h-14" />
                    </div>
                </div>

                <h1 className="text-xl font-extrabold tracking-[0.2em] text-white uppercase text-center mb-1">
                  REGENERA <span className="text-cyan-400 font-light">BANK</span>
                </h1>
                <p className="text-[8px] font-mono text-gray-500 uppercase tracking-[0.3em] mb-6">
                  {bffOnline === false
                    ? 'BFF OFFLINE'
                    : useFirebase
                      ? 'FIREBASE AUTH — E-MAIL E SENHA'
                      : touchIdAvailable && passkeyEnrolled
                        ? 'DIGITAL CADASTRADA — TOQUE O SENSOR'
                        : touchIdAvailable
                          ? 'SENHA OU TOUCH ID (WEBAUTHN)'
                          : 'ENTRE COM CPF E SENHA'}
                </p>

                {authMode !== 'forgot' && (
                <div className="flex gap-2 mb-4 w-full">
                    <button type="button" onClick={() => setAuthMode('login')} className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${authMode === 'login' ? 'bg-primary/20 border-primary text-primary' : 'border-white/10 text-gray-500'}`}>Entrar</button>
                    <button type="button" onClick={() => setAuthMode('register')} className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${authMode === 'register' ? 'bg-primary/20 border-primary text-primary' : 'border-white/10 text-gray-500'}`}>Criar conta</button>
                </div>
                )}

                <div className="w-full space-y-3 mb-6 max-h-[52vh] overflow-y-auto pr-1">
                    {authMode === 'forgot' && forgotStep === 'request' && (
                      <>
                        {useFirebase ? (
                          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail cadastrado" type="email" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-primary/50 outline-none" />
                        ) : (
                          <input value={document} onChange={(e) => setDocument(e.target.value)} placeholder="CPF cadastrado" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-primary/50 outline-none" />
                        )}
                      </>
                    )}
                    {authMode === 'forgot' && forgotStep === 'confirm' && !useFirebase && (
                      <>
                        {resetMessage && (
                          <p className="text-[10px] text-cyan-300/90 leading-relaxed">{resetMessage}</p>
                        )}
                        <input value={resetToken} onChange={(e) => setResetToken(e.target.value)} placeholder="Token de recuperação" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-primary/50 outline-none" />
                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nova senha (mín. 8)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-primary/50 outline-none" />
                      </>
                    )}
                    {authMode === 'forgot' && forgotStep === 'confirm' && useFirebase && resetMessage && (
                      <p className="text-[10px] text-cyan-300/90 leading-relaxed">{resetMessage}</p>
                    )}
                    {authMode === 'register' && (
                      <>
                        <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Nome completo" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-primary/50 outline-none" />
                        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" type="email" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-primary/50 outline-none" />
                        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Telefone (DDD + número)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-primary/50 outline-none" />
                        <input value={birthDate} onChange={(e) => setBirthDate(e.target.value)} placeholder="Data de nascimento (AAAA-MM-DD)" type="date" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-primary/50 outline-none [color-scheme:dark]" />

                        <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-primary/80 pt-1">Endereço</p>
                        <input
                          value={postalCode}
                          onChange={(e) => handleCepChange(e.target.value)}
                          placeholder="CEP"
                          inputMode="numeric"
                          maxLength={9}
                          className="w-full bg-white/5 border border-primary/30 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-primary/60 outline-none"
                        />
                        {cepError && (
                          <p className="text-[10px] text-red-400/90 -mt-1">{cepError}</p>
                        )}
                        <input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Rua / Avenida" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-primary/50 outline-none" />
                        <div className="flex gap-2">
                          <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Nº" className="w-24 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-primary/50 outline-none" />
                          <input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Bairro" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-primary/50 outline-none" />
                        </div>
                        <div className="flex gap-2">
                          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Cidade" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-primary/50 outline-none" />
                          <input value={state} onChange={(e) => setState(e.target.value)} placeholder="UF" maxLength={2} className="w-16 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-primary/50 outline-none uppercase" />
                        </div>
                      </>
                    )}
                    {authMode !== 'forgot' && (!useFirebase || authMode === 'register') && (
                      <input value={document} onChange={(e) => setDocument(e.target.value)} placeholder="CPF" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-primary/50 outline-none" />
                    )}
                    {authMode !== 'forgot' && useFirebase && authMode === 'login' && (
                      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" type="email" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-primary/50 outline-none" />
                    )}
                    {authMode !== 'forgot' && (
                      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={handlePasswordKeyDown} placeholder="Senha" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-primary/50 outline-none" />
                    )}
                </div>

                {authMode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('forgot');
                      setForgotStep('request');
                      setAuthError(null);
                      setResetMessage(null);
                    }}
                    className="w-full mb-4 text-[9px] uppercase tracking-widest text-gray-500 hover:text-cyan-400 transition-colors"
                  >
                    Esqueci minha senha
                  </button>
                )}

                {authError && (
                  <p className="w-full text-center text-xs text-red-400 mb-3">{authError}</p>
                )}

                {bffOnline === false && (
                  <div className="w-full mb-4 p-4 rounded-2xl border border-amber-500/30 bg-amber-950/30 flex flex-col items-center gap-3">
                    <WifiOff className="w-5 h-5 text-amber-400" />
                    <p className="text-xs text-amber-200 text-center">
                      BFF offline — rode npm run dev:canal-web na raiz do monorepo.
                    </p>
                    <button
                      type="button"
                      onClick={() => void probeBff()}
                      disabled={checkingBff}
                      className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-amber-300 hover:text-white"
                    >
                      <RefreshCw className={`w-3 h-3 ${checkingBff ? 'animate-spin' : ''}`} />
                      Tentar novamente
                    </button>
                  </div>
                )}

                {authMode === 'forgot' ? (
                  <button
                    type="button"
                    onClick={() =>
                      void (forgotStep === 'request'
                        ? handleForgotRequest()
                        : handleForgotConfirm())
                    }
                    disabled={busy || bffOnline === false}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold uppercase tracking-widest text-[9px] shadow-[0_0_15px_rgba(34,211,238,0.25)] active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    {(passwordLoading || checkingBff) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {forgotStep === 'request'
                      ? 'Solicitar recuperação'
                      : useFirebase
                        ? 'Verifique seu e-mail'
                        : 'Definir nova senha'}
                  </button>
                ) : (
                <button
                  type="button"
                  onClick={() => void handlePasswordAuth()}
                  disabled={busy}
                  aria-disabled={!canSubmitPassword}
                  className={`w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold uppercase tracking-widest text-[9px] shadow-[0_0_15px_rgba(34,211,238,0.25)] active:scale-[0.98] transition-transform flex items-center justify-center gap-2 ${!canSubmitPassword ? 'opacity-40' : ''}`}
                >
                  {(passwordLoading || checkingBff) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {authMode === 'register' ? 'Criar conta com senha' : 'Entrar com senha'}
                </button>
                )}

                {authMode === 'forgot' && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setForgotStep('request');
                      setAuthError(null);
                    }}
                    className="w-full mt-3 py-2 text-[9px] uppercase tracking-widest text-gray-500 hover:text-white"
                  >
                    Voltar ao login
                  </button>
                )}

                {useFirebase && authMode === 'login' && (
                  <button
                    type="button"
                    onClick={() => void handleGoogleAuth()}
                    disabled={busy || bffOnline === false}
                    className="w-full mt-3 py-3 rounded-xl bg-white text-gray-900 font-bold uppercase tracking-widest text-[9px] hover:bg-gray-100 active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {passwordLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <span className="text-base leading-none">G</span>
                    )}
                    Entrar com Google
                  </button>
                )}

                {touchIdAvailable && !useFirebase && (
                  <button
                    type="button"
                    onClick={() => void handleTouchId()}
                    disabled={!canSubmitTouchId}
                    className="w-full mt-3 py-3 rounded-xl bg-white/5 border border-cyan-500/30 text-cyan-300 font-bold uppercase tracking-widest text-[9px] hover:bg-white/10 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
                  >
                    {touchIdLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Fingerprint className="w-3.5 h-3.5" />
                    )}
                    {passkeyEnrolled
                      ? 'Entrar com Touch ID'
                      : 'Cadastrar digital (Touch ID)'}
                  </button>
                )}

                {touchIdAvailable && !useFirebase && (
                  <p className="text-[9px] text-gray-500 text-center mt-3 leading-relaxed">
                    Touch ID usa WebAuthn (passkey) no autenticador deste dispositivo.
                  </p>
                )}
            </div>
        </div>

        <div className="absolute bottom-8 text-center animate-in slide-in-from-bottom-4 fade-in duration-1000 delay-500 z-30 pointer-events-none">
             <div className="flex items-center justify-center gap-2 text-white/30 mb-2">
                <ShieldAlert className="w-4 h-4" />
                <span className="text-[9px] uppercase tracking-[0.3em]">Ambiente Seguro</span>
             </div>
             <p className="text-[10px] text-gray-500 font-mono">Regenera Bank — canal web + BFF real</p>
        </div>
    </div>
  );
};

export default LoginScreen;