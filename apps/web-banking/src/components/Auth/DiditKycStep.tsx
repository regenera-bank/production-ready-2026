import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DiditSdk } from '@didit-protocol/sdk-web';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import {
  createDiditKycSession,
  retryDiditKyc,
  syncDiditKycStatus,
  type OnboardingStatus,
} from '../../platform/bff-client';
import {
  formatStep,
  isFatalLivenessError,
  isRetryableFeedback,
  resolveCoachingMessage,
  type DocumentFormat,
  type DocumentType,
} from './didit-feedback';
import VerificationCaptureScreen from './VerificationCaptureScreen';

interface DiditKycStepProps {
  accessToken: string;
  status: OnboardingStatus;
  onStatusChange: (next: OnboardingStatus) => void;
  onError: (message: string) => void;
}

type Phase = 'pick' | 'starting' | 'live' | 'review' | 'approved' | 'error';

type DiditSdkEvent = {
  type?: string;
  data?: Record<string, unknown>;
};

type DiditSdkCompletion = {
  type?: 'completed' | 'cancelled' | 'failed' | string;
  error?: {
    type?: string;
    message?: string;
  };
};

const IFRAME_HOST_ID = 'didit-kyc-iframe-host';
const SDK_BOOT_TIMEOUT_MS = 25_000;
const SYNC_INTERVAL_MS = 8_000;

