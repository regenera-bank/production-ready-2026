
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ShieldCheck,
  UserCheck,
  Building2,
  AlertTriangle,
  Loader2,
  CheckCircle,
  FileImage,
  Camera,
  Fingerprint,
} from 'lucide-react';
import {
  BffIntegrationsHealth,
  formatBffUserError,
  fetchBffIntegrations,
  fetchOnboardingStatus,
  openBankAccount,
  retryKycCadastral,
  retryKycBiometric,
  submitKyc,
  submitKycDocument,
  submitKycSelfie,
  updateOnboardingProfile,
  OnboardingStatus,
} from '../../platform/bff-client';
import { formatCep, lookupCep } from '../../platform/address';
import {
  isPlatformAuthenticatorAvailable,
  registerTouchIdForSession,
} from '../../platform/webauthn';
import DiditKycStep from './DiditKycStep';

interface OnboardingScreenProps {
  accessToken: string;
  onComplete: () => void;
  onError: (message: string) => void;
  onBackToLogin: () => void;
}

type UiStep = 'kyc' | 'account' | 'done';

const INTEGRATION_LABELS: Record<string, string> = {
  firebase: 'Firebase Auth',
  kycHomolog: 'KYC homolog',
  didit: 'Didit KYC',
  vision: 'Google Vision (OCR documento)',
  webauthn: 'WebAuthn (Touch ID)',
};

const HIDDEN_INTEGRATIONS = new Set(['prometeo', 'pep', 'datavalid']);

const KYC_REASON_LABELS: Record<string, string> = {
  INVALID_CEP: 'CEP inválido ou não encontrado',
  ADDRESS_CEP_MISMATCH: 'Endereço não confere com o CEP informado',
  IDENTITY_NOT_FOUND: 'CPF não validado — revise os dados cadastrais',
  NAME_MISMATCH: 'Nome não confere com o cadastro nacional',
  RESTRICTIVE_LIST_MATCH: 'CPF em lista restritiva',
  PEP_HIGH_RISK: 'PEP com risco elevado — bloqueado',
  PEP_OR_HIGH_VALUE: 'PEP ou valor alto — revisão manual',
  DATAVALID_REJECTED: 'DataValid rejeitou o CPF',
  DOCUMENT_REJECTED: 'Documento rejeitado no OCR',
  DOCUMENT_MANUAL_REVIEW: 'Documento em revisão manual',
  LOW_SIMILARITY_SCORE: 'Selfie não confere com o documento',
  DIDIT_DECLINED: 'Verificação Didit recusada',
  DIDIT_LIVENESS_ATTACK: 'Fraude detectada na prova de vida — verificação bloqueada',
  DIDIT_LOW_LIVENESS: 'Prova de vida não aceita — tente novamente com rosto visível',
  DIDIT_NO_FACE: 'Rosto não detectado na selfie — centralize o rosto',
  DIDIT_MULTIPLE_FACES: 'Mais de um rosto detectado — apenas uma pessoa na câmera',
  DIDIT_BLOCKLIST: 'Rosto em lista restritiva Didit — contate o suporte',
  DIDIT_DUPLICATE_FACE: 'Rosto já utilizado em outra verificação — revisão manual',
  DIDIT_EXPIRED: 'Sessão Didit expirada — inicie novamente',
  DIDIT_ABANDONED: 'Verificação Didit abandonada',
  SELFIE_SAME_AS_DOCUMENT: 'Use uma selfie diferente da foto do documento',
  BIOMETRY_IMAGE_TOO_SMALL: 'Imagem muito pequena — use foto nítida (mín. 8 KB)',
  SELFIE_FACE_MISSING: 'Rosto não detectado na selfie — centralize o rosto',
  KYC_LEGACY_RESET:
    'Cadastro antigo sem documento — envie RG/CNH e selfie para continuar',
  DOCUMENT_SCREEN_CAPTURE: 'Foto de tela detectada — use o documento físico',
  SELFIE_SCREEN_CAPTURE: 'Selfie inválida — não use foto de tela',
};

