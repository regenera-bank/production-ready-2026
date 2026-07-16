
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ShieldAlert,
  Fingerprint,
  WifiOff,
  RefreshCw,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import {
  BffError,
  checkBffHealth,
  fetchBffIntegrations,
  type BffIntegrationsHealth,
  confirmPasswordReset,
  createFirebaseSession,
  createSession,
  fetchPasskeyStatus,
  registerAccount,
  RegisterProfile,
  requestPasswordReset,
  SessionResponse,
} from '../../platform/bff-client';
import {
  isPlatformAuthenticatorAvailable,
  loginWithTouchId,
  registerTouchId,
} from '../../platform/webauthn';
import { formatCep, lookupCep } from '../../platform/address';
import {
  cpfDigits,
  formatCpf,
  formatPhone,
  passwordStrength,
} from '../../platform/document';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';
import { auth, isFirebaseConfigured } from '../../services/firebase';
import { signOut } from 'firebase/auth';
import AuthField from './AuthField';
import AuthSuccessOverlay from './AuthSuccessOverlay';
import RegeneraAuthHero, { RegeneraTrustStrip } from './RegeneraAuthHero';
import {
  preferredWebEntryUrl,
  webAuthnOriginWarning,
} from '../../platform/web-origin';

const LAST_CPF_KEY = 'regenera_last_cpf';
const SUCCESS_MS = 720;

interface LoginScreenProps {
  onSessionReady: (session: SessionResponse, message: string) => void;
}

const isDev = import.meta.env.DEV;