const DiditKycStep: React.FC<DiditKycStepProps> = ({
  accessToken,
  status,
  onStatusChange,
  onError,
}) => {
  const generation = useRef(0);
  const resumedRef = useRef(false);
  const teardownRef = useRef<(() => void) | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);

  const [phase, setPhase] = useState<Phase>(() => initialPhase(status));
  const [documentType, setDocumentType] = useState<DocumentType | null>(
    status.diditDocumentType ?? null,
  );
  const [documentFormat, setDocumentFormat] = useState<DocumentFormat>(
    status.diditDocumentFormat ?? 'physical',
  );
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [attemptHint, setAttemptHint] = useState<string | null>(null);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [startingSession, setStartingSession] = useState(false);

  const stepLabel = formatStep(currentStep ?? undefined, documentType);

  const sync = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setSyncing(true);
        const next = await syncDiditKycStatus(accessToken);
        setLastSyncAt(new Date());
        onStatusChange(next);
        setPhase(initialPhase(next));
        if (next.diditCoachingMessage) {
          setFeedbackMessage(next.diditCoachingMessage);
        }
        return next;
      } catch (error) {
        if (!silent) {
          onError(error instanceof Error ? error.message : 'Falha ao sincronizar Didit');
        }
        return null;
      } finally {
        if (!silent) setSyncing(false);
      }
    },
    [accessToken, onError, onStatusChange],
  );

  const stopSdk = useCallback(() => {
    teardownRef.current?.();
    teardownRef.current = null;
    DiditSdk.shared.onComplete = undefined;
    DiditSdk.shared.onEvent = undefined;
    DiditSdk.shared.onStateChange = undefined;
  }, []);

  const resetToPicker = useCallback(async () => {
    generation.current += 1;
    resumedRef.current = false;
    stopSdk();
    DiditSdk.shared.destroy();
    setPhase('pick');
    setCurrentStep(null);
    setFeedbackMessage(null);
    setAttemptHint(null);
    setFallbackUrl(null);
    try {
      const next = await retryDiditKyc(accessToken);
      onStatusChange(next);
    } catch {
      // picker ainda funciona com estado local; BFF retry é best-effort
    }
  }, [accessToken, onStatusChange, stopSdk]);

  const revealWhenIframeMounted = useCallback((myGeneration: number) => {
    const reveal = (): boolean => {
      if (generation.current !== myGeneration) return false;
      const iframe = hostRef.current?.querySelector('iframe') as HTMLIFrameElement | null;
      const src = iframe?.getAttribute('src') ?? '';
      if (iframe && src && src !== 'about:blank') {
        setPhase((prev) => (prev === 'starting' ? 'live' : prev));
        return true;
      }
      return false;
    };

    if (reveal()) return () => undefined;

    const observer = new MutationObserver(() => reveal());
    if (hostRef.current) {
      observer.observe(hostRef.current, {
        attributes: true,
        childList: true,
        subtree: true,
      });
    }

    const pollId = window.setInterval(() => {
      if (reveal()) {
        observer.disconnect();
        window.clearInterval(pollId);
      }
    }, 250);

    return () => {
      observer.disconnect();
      window.clearInterval(pollId);
    };
  }, []);

  const embedSession = useCallback(
    async (sessionUrl: string, statusResponse: OnboardingStatus) => {
      if (!documentType) return;

      generation.current += 1;
      const myGeneration = generation.current;
      stopSdk();
      setStartingSession(true);
      setPhase('starting');
      setCurrentStep(null);
      setFeedbackMessage(null);
      setAttemptHint(null);
      setFallbackUrl(sessionUrl);
      onStatusChange(statusResponse);

      try {
        await waitForHost(hostRef);
        if (generation.current !== myGeneration) return;

        const sdk = DiditSdk.shared;

        sdk.onStateChange = (state: string, error?: string) => {
          if (generation.current !== myGeneration) return;
          if (state === 'ready' || state === 'loading') {
            setPhase((prev) => (prev === 'starting' ? 'live' : prev));
          }
          if (state === 'error') {
            void handleSdkError(
              { message: error ?? 'Falha ao carregar a verificação Didit' },
              myGeneration,
            );
          }
        };

        sdk.onComplete = (result: DiditSdkCompletion) => {
          if (generation.current !== myGeneration) return;
          if (result.type === 'completed' || result.type === 'cancelled') {
            void sync();
          }
          if (result.type === 'failed') {
            void handleSdkError(
              {
                error: result.error?.type,
                message:
                  result.error?.message ?? 'Verificação falhou — reinicie para tentar de novo',
              },
              myGeneration,
            );
          }
        };

        sdk.onEvent = (event: DiditSdkEvent) => {
          if (generation.current !== myGeneration) return;
          const data = event.data ?? {};

          if (typeof data.step === 'string') {
            setCurrentStep(data.step);
          }

          if (
            event.type === 'didit:ready' ||
            event.type === 'didit:started' ||
            event.type === 'didit:step_started' ||
            event.type === 'didit:step_changed' ||
            event.type === 'didit:media_started'
          ) {
            setPhase((prev) => (prev === 'starting' ? 'live' : prev));
          }

          if (
            event.type === 'didit:status_updated' ||
            event.type === 'didit:verification_submitted' ||
            event.type === 'didit:completed'
          ) {
            void sync(true);
          }

          if (event.type === 'didit:error') {
            void handleSdkError(data, myGeneration);
          }
        };

        await sdk.startVerification({
          url: sessionUrl,
          configuration: {
            embedded: true,
            embeddedContainerId: IFRAME_HOST_ID,
            showCloseButton: false,
            showExitConfirmation: false,
            closeModalOnComplete: false,
            loggingEnabled: import.meta.env.DEV,
          },
        });

        const stopWatcher = revealWhenIframeMounted(myGeneration);
        const timeoutId = window.setTimeout(() => {
          if (generation.current !== myGeneration) return;
          const iframe = hostRef.current?.querySelector('iframe') as HTMLIFrameElement | null;
          const src = iframe?.getAttribute('src') ?? '';
          if (!src || src === 'about:blank') {
            fail('Iframe Didit não montou. Permita câmera/microfone ou abra em nova aba.', false);
          }
        }, SDK_BOOT_TIMEOUT_MS);

        teardownRef.current = () => {
          window.clearTimeout(timeoutId);
          stopWatcher();
        };
      } catch (error) {
        fail(error instanceof Error ? error.message : 'Falha ao iniciar verificação Didit', false);
      } finally {
        setStartingSession(false);
      }

      async function handleSdkError(data: Record<string, unknown>, generationId: number) {
        if (generation.current !== generationId) return;

        const attemptsUsed = typeof data.attempts_used === 'number' ? data.attempts_used : undefined;
        const maxAttempts = typeof data.max_attempts === 'number' ? data.max_attempts : undefined;
        if (attemptsUsed !== undefined && maxAttempts !== undefined) {
          setAttemptHint(`Tentativa ${attemptsUsed} de ${maxAttempts}`);
        }

        const synced = await sync(true);
        if (synced?.diditCoachingMessage) {
          if (synced.diditFatal) {
            fail(synced.diditCoachingMessage, true);
            return;
          }
          if (synced.diditRetryable) {
            setFeedbackMessage(synced.diditCoachingMessage);
            setPhase('live');
            return;
          }
          fail(synced.diditCoachingMessage, false);
          return;
        }

        const coaching = resolveCoachingMessage(data);
        if (isFatalLivenessError(data)) {
          fail(coaching ?? 'Verificação encerrada por suspeita de fraude.', true);
          return;
        }
        if (isRetryableFeedback(data) || coaching) {
          setFeedbackMessage(coaching ?? 'Ajuste a captura e tente novamente no fluxo abaixo.');
          setPhase('live');
          return;
        }
        fail(coaching ?? 'Verificação falhou — reinicie para tentar novamente.', false);
      }

      function fail(nextMessage: string, fatal: boolean) {
        setFeedbackMessage(nextMessage);
        setPhase('error');
        if (fatal) onError(nextMessage);
      }
    },
    [documentType, onError, onStatusChange, revealWhenIframeMounted, stopSdk, sync],
  );

  const startVerification = useCallback(async () => {
    if (!documentType) return;

    try {
      const session = await createDiditKycSession(accessToken, {
        documentType,
        documentFormat: documentType === 'CNH' ? documentFormat : 'physical',
      });
      await embedSession(session.url, session.statusResponse);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Falha ao iniciar verificação Didit');
    }
  }, [accessToken, documentFormat, documentType, embedSession, onError]);

  const resumeActiveSession = useCallback(async () => {
    if (!documentType || !status.diditSessionUrl) return;
    try {
      const session = await createDiditKycSession(accessToken, {
        documentType,
        documentFormat: documentType === 'CNH' ? documentFormat : 'physical',
      });
      await embedSession(session.url, session.statusResponse);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Falha ao retomar verificação Didit');
    }
  }, [accessToken, documentFormat, documentType, embedSession, onError, status.diditSessionUrl]);

  useEffect(() => {
    if (!status.diditSessionId || status.kycStatus === 'APPROVED') return;
    const timer = window.setInterval(() => void sync(true), SYNC_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [status.diditSessionId, status.kycStatus, sync]);

  useEffect(() => {
    if (status.diditDocumentType && !documentType) {
      setDocumentType(status.diditDocumentType);
    }
    if (status.diditDocumentFormat) {
      setDocumentFormat(status.diditDocumentFormat);
    }
  }, [documentType, status.diditDocumentFormat, status.diditDocumentType]);

  useEffect(() => {
    if (resumedRef.current) return;
    if (!canResumeDiditSession(status)) return;
    const type = documentType ?? status.diditDocumentType;
    if (!type) return;
    resumedRef.current = true;
    void resumeActiveSession();
  }, [documentType, resumeActiveSession, status, status.diditDocumentType]);

  useEffect(() => stopSdk, [stopSdk]);

  return (
    <section className="w-full space-y-4" data-testid="didit-kyc-step">
      {phase !== 'pick' && (
        <StatusHeader
          lastSyncAt={lastSyncAt}
          phase={phase}
          status={status}
          syncing={syncing}
          onSync={() => void sync()}
        />
      )}

      {phase === 'pick' && (
        <VerificationCaptureScreen
          status={status}
          documentType={documentType}
          documentFormat={documentFormat}
          continuing={startingSession}
          onPickFormat={setDocumentFormat}
          onPickType={(type) => {
            setDocumentType(type);
            if (type === 'RG') setDocumentFormat('physical');
          }}
          onContinue={() => void startVerification()}
        />
      )}

      <div className={phase === 'pick' ? 'hidden' : 'space-y-3'}>
        {phase !== 'pick' && (
          <div className="flex items-center justify-between gap-3 px-1">
            <div className="flex min-w-0 items-center gap-2">
              {phase === 'starting' ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-cyan-300" />
              ) : (
                <Camera className="h-4 w-4 shrink-0 text-cyan-300" />
              )}
              <p className="truncate text-xs font-semibold text-cyan-100">{stepLabel}</p>
            </div>
            <p className="shrink-0 text-[9px] uppercase tracking-[0.22em] text-cyan-400/70">
              {documentType}
              {documentType === 'CNH' && documentFormat === 'digital' ? ' PDF' : ''}
            </p>
          </div>
        )}

        <div
          className={`relative overflow-hidden rounded-[24px] border border-cyan-400/15 bg-[#050b17] shadow-2xl shadow-black/40 ${
            phase === 'pick' ? 'h-px min-h-0' : ''
          }`}
        >
          <div
            ref={hostRef}
            id={IFRAME_HOST_ID}
            className={`relative z-0 w-full ${
              phase === 'pick' ? 'h-px min-h-0' : 'h-[min(82dvh,720px)] min-h-[500px]'
            }`}
          />
          {phase === 'starting' && (
            <div
              data-testid="didit-boot-overlay"
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#020617]/95"
            >
              <Loader2 className="h-9 w-9 animate-spin text-cyan-300" />
              <p className="px-6 text-center text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                Abrindo verificação segura
              </p>
            </div>
          )}
        </div>

        {phase !== 'pick' && feedbackMessage && (
          <FeedbackBanner attemptHint={attemptHint} message={feedbackMessage} phase={phase} />
        )}

        {phase === 'error' && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {fallbackUrl && (
              <a
                href={fallbackUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-cyan-600/80 px-4 py-3 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-white hover:bg-cyan-500"
              >
                Abrir em nova aba
              </a>
            )}
            <button
              type="button"
              onClick={() => void resetToPicker()}
              className="rounded-xl border border-cyan-400/30 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200 hover:bg-cyan-950/30"
            >
              Voltar à verificação
            </button>
          </div>
        )}
      </div>

      {(phase === 'review' || phase === 'approved') && (
        <ReviewPanel
          onRestart={() => void resetToPicker()}
          onSync={() => void sync()}
          phase={phase}
          status={status}
          syncing={syncing}
        />
      )}
    </section>
  );
};

