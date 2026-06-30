
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
} from 'lucide-react';
import {
  BffError,
  BffIntegrationsHealth,
  fetchBffIntegrations,
  fetchOnboardingStatus,
  openBankAccount,
  retryKycCadastral,
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

interface OnboardingScreenProps {
  accessToken: string;
  onComplete: () => void;
  onError: (message: string) => void;
  onBackToLogin: () => void;
}

type UiStep = 'kyc' | 'account' | 'done';

const INTEGRATION_LABELS: Record<string, string> = {
  firebase: 'Firebase Auth',
  kycHomolog: 'KYC homolog (sem Prometeo)',
  prometeo: 'Prometeo (legado)',
  pep: 'API PEP (PLD)',
  datavalid: 'DataValid (biometria)',
  vision: 'Google Vision (OCR documento)',
  webauthn: 'WebAuthn (Touch ID)',
};

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
};

const formatKycReason = (reason?: string): string | undefined => {
  if (!reason) return undefined;
  return KYC_REASON_LABELS[reason] ?? reason;
};

const formatStepError = (error: unknown): string => {
  if (error instanceof BffError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Falha na operação';
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

  const homologKyc = integrations?.integrations.kycHomolog === true;

  const needsProfileCompletion = (next: OnboardingStatus): boolean =>
    next.profileComplete === false ||
    !next.birthDate?.trim() ||
    (next.document?.replace(/\D/g, '') ?? '').length !== 11;
  const kycCadastralReady = homologKyc
    ? integrations?.integrations.firebase === true
    : integrations?.integrations.prometeo === true &&
      integrations?.integrations.pep === true &&
      integrations?.integrations.datavalid === true;

  const kycDocumentReady = integrations?.integrations.vision === true;

  const missingCadastralIntegrations = integrations
    ? Object.entries(integrations.integrations).filter(([key, ok]) => {
        if (ok) return false;
        if (homologKyc) {
          return ['firebase'].includes(key);
        }
        return ['prometeo', 'pep', 'datavalid'].includes(key);
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
    void lookupCep(digits).then((result) => {
      if (seq !== profileCepSeq.current) return;
      if (!result) {
        setProfileCepError('CEP inválido');
        return;
      }
      setProfileStreet(result.street);
      setProfileNeighborhood(result.neighborhood);
      setProfileCity(result.city);
      setProfileState(result.state);
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
        const msg = formatStepError(error);
        setLoadError(msg);
        onError(msg);
      })
      .finally(() => setLoading(false));
  }, [refresh, onError]);

  const reportStepError = (error: unknown) => {
    const msg = formatStepError(error);
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

  const handleOpenAccount = async () => {
    setStepError(null);
    setSubmitting(true);
    try {
      await openBankAccount(accessToken);
      if (await isPlatformAuthenticatorAvailable()) {
        try {
          await registerTouchIdForSession(accessToken);
        } catch {
          /* digital opcional — cadastro no login */
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

  return (
    <div className="absolute inset-0 z-50 bg-bg-deep flex flex-col items-center justify-center overflow-y-auto font-sans safe-top safe-bottom px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-lg font-extrabold tracking-[0.15em] text-white uppercase">
            Abertura de <span className="text-primary">Conta</span>
          </h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-2">
            {homologKyc
              ? 'Firebase Auth — identidade confirmada, sem foto de documento'
              : 'regenera-risk-kyc — PLD + OCR + Biometria'}
          </p>
        </div>

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

        {uiStep === 'kyc' && status.kycStatus !== 'REJECTED' && (
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

            {!needsProfileCompletion(status) &&
              (kycStep === 'cadastral' || status.kycStatus === 'PENDING') && (
              <>
                <div className="flex items-center gap-3 p-4 rounded-2xl border border-primary/20 bg-primary/5">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                  <div>
                    <p className="text-sm text-white font-semibold">Etapa 1 — Cadastral + PLD</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {homologKyc
                        ? 'Firebase confirma sua identidade — sem foto de documento neste ambiente.'
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

            {kycStep === 'document' && (
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
                <label className="block w-full py-4 rounded-xl border border-dashed border-white/20 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400 cursor-pointer hover:border-primary/40">
                  Enviar foto do documento
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

            {kycStep === 'selfie' && (
              <>
                <div className="flex items-center gap-3 p-4 rounded-2xl border border-primary/20 bg-primary/5">
                  <Camera className="w-6 h-6 text-primary" />
                  <div>
                    <p className="text-sm text-white font-semibold">Etapa 3 — Selfie (1:1)</p>
                    <p className="text-xs text-gray-400 mt-1">DataValid — prova de vida e match facial.</p>
                  </div>
                </div>
                <label className="block w-full py-4 rounded-xl border border-dashed border-white/20 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400 cursor-pointer hover:border-primary/40">
                  Tirar / enviar selfie
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