const LoginScreen: React.FC<LoginScreenProps> = ({ onSessionReady }) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const webAuthnBlocked = webAuthnOriginWarning();
  const [registerStep, setRegisterStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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
  const [bffIntegrations, setBffIntegrations] = useState<BffIntegrationsHealth | null>(null);
  const [checkingBff, setCheckingBff] = useState(false);
  const [touchIdAvailable, setTouchIdAvailable] = useState(false);
  const [passkeyEnrolled, setPasskeyEnrolled] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [touchIdLoading, setTouchIdLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetDevToken, setResetDevToken] = useState<string | null>(null);
  const [resetTokenInput, setResetTokenInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const firebaseAuth = useFirebaseAuth();
  const diditKyc = bffIntegrations?.kycProvider === 'didit';
  const useFirebase = firebaseAuth.enabled && !diditKyc;
  const registerStepsTotal = diditKyc ? 1 : 3;
  const pwdStrength = passwordStrength(password);

  const completeSession = useCallback(
    (session: SessionResponse, message: string) => {
      setSuccessMessage(message);
      try {
        localStorage.setItem(LAST_CPF_KEY, cpfDigits(document));
      } catch {
        /* quota ou modo privado */
      }
      window.setTimeout(() => onSessionReady(session, message), SUCCESS_MS);
    },
    [document, onSessionReady],
  );

  const probeBff = useCallback(async () => {
    setCheckingBff(true);
    const ok = await checkBffHealth();
    setBffOnline(ok);
    if (ok) {
      const integrations = await fetchBffIntegrations();
      setBffIntegrations(integrations);
    } else {
      setBffIntegrations(null);
    }
    setCheckingBff(false);
  }, []);

  useEffect(() => {
    void probeBff();
    if (webAuthnBlocked) {
      setTouchIdAvailable(false);
    } else {
      void isPlatformAuthenticatorAvailable().then(setTouchIdAvailable);
    }
    try {
      const saved = localStorage.getItem(LAST_CPF_KEY);
      if (saved && saved.length === 11) {
        setDocument(formatCpf(saved));
      }
    } catch {
      /* storage indisponível */
    }
  }, [probeBff]);

  useEffect(() => {
    if (!diditKyc || !isFirebaseConfigured() || !auth) {
      return;
    }
    void signOut(auth);
  }, [diditKyc]);

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
    void lookupCep(digits)
      .then((result) => {
        if (seq !== cepLookupSeq.current) {
          return;
        }
        if (!result) {
          setCepError('CEP não encontrado');
          return;
        }
        setStreet(result.street);
        setNeighborhood(result.neighborhood);
        setCity(result.city);
        setState(result.state);
      })
      .catch((err: unknown) => {
        if (seq !== cepLookupSeq.current) {
          return;
        }
        setCepError(
          err instanceof BffError
            ? err.message
            : 'Serviço de CEP indisponível — verifique o BFF',
        );
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

  const docReady = cpfDigits(document).length === 11;

  const registerReady = diditKyc
    ? docReady &&
      password.trim().length >= 8 &&
      displayName.trim().length >= 2 &&
      email.trim().includes('@') &&
      phone.replace(/\D/g, '').length >= 10
    : Boolean(
        displayName.trim() &&
          email.trim() &&
          phone.trim() &&
          birthDateReady(birthDate) &&
          street.trim() &&
          number.trim() &&
          neighborhood.trim() &&
          city.trim() &&
          state.trim() &&
          postalCode.replace(/\D/g, '').length === 8,
      );

  const registerBlockers = (): string[] => {
    const missing: string[] = [];
    if (diditKyc) {
      if (!displayName.trim()) missing.push('nome completo');
      if (!docReady) missing.push('CPF válido');
      if (!email.trim().includes('@')) missing.push('e-mail');
      if (phone.replace(/\D/g, '').length < 10) missing.push('telefone');
      if (password.trim().length < 8) missing.push('senha (mín. 8 caracteres)');
      return missing;
    }
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
    const doc = cpfDigits(document);
    if (doc.length !== 11) return false;
    if (authMode === 'register' && !registerReady) return false;
    return true;
  };

  const touchIdReady = () => {
    const doc = cpfDigits(document);
    if (doc.length !== 11) return false;
    if (authMode === 'login' && passkeyEnrolled) return true;
    const pwd = password.trim();
    if (!pwd) return false;
    if (authMode === 'register' && !registerReady) return false;
    return true;
  };

  const buildRegisterProfile = (): RegisterProfile | null => {
    const doc = cpfDigits(document);
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
      setAuthError(
        isDev
          ? 'BFF offline — rode npm run dev:canal-web na raiz do monorepo.'
          : 'Serviço indisponível no momento. Tente novamente em instantes.',
      );
      return;
    }

    const doc = cpfDigits(document);
    const pwd = password.trim();
    if (useFirebase && authMode === 'login') {
      if (!email.trim() || !pwd) {
        setAuthError('Informe e-mail e senha.');
        return;
      }
    } else if (doc.length !== 11 || !pwd) {
      setAuthError('Informe CPF válido e senha.');
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
      const doc = cpfDigits(document);
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
        if (diditKyc) {
          session = await registerAccount({
            document: doc,
            password: pwd,
            displayName: displayName.trim() || undefined,
            email: email.trim() || undefined,
            phone: phone.trim() || undefined,
          });
          completeSession(session, 'Conta criada — verificação na sequência');
        } else {
          const profile = buildRegisterProfile();
          if (!profile) {
            setAuthError('Dados de cadastro incompletos — revise os campos.');
            return;
          }
          session = await registerAccount(profile);
          if (session.accountStatus === 'ACTIVE') {
            completeSession(session, 'Bem-vindo de volta!');
          } else {
            completeSession(session, 'Cadastro persistido — conclua o KYC');
          }
        }
      } else {
        session = await createSession(doc, pwd);
        if (session.accountStatus === 'ACTIVE') {
          completeSession(session, 'Bem-vindo de volta!');
        } else if (session.kycStatus === 'APPROVED') {
          completeSession(session, 'KYC aprovado — abra sua conta');
        } else {
          completeSession(session, 'Bem-vindo — continue o cadastro');
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
          completeSession(session, 'Conta Firebase ativa — continue a abertura de conta');
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
          const doc = cpfDigits(document);
          const pwd = password.trim();
          const session = await createSession(doc, pwd);
          if (session.accountStatus === 'ACTIVE') {
            completeSession(session, 'Bem-vindo de volta!');
          } else if (session.kycStatus === 'APPROVED') {
            completeSession(session, 'KYC aprovado — abra sua conta');
          } else {
            completeSession(session, 'CPF já cadastrado — continue a abertura de conta');
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
      const doc = cpfDigits(document);
      const pwd = password.trim();
      let session: SessionResponse;

      if (authMode === 'register') {
        const profile = buildRegisterProfile();
        if (!profile) return;
        await registerAccount(profile);
      }

      if (passkeyEnrolled) {
        session = await loginWithTouchId(doc);
        completeSession(session, 'Touch ID validado — bem-vindo!');
        return;
      }

      session = await registerTouchId(doc, pwd);
      setPasskeyEnrolled(true);
      completeSession(session, 'Digital cadastrada neste dispositivo');
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
      completeSession(session, 'Bem-vindo de volta!');
    } else if (session.kycStatus === 'APPROVED') {
      completeSession(session, 'KYC aprovado — abra sua conta');
    } else if (authMode === 'register') {
      completeSession(session, 'Cadastro persistido — conclua o KYC');
    } else {
      completeSession(session, 'Bem-vindo — continue o cadastro');
    }
  };

  const handleGoogleAuth = async () => {
    if (busy || !useFirebase || authMode !== 'login') return;
    setAuthError(null);
    const online = await ensureBffOnline();
    if (!online) {
      setAuthError(
        isDev
          ? 'BFF offline — rode npm run dev:canal-web na raiz do monorepo.'
          : 'Serviço indisponível no momento. Tente novamente em instantes.',
      );
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

  const closeForgot = () => {
    setForgotOpen(false);
    setResetMessage(null);
    setResetDevToken(null);
    setResetTokenInput('');
    setNewPassword('');
    setAuthError(null);
  };

  const handleForgotRequest = async () => {
    setAuthError(null);
    setResetMessage(null);
    setResetDevToken(null);
    setPasswordLoading(true);
    try {
      if (useFirebase) {
        if (!email.trim()) {
          setAuthError('Informe o e-mail cadastrado.');
          return;
        }
        const result = await firebaseAuth.requestPasswordReset(email);
        setResetMessage(result.message);
      } else {
        if (cpfDigits(document).length !== 11) {
          setAuthError('Informe o CPF cadastrado.');
          return;
        }
        const result = await requestPasswordReset(cpfDigits(document));
        setResetMessage(result.message);
        if (result.devToken) {
          setResetDevToken(result.devToken);
          setResetTokenInput(result.devToken);
        }
      }
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : 'Falha ao solicitar recuperação',
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleForgotConfirm = async () => {
    setAuthError(null);
    setPasswordLoading(true);
    try {
      const token = resetTokenInput.trim();
      const pwd = newPassword.trim();
      if (!token || !pwd) {
        setAuthError('Token e nova senha são obrigatórios.');
        return;
      }
      await confirmPasswordReset(token, pwd);
      setResetMessage('Senha alterada. Entre com a nova senha.');
      setResetDevToken(null);
      setResetTokenInput('');
      setNewPassword('');
      setPassword('');
      setForgotOpen(false);
    } catch (error) {
      setAuthError(
        error instanceof BffError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Falha ao confirmar nova senha',
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const busy = passwordLoading || touchIdLoading || checkingBff || Boolean(successMessage);
  const scanning = passwordLoading || touchIdLoading;
  const formReady = passwordReady();
  const onCredentialsStep =
    authMode === 'login' || diditKyc || registerStep === registerStepsTotal - 1;
  const canSubmitPassword =
    bffOnline !== false && formReady && !busy && onCredentialsStep;
  const canSubmitTouchId = bffOnline !== false && touchIdReady() && !busy;

  const loginStatus = () => {
    if (checkingBff) return 'Verificando conexão segura…';
    if (bffOnline === false) return 'Serviço temporariamente indisponível';
    if (scanning) return 'Autenticando identidade…';
    if (authMode === 'register') {
      return diditKyc ? 'Cadastro rápido — verificação na sequência' : 'Complete seus dados para abrir conta';
    }
    if (webAuthnBlocked) return 'Biometria web indisponível nesta URL';
    if (touchIdAvailable && passkeyEnrolled) return 'Touch ID cadastrado — use o botão abaixo';
    if (touchIdAvailable) return 'Entre com senha uma vez para cadastrar Touch ID';
    if (useFirebase) return 'Entre com e-mail, senha ou Google';
    return 'Aguardando identificação';
  };

  const handleBiometricTap = () => {
    if (!canSubmitTouchId) {
      if (!docReady) {
        setAuthError('Informe seu CPF antes da biometria.');
      } else if (!passkeyEnrolled && !password.trim()) {
        setAuthError('Cadastre Touch ID: informe a senha e use o botão abaixo.');
      }
      return;
    }
    void handleTouchId();
  };

  const connectionLabel = () => {
    if (checkingBff) return 'Verificando canal…';
    if (bffOnline === false) return 'Canal indisponível';
    return 'Conexão segura ativa';
  };

  const switchAuthMode = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setRegisterStep(0);
    setAuthError(null);
    setForgotOpen(false);
  };

  const personalStepReady = () =>
    Boolean(
      displayName.trim() &&
        email.trim() &&
        phone.replace(/\D/g, '').length >= 10 &&
        birthDateReady(birthDate),
    );

  const addressStepReady = () =>
    Boolean(
      postalCode.replace(/\D/g, '').length === 8 &&
        street.trim() &&
        number.trim() &&
        neighborhood.trim() &&
        city.trim() &&
        state.trim(),
    );

  const advanceRegisterStep = () => {
    setAuthError(null);
    if (diditKyc) return;
    if (registerStep === 0 && !personalStepReady()) {
      setAuthError('Complete nome, e-mail, telefone e data de nascimento.');
      return;
    }
    if (registerStep === 1 && !addressStepReady()) {
      setAuthError('Complete o endereço com CEP válido.');
      return;
    }
    setRegisterStep((prev) => Math.min(prev + 1, registerStepsTotal - 1));
  };

  const registerStepLabel = () => {
    if (diditKyc) return 'Credenciais';
    if (registerStep === 0) return 'Dados pessoais';
    if (registerStep === 1) return 'Endereço';
    return 'Credenciais';
  };

  const strengthLabel = ['', 'Fraca', 'Razoável', 'Boa', 'Forte'][pwdStrength];

  return (
    <div id="screen-login" className="absolute inset-0 z-50 bg-bg-deep flex flex-col items-center justify-center overflow-hidden font-sans safe-top safe-bottom px-4">
        {successMessage && <AuthSuccessOverlay message={successMessage} />}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none z-10"
          style={{
            backgroundImage:
              'linear-gradient(rgba(34, 211, 238, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 238, 0.1) 1px, transparent 1px)',
            backgroundSize: '25px 25px',
          }}
        />

        <div className="absolute top-[max(2rem,env(safe-area-inset-top))] left-1/2 -translate-x-1/2 z-40 bg-slate-900/60 backdrop-blur-md border border-white/5 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
          <div
            className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_#38bdf8] ${
              bffOnline === false ? 'bg-amber-500' : 'bg-sky-500 animate-pulse'
            }`}
          />
          <span className="text-[8px] uppercase tracking-[0.25em] text-gray-400 font-bold">
            {connectionLabel()}
          </span>
        </div>

        <div className="relative z-30 flex flex-col items-center w-full max-w-[590px]">
            <div className="regenera-login-card flex flex-col items-center animate-in fade-in zoom-in duration-700 w-full">
                <RegeneraAuthHero
                  scanning={scanning}
                  showBiometric={touchIdAvailable && authMode === 'login' && !webAuthnBlocked}
                  onBiometricTap={handleBiometricTap}
                  biometricDisabled={busy || !touchIdAvailable}
                />

                <p id="login-status" className="text-[9px] font-mono text-gray-500 uppercase tracking-[0.28em] mb-3 text-center min-h-[1rem]">
                  {loginStatus()}
                </p>

                <RegeneraTrustStrip />

                {webAuthnBlocked && (
                  <div className="w-full mb-4 p-3 rounded-xl border border-amber-500/30 bg-amber-950/20 text-center space-y-2">
                    <p className="text-[10px] text-amber-200 leading-relaxed">{webAuthnBlocked}</p>
                    <a
                      href={preferredWebEntryUrl()}
                      className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-cyan-300 hover:text-white"
                    >
                      Abrir em localhost
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                <div className="flex gap-2 mb-4 w-full" role="tablist" aria-label="Fluxo inicial">
                    <button type="button" role="tab" aria-selected={authMode === 'login'} onClick={() => switchAuthMode('login')} className={`regenera-auth-tab flex-1 ${authMode === 'login' ? 'active' : ''}`}>Acessar conta</button>
                    <button type="button" role="tab" aria-selected={authMode === 'register'} onClick={() => switchAuthMode('register')} className={`regenera-auth-tab flex-1 ${authMode === 'register' ? 'active' : ''}`}>Abrir conta</button>
                </div>

                <div className="w-full space-y-3 mb-6 max-h-[42vh] overflow-y-auto pr-1 rounded-2xl border border-white/5 bg-white/[0.02] p-3 backdrop-blur-sm">
                    {authMode === 'register' && registerStepsTotal > 1 && (
                      <div className="mb-1">
                        <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.2em] text-gray-500 mb-2">
                          <span>{registerStepLabel()}</span>
                          <span>
                            {registerStep + 1}/{registerStepsTotal}
                          </span>
                        </div>
                        <div className="flex gap-1.5">
                          {Array.from({ length: registerStepsTotal }).map((_, idx) => (
                            <div
                              key={idx}
                              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                idx <= registerStep ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.45)]' : 'bg-white/10'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {authMode === 'register' && diditKyc && (
                      <>
                        <AuthField value={displayName} onChange={setDisplayName} placeholder="Nome completo | Razão Social" autoComplete="name" />
                        <AuthField value={email} onChange={setEmail} placeholder="E-mail" type="email" autoComplete="email" />
                        <AuthField
                          value={phone}
                          onChange={(v) => setPhone(formatPhone(v))}
                          placeholder="Telefone"
                          inputMode="tel"
                          autoComplete="tel"
                        />
                        <p className="text-[10px] text-gray-400 leading-relaxed px-1">
                          Documento e selfie na verificação Didit em seguida — captura única, sem repetir.
                        </p>
                      </>
                    )}

                    {authMode === 'register' && !diditKyc && registerStep === 0 && (
                      <>
                        <AuthField value={displayName} onChange={setDisplayName} placeholder="Nome completo" autoComplete="name" />
                        <AuthField value={email} onChange={setEmail} placeholder="E-mail" type="email" autoComplete="email" />
                        <AuthField
                          value={phone}
                          onChange={(v) => setPhone(formatPhone(v))}
                          placeholder="Telefone"
                          inputMode="tel"
                          autoComplete="tel"
                        />
                        <AuthField value={birthDate} onChange={setBirthDate} placeholder="Data de nascimento" type="date" />
                      </>
                    )}

                    {authMode === 'register' && !diditKyc && registerStep === 1 && (
                      <>
                        <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-primary/80">Endereço</p>
                        <AuthField
                          value={postalCode}
                          onChange={handleCepChange}
                          placeholder="CEP"
                          inputMode="numeric"
                          maxLength={9}
                        />
                        {cepError && <p className="text-[10px] text-red-400/90 -mt-1">{cepError}</p>}
                        <AuthField value={street} onChange={setStreet} placeholder="Rua / Avenida" />
                        <div className="flex gap-2">
                          <AuthField value={number} onChange={setNumber} placeholder="Nº" className="w-24 shrink-0" />
                          <AuthField value={neighborhood} onChange={setNeighborhood} placeholder="Bairro" className="flex-1" />
                        </div>
                        <div className="flex gap-2">
                          <AuthField value={city} onChange={setCity} placeholder="Cidade" className="flex-1" />
                          <AuthField
                            value={state}
                            onChange={(v) => setState(v.toUpperCase().slice(0, 2))}
                            placeholder="UF"
                            maxLength={2}
                            className="w-16 shrink-0"
                          />
                        </div>
                      </>
                    )}

                    {(authMode === 'login' || authMode === 'register') &&
                      (authMode === 'login' || diditKyc || registerStep === registerStepsTotal - 1) && (
                      <>
                        {(!useFirebase || authMode === 'register') && (
                          <AuthField
                            value={document}
                            onChange={(v) => setDocument(formatCpf(v))}
                            placeholder="CPF"
                            inputMode="numeric"
                            autoComplete="username"
                          />
                        )}
                        {useFirebase && authMode === 'login' && (
                          <AuthField value={email} onChange={setEmail} placeholder="E-mail" type="email" autoComplete="email" />
                        )}
                        <AuthField
                          value={password}
                          onChange={setPassword}
                          placeholder="Senha"
                          type="password"
                          showToggle
                          revealed={showPassword}
                          onToggleReveal={() => setShowPassword((v) => !v)}
                          onKeyDown={handlePasswordKeyDown}
                          autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
                        />
                        {authMode === 'register' && password.trim().length > 0 && (
                          <div className="px-1">
                            <div className="flex gap-1 mb-1">
                              {[1, 2, 3, 4].map((level) => (
                                <div
                                  key={level}
                                  className={`h-1 flex-1 rounded-full transition-colors ${
                                    pwdStrength >= level ? 'bg-cyan-400' : 'bg-white/10'
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-[9px] text-gray-500 uppercase tracking-wider">
                              Força da senha: {strengthLabel}
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    {authMode === 'register' && !diditKyc && registerStep < registerStepsTotal - 1 && (
                      <div className="flex gap-2 pt-1">
                        {registerStep > 0 && (
                          <button
                            type="button"
                            onClick={() => setRegisterStep((s) => Math.max(0, s - 1))}
                            className="flex-1 py-3 rounded-xl border border-white/10 text-[9px] text-gray-400 uppercase tracking-widest"
                          >
                            Voltar
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={advanceRegisterStep}
                          className="flex-1 py-3 rounded-xl bg-white/10 border border-cyan-500/30 text-cyan-200 font-bold uppercase tracking-widest text-[9px]"
                        >
                          Continuar
                        </button>
                      </div>
                    )}
                    {authMode === 'login' && !forgotOpen && (
                      <button
                        type="button"
                        onClick={() => {
                          setForgotOpen(true);
                          setAuthError(null);
                          setResetMessage(null);
                        }}
                        className="w-full text-right text-[10px] text-cyan-400/80 hover:text-cyan-300 uppercase tracking-widest"
                      >
                        Esqueci minha senha
                      </button>
                    )}
                    {authMode === 'login' && forgotOpen && (
                      <div className="p-4 rounded-2xl border border-cyan-500/20 bg-cyan-950/20 space-y-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-300">
                          Recuperar senha
                        </p>
                        {useFirebase ? (
                          <p className="text-[10px] text-gray-400">
                            Enviaremos um link para o e-mail informado acima.
                          </p>
                        ) : (
                          <p className="text-[10px] text-gray-400">
                            Informe o CPF acima. Em homolog, o token aparece abaixo para teste.
                          </p>
                        )}
                        {resetMessage && (
                          <p className="text-xs text-emerald-300">{resetMessage}</p>
                        )}
                        {!useFirebase && (resetDevToken || resetMessage) && (
                          <>
                            <input
                              value={resetTokenInput}
                              onChange={(e) => setResetTokenInput(e.target.value)}
                              placeholder="Token de recuperação"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-primary/50 outline-none"
                            />
                            <input
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Nova senha"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-primary/50 outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => void handleForgotConfirm()}
                              disabled={busy}
                              className="w-full py-3 rounded-xl bg-emerald-600/80 text-white font-bold uppercase tracking-widest text-[9px] disabled:opacity-40"
                            >
                              Confirmar nova senha
                            </button>
                          </>
                        )}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => void handleForgotRequest()}
                            disabled={busy || bffOnline === false}
                            className="flex-1 py-3 rounded-xl bg-cyan-600/80 text-white font-bold uppercase tracking-widest text-[9px] disabled:opacity-40"
                          >
                            {useFirebase ? 'Enviar link' : 'Solicitar token'}
                          </button>
                          <button
                            type="button"
                            onClick={closeForgot}
                            className="px-4 py-3 rounded-xl border border-white/10 text-[9px] text-gray-400 uppercase tracking-widest"
                          >
                            Voltar
                          </button>
                        </div>
                      </div>
                    )}
                </div>

                {authError && (
                  <p className="w-full text-center text-xs text-red-400 mb-3">{authError}</p>
                )}

                {bffOnline === false && (
                  <div className="w-full mb-4 p-4 rounded-2xl border border-amber-500/30 bg-amber-950/30 flex flex-col items-center gap-3">
                    <WifiOff className="w-5 h-5 text-amber-400" />
                    <p className="text-xs text-amber-200 text-center">
                      {isDev
                        ? 'BFF offline — rode npm run dev:canal-web na raiz do monorepo.'
                        : 'Não foi possível conectar ao servidor. Tente novamente em instantes.'}
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

                {isDev && bffIntegrations && (
                  <p className="w-full text-center text-[8px] font-mono text-gray-600 mb-3 uppercase tracking-wider">
                    dev · kyc {bffIntegrations.kycProvider}
                    {bffIntegrations.kycProvider === 'didit' &&
                      (bffIntegrations.integrations.didit ? ' · didit ok' : ' · didit pendente')}
                  </p>
                )}

                <button
                  id="btn-start-scan"
                  type="button"
                  onClick={() => void handlePasswordAuth()}
                  disabled={busy}
                  aria-disabled={!canSubmitPassword}
                  className={`regenera-primary-btn w-full flex items-center justify-center gap-2 active:scale-[0.98] ${!canSubmitPassword ? 'opacity-40' : ''}`}
                >
                  {(passwordLoading || checkingBff) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {authMode === 'register'
                    ? diditKyc
                      ? 'Iniciar abertura'
                      : 'Criar conta com senha'
                    : 'Entrar com segurança'}
                </button>

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

                {touchIdAvailable && !useFirebase && !webAuthnBlocked && authMode === 'login' && (
                  <button
                    type="button"
                    onClick={() => void handleTouchId()}
                    disabled={!canSubmitTouchId}
                    className="w-full mt-3 py-3 rounded-xl bg-white/5 border border-cyan-500/30 text-cyan-300 font-bold uppercase tracking-widest text-[9px] hover:bg-white/10 active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {touchIdLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Fingerprint className="w-3.5 h-3.5" />
                    )}
                    {passkeyEnrolled
                      ? 'Entrar com Touch ID'
                      : 'Cadastrar Touch ID (precisa da senha)'}
                  </button>
                )}

                {touchIdAvailable && !useFirebase && !webAuthnBlocked && authMode === 'login' && (
                  <p className="text-[9px] text-gray-500 text-center mt-3 leading-relaxed">
                    {passkeyEnrolled
                      ? 'Touch ID usa passkey neste Mac — digital some se o BFF reiniciar em modo memória.'
                      : 'Primeiro acesso: informe CPF e senha, depois cadastre Touch ID.'}
                  </p>
                )}
            </div>
        </div>

        <div className="absolute bottom-8 text-center animate-in slide-in-from-bottom-4 fade-in duration-1000 delay-500 z-30 pointer-events-none">
             <div className="flex items-center justify-center gap-2 text-white/30 mb-2">
                <ShieldAlert className="w-4 h-4" />
                <span className="text-[9px] uppercase tracking-[0.3em]">Ambiente Seguro</span>
             </div>
             <p className="text-[10px] text-gray-500 font-mono">Regenera Bank · Private Financial OS</p>
        </div>
    </div>
  );
};

export default LoginScreen;