const formatKycReason = (reason?: string): string | undefined => {
  if (!reason) return undefined;
  return KYC_REASON_LABELS[reason] ?? reason;
};

const readFileAsBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Falha ao ler arquivo'));
    reader.readAsDataURL(file);
  });

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  accessToken,
  onComplete,
  onError,
  onBackToLogin,
}) => {
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [integrations, setIntegrations] = useState<BffIntegrationsHealth | null>(null);
  const [uiStep, setUiStep] = useState<UiStep>('kyc');
  const [docType, setDocType] = useState<'RG' | 'CNH'>('RG');
  const [profileDocument, setProfileDocument] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileBirthDate, setProfileBirthDate] = useState('');
  const [profileStreet, setProfileStreet] = useState('');
  const [profileNumber, setProfileNumber] = useState('');
  const [profileNeighborhood, setProfileNeighborhood] = useState('');
  const [profileCity, setProfileCity] = useState('');
  const [profileState, setProfileState] = useState('SP');
  const [profilePostalCode, setProfilePostalCode] = useState('');
  const [profileCepError, setProfileCepError] = useState<string | null>(null);
  const profileCepSeq = useRef(0);
  const [touchIdAvailable, setTouchIdAvailable] = useState(false);
  const [digitalEnrolled, setDigitalEnrolled] = useState(false);

  const homologKyc = integrations?.integrations.kycHomolog === true;
  const diditKyc =
    status?.kycProvider === 'didit' || integrations?.integrations.didit === true;

  const needsProfileCompletion = (next: OnboardingStatus): boolean => {
    if (diditKyc) {
      return false;
    }
    return (
      next.profileComplete === false ||
      !next.birthDate?.trim() ||
      (next.document?.replace(/\D/g, '') ?? '').length !== 11
    );
  };
  const kycCadastralReady =
    integrations?.integrations.firebase === true ||
    homologKyc ||
    integrations?.integrations.didit === true;

  const kycDocumentReady = integrations?.integrations.vision === true;

  const missingCadastralIntegrations = integrations
    ? Object.entries(integrations.integrations).filter(([key, ok]) => {
        if (ok || HIDDEN_INTEGRATIONS.has(key)) {
          return false;
        }
        return key === 'firebase';
      })
    : [];

  const syncUiStep = useCallback((next: OnboardingStatus) => {
    if (next.accountStatus === 'ACTIVE') {
      setUiStep('done');
      return;
    }
    if (next.kycStatus === 'APPROVED') {
      setUiStep('account');
      return;
    }
    setUiStep('kyc');
  }, []);

  const handleKycStatusChange = useCallback(
    (next: OnboardingStatus) => {
      setStatus(next);
      syncUiStep(next);
    },
    [syncUiStep],
  );

  const refresh = useCallback(async () => {
    const next = await fetchOnboardingStatus(accessToken);
    setStatus(next);
    if (next.accountStatus === 'ACTIVE') {
      setUiStep('done');
      onComplete();
      return;
    }
    syncUiStep(next);
  }, [accessToken, onComplete, syncUiStep]);

  useEffect(() => {
    void fetchBffIntegrations().then(setIntegrations);
    void isPlatformAuthenticatorAvailable().then(setTouchIdAvailable);
  }, []);

  useEffect(() => {
    if (!status) return;
    setProfileDocument(status.document ?? '');
    setProfilePhone(status.phone ?? '');
    setProfileBirthDate(status.birthDate ?? '');
    setProfileStreet(status.address.street ?? '');
    setProfileNumber(status.address.number ?? '');
    setProfileNeighborhood(status.address.neighborhood ?? '');
    setProfileCity(status.address.city ?? '');
    setProfileState(status.address.state || 'SP');
    setProfilePostalCode(status.address.postalCode ?? '');
  }, [status]);

  const handleProfileCepChange = (raw: string) => {
    const formatted = formatCep(raw);
    setProfilePostalCode(formatted);
    const digits = formatted.replace(/\D/g, '');
    setProfileCepError(null);
    if (digits.length !== 8) return;
    const seq = ++profileCepSeq.current;
    void lookupCep(digits)
      .then((result) => {
        if (seq !== profileCepSeq.current) return;
        if (!result) {
          setProfileCepError('CEP não encontrado');
          return;
        }
        setProfileStreet(result.street);
        setProfileNeighborhood(result.neighborhood);
        setProfileCity(result.city);
        setProfileState(result.state);
      })
      .catch((err: unknown) => {
        if (seq !== profileCepSeq.current) return;
        const message = formatBffUserError(err);
        setProfileCepError(message);
      });
  };

  const handleSaveProfile = async () => {
    if (!status) return;
    setStepError(null);
    setSubmitting(true);
    try {
      const next = await updateOnboardingProfile(accessToken, {
        document: profileDocument.trim(),
        displayName: status.displayName,
        email: status.email,
        phone: profilePhone.trim(),
        birthDate: profileBirthDate.trim(),
        address: {
          street: profileStreet.trim(),
          number: profileNumber.trim(),
          neighborhood: profileNeighborhood.trim(),
          city: profileCity.trim(),
          state: profileState.trim(),
          postalCode: profilePostalCode.trim(),
        },
      });
      setStatus(next);
      setStepError(null);
    } catch (error) {
      reportStepError(error);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    void refresh()
      .catch((error) => {
        const msg = formatBffUserError(error);
        setLoadError(msg);
        onError(msg);
      })
      .finally(() => setLoading(false));
  }, [refresh, onError]);

  const reportStepError = (error: unknown) => {
    const msg = formatBffUserError(error);
    setStepError(msg);
    onError(msg);
  };

  const handleSubmitKyc = async () => {
    setStepError(null);
    if (integrations && !kycCadastralReady) {
      const msg =
        homologKyc
          ? 'Firebase não configurado no BFF — defina FIREBASE_PROJECT_ID em bff/web-bff/.env'
          : 'Integrações KYC não configuradas no BFF — preencha bff/web-bff/.env e reinicie o servidor.';
      setStepError(msg);
      onError(msg);
      return;
    }
    setSubmitting(true);
    try {
      const next = await submitKyc(accessToken);
      setStatus(next);
      if (next.kycStatus === 'REJECTED') {
        const reason = formatKycReason(next.kycReason) ?? 'Cadastro rejeitado na verificação PLD';
        setStepError(reason);
        onError(reason);
        return;
      }
      syncUiStep(next);
    } catch (error) {
      reportStepError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDocumentUpload = async (file: File) => {
    setStepError(null);
    setSubmitting(true);
    try {
      const fileBase64 = await readFileAsBase64(file);
      const next = await submitKycDocument(accessToken, fileBase64, docType);
      setStatus(next);
      if (next.kycStatus === 'REJECTED') {
        const reason = formatKycReason(next.kycReason) ?? 'Documento rejeitado';
        setStepError(reason);
        onError(reason);
        return;
      }
      if (next.kycStep === 'manual_review') {
        const msg = 'Documento em revisão manual — aguarde contato do banco';
        setStepError(msg);
        onError(msg);
      }
      syncUiStep(next);
    } catch (error) {
      reportStepError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelfieUpload = async (file: File) => {
    setStepError(null);
    setSubmitting(true);
    try {
      const selfieBase64 = await readFileAsBase64(file);
      const next = await submitKycSelfie(accessToken, selfieBase64);
      setStatus(next);
      if (next.kycStatus === 'REJECTED') {
        const reason = formatKycReason(next.kycReason) ?? 'Biometria facial rejeitada';
        setStepError(reason);
        onError(reason);
        return;
      }
      syncUiStep(next);
    } catch (error) {
      reportStepError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetryCadastral = async () => {
    setStepError(null);
    setSubmitting(true);
    try {
      const next = await retryKycCadastral(accessToken);
      setStatus(next);
      syncUiStep(next);
    } catch (error) {
      reportStepError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetryBiometric = async () => {
    setStepError(null);
    setSubmitting(true);
    try {
      const next = await retryKycBiometric(accessToken);
      setStatus(next);
      syncUiStep(next);
    } catch (error) {
      reportStepError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const biometricRejected =
    status?.kycStatus === 'REJECTED' &&
    (status.kycStep === 'document' || status.kycStep === 'selfie');

  const handleRegisterDigital = async () => {
    setStepError(null);
    setSubmitting(true);
    try {
      await registerTouchIdForSession(accessToken);
      setDigitalEnrolled(true);
    } catch (error) {
      reportStepError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenAccount = async () => {
    setStepError(null);
    setSubmitting(true);
    try {
      await openBankAccount(accessToken);
      if (touchIdAvailable && !digitalEnrolled) {
        try {
          await registerTouchIdForSession(accessToken);
          setDigitalEnrolled(true);
        } catch {
          /* digital opcional — pode cadastrar no login */
        }
      }
      setUiStep('done');
      onComplete();
    } catch (error) {
      reportStepError(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError) {
    return (
      <div className="absolute inset-0 z-50 bg-[#020617] flex flex-col items-center justify-center px-6 text-center">
        <AlertTriangle className="w-10 h-10 text-amber-400 mb-4" />
        <p className="text-white font-semibold mb-2">Sessão expirada ou inválida</p>
        <p className="text-xs text-gray-400 mb-6 max-w-xs">{loadError}</p>
        <button
          type="button"
          onClick={onBackToLogin}
          className="px-6 py-3 rounded-xl bg-primary/20 border border-primary text-primary text-[10px] font-bold uppercase tracking-widest"
        >
          Ir para login
        </button>
      </div>
    );
  }

  if (loading || !status) {
    return (
      <div className="absolute inset-0 z-50 bg-[#020617] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
        <p className="mt-4 text-xs text-gray-400 uppercase tracking-widest">Carregando cadastro...</p>
      </div>
    );
  }

  const kycStep = status.kycStep;
  const diditActive = diditKyc && kycStep === 'didit_verification' && status.kycStatus !== 'APPROVED';

  return (
    <div
      className={`absolute inset-0 z-50 flex flex-col items-center font-sans safe-top safe-bottom px-4 ${
        diditActive
          ? 'justify-start overflow-y-auto bg-bg-deep py-4'
          : 'justify-center overflow-y-auto bg-bg-deep py-8'
      }`}
    >
      <div className={`w-full space-y-6 ${diditActive ? 'max-w-[590px] pt-0' : 'max-w-md'}`}>
        {!diditActive && (
          <div className="text-center">
            <h1 className="text-lg font-extrabold tracking-[0.15em] text-white uppercase">
              Abertura de <span className="text-primary">Conta</span>
            </h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-2">
              {diditKyc
                ? 'Escolha o documento — verificação Didit embarcada em seguida'
                : homologKyc
                  ? 'Homologação — PLD Firebase + documento + selfie (Vision auditado)'
                  : 'regenera-risk-kyc — PLD + OCR + Biometria'}
            </p>
          </div>
        )}

        {!diditActive && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2 text-sm">
            <p className="text-white font-semibold">{status.displayName}</p>
            <p className="text-gray-400 text-xs">
              CPF: {status.document?.trim() || '— pendente'}
            </p>
            <p className="text-gray-400 text-xs">
              Nascimento: {status.birthDate?.trim() || '— pendente'}
            </p>
            <p className="text-gray-400 text-xs">E-mail: {status.email}</p>
            <p className="text-gray-400 text-xs">Telefone: {status.phone}</p>
            <p className="text-gray-400 text-xs">
              CEP: {status.address.postalCode} — {status.address.street}, {status.address.number}
            </p>
            <p className="text-gray-400 text-xs">
              {status.address.neighborhood} · {status.address.city}/{status.address.state}
            </p>
            {status.identitySource && (
              <p className="text-gray-500 text-[10px] uppercase tracking-wider pt-1">
                Identidade: {status.identitySource}
                {status.pepScore !== undefined ? ` · PEP score ${status.pepScore}` : ''}
              </p>
            )}
          </div>
        )}

        {status.kycStatus === 'REJECTED' && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 rounded-2xl border border-red-500/30 bg-red-950/20">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <div>
                <p className="text-sm text-red-300 font-semibold">Verificação rejeitada</p>
                <p className="text-xs text-red-400/80 mt-1">
                  {formatKycReason(status.kycReason) ?? status.kycReason}
                </p>
                {status.kycReason === 'IDENTITY_NOT_FOUND' && (
                  <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                    Revise CPF, nome e endereço em{' '}
                    <span className="text-primary">Criar conta</span> e tente novamente.
                  </p>
                )}
              </div>
            </div>
            {status.kycStep === 'cadastral' && (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => void handleRetryCadastral()}
                  disabled={submitting}
                  className="w-full py-3 rounded-xl border border-primary/40 text-primary text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
                >
                  {submitting ? 'Reiniciando...' : 'Tentar verificação novamente'}
                </button>
                <button
                  type="button"
                  onClick={onBackToLogin}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold uppercase tracking-widest text-[10px]"
                >
                  Voltar — Criar conta com outro CPF
                </button>
              </div>
            )}
            {biometricRejected && (
              <button
                type="button"
                onClick={() => void handleRetryBiometric()}
                disabled={submitting}
                className="w-full py-3 rounded-xl border border-primary/40 text-primary text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
              >
                {submitting ? 'Reiniciando...' : 'Reenviar documento e selfie'}
              </button>
            )}
          </div>
        )}

        {integrations && missingCadastralIntegrations.length > 0 && (
          <div className="flex items-start gap-3 p-4 rounded-2xl border border-amber-500/30 bg-amber-950/20">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-sm text-amber-200 font-semibold">BFF sem credenciais KYC</p>
              <p className="text-xs text-amber-400/90 mt-1">
                Configure em <span className="font-mono">bff/web-bff/.env</span> e reinicie{' '}
                <span className="font-mono">npm run dev:canal-web</span>:
              </p>
              <ul className="text-[10px] text-amber-300/90 mt-2 space-y-1 list-disc list-inside">
                {missingCadastralIntegrations.map(([key]) => (
                  <li key={key}>{INTEGRATION_LABELS[key] ?? key}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {stepError && (
          <div className="flex items-start gap-3 p-4 rounded-2xl border border-red-500/30 bg-red-950/20">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <p className="text-xs text-red-300 leading-relaxed">{stepError}</p>
          </div>
        )}

        {uiStep === 'kyc' && (status.kycStatus !== 'REJECTED' || biometricRejected) && (
          <div className="space-y-4">
            {needsProfileCompletion(status) && (
              <div className="space-y-3 p-4 rounded-2xl border border-cyan-500/30 bg-cyan-950/20">
                <p className="text-sm text-white font-semibold">Complete seu cadastro bancário</p>
                <p className="text-xs text-gray-400">
                  Login com Google não traz CPF nem data de nascimento — preencha abaixo para continuar.
                </p>
                <input
                  value={profileDocument}
                  onChange={(e) => setProfileDocument(e.target.value)}
                  placeholder="CPF"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none"
                />
                <input
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="Telefone (DDD + número)"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none"
                />
                <input
                  value={profileBirthDate}
                  onChange={(e) => setProfileBirthDate(e.target.value)}
                  placeholder="Data de nascimento"
                  type="date"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none [color-scheme:dark]"
                />
                <input
                  value={profilePostalCode}
                  onChange={(e) => handleProfileCepChange(e.target.value)}
                  placeholder="CEP"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none"
                />
                {profileCepError && (
                  <p className="text-[10px] text-red-400">{profileCepError}</p>
                )}
                <input
                  value={profileStreet}
                  onChange={(e) => setProfileStreet(e.target.value)}
                  placeholder="Rua / Avenida"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none"
                />
                <div className="flex gap-2">
                  <input
                    value={profileNumber}
                    onChange={(e) => setProfileNumber(e.target.value)}
                    placeholder="Nº"
                    className="w-24 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none"
                  />
                  <input
                    value={profileNeighborhood}
                    onChange={(e) => setProfileNeighborhood(e.target.value)}
                    placeholder="Bairro"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    value={profileCity}
                    onChange={(e) => setProfileCity(e.target.value)}
                    placeholder="Cidade"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none"
                  />
                  <input
                    value={profileState}
                    onChange={(e) => setProfileState(e.target.value)}
                    placeholder="UF"
                    maxLength={2}
                    className="w-16 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none uppercase"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void handleSaveProfile()}
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-primary text-white font-bold uppercase tracking-widest text-[10px] disabled:opacity-50"
                >
                  {submitting ? 'Salvando...' : 'Salvar cadastro'}
                </button>
              </div>
            )}

            {!diditKyc &&
              !needsProfileCompletion(status) &&
              (kycStep === 'cadastral' || status.kycStatus === 'PENDING') && (
              <>
                <div className="flex items-center gap-3 p-4 rounded-2xl border border-primary/20 bg-primary/5">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                  <div>
                    <p className="text-sm text-white font-semibold">Etapa 1 — Cadastral + PLD</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {homologKyc
                        ? 'Validação cadastral com Firebase — em seguida documento e selfie obrigatórios.'
                        : 'Validação cadastral, listas restritivas, PEP e endereço.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void handleSubmitKyc()}
                  disabled={submitting || (integrations !== null && !kycCadastralReady)}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold uppercase tracking-widest text-[10px] disabled:opacity-50"
                >
                  {submitting ? 'Analisando...' : 'Iniciar verificação cadastral'}
                </button>
              </>
            )}

            {!needsProfileCompletion(status) &&
            kycStep === 'document' &&
            integrations &&
            !kycDocumentReady && (
              <div className="flex items-start gap-3 p-4 rounded-2xl border border-amber-500/30 bg-amber-950/20">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <p className="text-xs text-amber-300">
                  OCR indisponível — configure GOOGLE_VISION_API_KEY no BFF (npm run bootstrap-secrets).
                </p>
              </div>
            )}

            {diditKyc && (
              <p className="text-[8px] text-gray-600 text-center leading-relaxed">
                Problemas com Didit? Fallback: KYC_PROVIDER=firebase em bff/web-bff/.env.local e
                reinicie o canal.
              </p>
            )}

            {kycStep === 'didit_verification' && diditKyc && (
              <DiditKycStep
                accessToken={accessToken}
                status={status}
                onStatusChange={handleKycStatusChange}
                onError={setStepError}
              />
            )}

            {kycStep === 'document' && !diditKyc && (
              <>
                <div className="flex items-center gap-3 p-4 rounded-2xl border border-primary/20 bg-primary/5">
                  <FileImage className="w-6 h-6 text-primary" />
                  <div>
                    <p className="text-sm text-white font-semibold">Etapa 2 — Documento (OCR)</p>
                    <p className="text-xs text-gray-400 mt-1">RG ou CNH — motor Vision auditado.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDocType('RG')}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase border ${docType === 'RG' ? 'border-primary text-primary' : 'border-white/10 text-gray-500'}`}
                  >
                    RG
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocType('CNH')}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase border ${docType === 'CNH' ? 'border-primary text-primary' : 'border-white/10 text-gray-500'}`}
                  >
                    CNH
                  </button>
                </div>
                <label className={`block w-full py-4 rounded-xl border border-dashed text-center text-[10px] font-bold uppercase tracking-widest cursor-pointer ${
                  submitting
                    ? 'border-primary/50 text-primary'
                    : 'border-white/20 text-gray-400 hover:border-primary/40'
                }`}>
                  {submitting && kycStep === 'document' ? (
                    <span className="inline-flex items-center gap-2 justify-center">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analisando documento (OCR)...
                    </span>
                  ) : (
                    'Enviar foto do documento'
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={submitting}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleDocumentUpload(file);
                    }}
                  />
                </label>
              </>
            )}

            {kycStep === 'selfie' && !diditKyc && (
              <>
                <div className="flex items-center gap-3 p-4 rounded-2xl border border-primary/20 bg-primary/5">
                  <Camera className="w-6 h-6 text-primary" />
                  <div>
                    <p className="text-sm text-white font-semibold">Etapa 3 — Selfie (1:1)</p>
                    <p className="text-xs text-gray-400 mt-1">DataValid — prova de vida e match facial.</p>
                  </div>
                </div>
                <label className={`block w-full py-4 rounded-xl border border-dashed text-center text-[10px] font-bold uppercase tracking-widest cursor-pointer ${
                  submitting
                    ? 'border-primary/50 text-primary'
                    : 'border-white/20 text-gray-400 hover:border-primary/40'
                }`}>
                  {submitting && kycStep === 'selfie' ? (
                    <span className="inline-flex items-center gap-2 justify-center">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analisando selfie (biometria)...
                    </span>
                  ) : (
                    'Tirar / enviar selfie'
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    className="hidden"
                    disabled={submitting}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleSelfieUpload(file);
                    }}
                  />
                </label>
              </>
            )}

            {kycStep === 'manual_review' && (
              <div className="flex items-start gap-3 p-4 rounded-2xl border border-amber-500/30 bg-amber-950/20">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <p className="text-sm text-amber-200 font-semibold">Revisão manual</p>
                  <p className="text-xs text-amber-400/80 mt-1">
                    {status.kycReason ?? 'PEP ou documento em análise pela mesa de compliance.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {uiStep === 'account' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-2xl border border-emerald-500/20 bg-emerald-950/20">
              <UserCheck className="w-6 h-6 text-emerald-400" />
              <div>
                <p className="text-sm text-emerald-300 font-semibold">KYC aprovado</p>
                <p className="text-xs text-gray-400 mt-1">Pronto para abrir conta com saldo zero.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-2xl border border-white/10 bg-white/5">
              <Building2 className="w-6 h-6 text-primary" />
              <div>
                <p className="text-sm text-white font-semibold">Conta corrente digital</p>
                <p className="text-xs text-gray-400 mt-1">Ledger real no core-bank.</p>
              </div>
            </div>
            {touchIdAvailable && integrations?.integrations.webauthn && (
              <div className="flex items-start gap-3 p-4 rounded-2xl border border-cyan-500/30 bg-cyan-950/20">
                <Fingerprint className="w-6 h-6 text-cyan-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-cyan-200 font-semibold">Chave digital (Touch ID)</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Cadastre agora para entrar sem senha neste dispositivo.
                  </p>
                  {digitalEnrolled ? (
                    <p className="text-[10px] text-emerald-400 mt-2 uppercase tracking-widest">
                      Digital cadastrada
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleRegisterDigital()}
                      disabled={submitting}
                      className="mt-3 w-full py-2.5 rounded-xl border border-cyan-500/40 text-cyan-300 text-[10px] font-bold uppercase tracking-widest hover:bg-cyan-500/10 disabled:opacity-40"
                    >
                      Cadastrar digital agora
                    </button>
                  )}
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => void handleOpenAccount()}
              disabled={submitting}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-bold uppercase tracking-widest text-[10px] disabled:opacity-50"
            >
              {submitting ? 'Abrindo conta...' : 'Abrir minha conta'}
            </button>
          </div>
        )}

        {uiStep === 'done' && (
          <div className="flex flex-col items-center gap-3 py-8">
            <CheckCircle className="w-12 h-12 text-emerald-400" />
            <p className="text-sm text-emerald-300 font-semibold">Conta ativa</p>
          </div>
        )}

        {status.kycStatus !== 'REJECTED' && (
          <button
            type="button"
            onClick={onBackToLogin}
            className="w-full py-2 text-[10px] text-gray-500 uppercase tracking-widest hover:text-gray-300 transition-colors"
          >
            Voltar ao login — Entrar ou Criar conta
          </button>
        )}
      </div>
    </div>
  );
};

export default OnboardingScreen;