export default DiditKycStep;

function initialPhase(status: OnboardingStatus): Phase {
  if (status.kycStatus === 'APPROVED') return 'approved';
  if (status.diditDecision === 'MANUAL_REVIEW') return 'review';
  if (canResumeDiditSession(status)) return 'live';
  if (status.diditSessionId && status.kycStatus === 'IN_REVIEW') return 'review';
  if (status.kycStatus === 'REJECTED' || status.diditRetryable) return 'error';
  return 'pick';
}

function canResumeDiditSession(status: OnboardingStatus): boolean {
  const terminal = new Set(['APPROVED', 'REJECTED', 'ABANDONED', 'EXPIRED']);
  return (
    status.kycStep === 'didit_verification' &&
    Boolean(status.diditSessionId) &&
    Boolean(status.diditSessionUrl) &&
    status.kycStatus === 'IN_REVIEW' &&
    (!status.diditDecision || !terminal.has(status.diditDecision))
  );
}

async function waitForHost(ref: React.MutableRefObject<HTMLDivElement | null>): Promise<void> {
  for (let i = 0; i < 80; i += 1) {
    if (ref.current) return;
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
  throw new Error('Área de verificação não montou — recarregue a página');
}

function StatusHeader({
  status,
  phase,
  lastSyncAt,
  syncing,
  onSync,
}: {
  status: OnboardingStatus;
  phase: Phase;
  lastSyncAt: Date | null;
  syncing: boolean;
  onSync: () => void;
}) {
  return (
    <div className="rounded-2xl border border-cyan-400/15 bg-gradient-to-br from-slate-950 via-[#071225] to-[#020617] p-4 shadow-xl shadow-black/30">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-cyan-300" />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-100">
              Verificação de identidade
            </p>
          </div>
          <p className="text-[10px] leading-relaxed text-slate-400">
            Documento, selfie e prova de vida são processados pela Didit. A aprovação final vem do BFF após webhook assinado ou reconsulta do relatório.
          </p>
        </div>
        {status.diditSessionId && (
          <button
            type="button"
            onClick={onSync}
            disabled={syncing}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-cyan-400/20 px-3 text-[9px] font-bold uppercase tracking-[0.16em] text-cyan-200 disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} />
            Sync
          </button>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-[9px] uppercase tracking-[0.18em]">
        <span className="rounded-full border border-cyan-400/20 px-2 py-1 text-cyan-300">
          {phase}
        </span>
        {status.diditStatus && (
          <span className="rounded-full border border-slate-700 px-2 py-1 text-slate-400">
            {status.diditStatus}
          </span>
        )}
        {lastSyncAt && (
          <span className="rounded-full border border-slate-700 px-2 py-1 text-slate-500">
            {lastSyncAt.toLocaleTimeString('pt-BR')}
          </span>
        )}
      </div>
    </div>
  );
}

function FeedbackBanner({
  phase,
  message,
  attemptHint,
}: {
  phase: Phase;
  message: string;
  attemptHint: string | null;
}) {
  const fatal = phase === 'error';
  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border p-3 ${
        fatal ? 'border-red-500/30 bg-red-950/20' : 'border-amber-500/30 bg-amber-950/20'
      }`}
    >
      <AlertTriangle
        className={`mt-0.5 h-4 w-4 shrink-0 ${fatal ? 'text-red-300' : 'text-amber-300'}`}
      />
      <div className="space-y-1">
        <p className={`text-xs leading-relaxed ${fatal ? 'text-red-200' : 'text-amber-100'}`}>
          {message}
        </p>
        {attemptHint && (
          <p className="text-[9px] uppercase tracking-[0.18em] text-amber-300/80">
            {attemptHint}
          </p>
        )}
      </div>
    </div>
  );
}

function ReviewPanel({
  phase,
  status,
  syncing,
  onSync,
  onRestart,
}: {
  phase: Phase;
  status: OnboardingStatus;
  syncing: boolean;
  onSync: () => void;
  onRestart: () => void;
}) {
  const approved = phase === 'approved';
  return (
    <div className="space-y-3 rounded-2xl border border-cyan-400/15 bg-[#071225] p-5 text-center">
      {approved ? (
        <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-300" />
      ) : (
        <Loader2 className="mx-auto h-9 w-9 animate-spin text-cyan-300" />
      )}
      <p className="text-sm font-bold text-white">
        {approved ? 'Identidade aprovada' : 'Verificação em análise'}
      </p>
      <p className="mx-auto max-w-sm text-[10px] leading-relaxed text-slate-400">
        {approved
          ? 'O BFF recebeu a decisão final e a jornada pode avançar para abertura de conta.'
          : 'Documento e selfie foram enviados. Pode fechar a tela; a decisão chega por webhook e este painel acompanha o estado.'}
      </p>
      {status.diditSessionId && (
        <p className="text-[9px] uppercase tracking-[0.18em] text-slate-500">
          Sessão: {status.diditSessionId}
        </p>
      )}
      <button
        type="button"
        onClick={onSync}
        disabled={syncing}
        className="w-full rounded-xl bg-cyan-600/80 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white disabled:opacity-50"
      >
        {syncing ? 'Consultando…' : 'Atualizar agora'}
      </button>
      {!approved && (
        <button
          type="button"
          onClick={onRestart}
          className="w-full py-2 text-[9px] uppercase tracking-[0.18em] text-slate-500 hover:text-cyan-300"
        >
          Refazer com outro documento
        </button>
      )}
    </div>
  );
}
