import React from 'react';
import { FileText, IdCard, Loader2, Lock, ShieldCheck } from 'lucide-react';
import type { OnboardingStatus } from '../../platform/bff-client';
import type { DocumentFormat, DocumentType } from './didit-feedback';
import RegeneraAuthHero, { RegeneraTrustStrip } from './RegeneraAuthHero';

interface VerificationCaptureScreenProps {
  status: OnboardingStatus;
  documentType: DocumentType | null;
  documentFormat: DocumentFormat;
  onPickType: (type: DocumentType) => void;
  onPickFormat: (format: DocumentFormat) => void;
  onContinue: () => void;
  continuing?: boolean;
  onBack?: () => void;
}

const VerificationCaptureScreen: React.FC<VerificationCaptureScreenProps> = ({
  documentType,
  documentFormat,
  onPickType,
  onPickFormat,
  onContinue,
  continuing = false,
  onBack,
}) => (
  <section
    className="regenera-login-card w-full screen-transition"
    data-testid="verification-capture-screen"
  >
    <RegeneraAuthHero />

    <RegeneraTrustStrip />

    <div className="mb-4 text-center">
      <p className="text-sm font-semibold text-slate-200">Abertura de conta digital</p>
      <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
        Escolha o documento. A captura de foto e selfie ocorre uma única vez na verificação
        Didit embarcada — sem repetir no app.
      </p>
    </div>

    <div className="space-y-4" data-testid="didit-document-picker">
      <div className="flex items-start gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-4">
        <ShieldCheck className="h-6 w-6 shrink-0 text-cyan-300" />
        <div>
          <p className="text-sm font-semibold text-white">Identificação oficial</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            Validação final na Didit via BFF — sem chave no navegador.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {(['RG', 'CNH'] as const).map((type) => (
          <button
            key={type}
            type="button"
            data-testid={type === 'RG' ? 'didit-pick-rg' : 'didit-pick-cnh'}
            onClick={() => {
              onPickType(type);
              if (type === 'RG') onPickFormat('physical');
            }}
            className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all ${
              documentType === type
                ? 'border-cyan-400/50 bg-cyan-500/10 shadow-[0_0_20px_rgba(34,211,238,0.08)]'
                : 'border-white/10 bg-white/5 hover:border-cyan-400/30'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`rounded-xl p-2.5 ${
                  documentType === type ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/5 text-gray-400'
                }`}
              >
                {type === 'RG' ? <IdCard className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {type === 'RG' ? 'RG — frente e verso' : 'CNH — física ou CNH-e'}
                </p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-gray-500">
                  {type === 'RG' ? 'Carteira de identidade' : 'Carteira de habilitação'}
                </p>
              </div>
            </div>
            <div
              className={`h-4 w-4 rounded-full border ${
                documentType === type ? 'border-cyan-400 bg-cyan-400' : 'border-gray-600'
              }`}
            />
          </button>
        ))}
      </div>

      {documentType === 'CNH' && (
        <div className="flex gap-2">
          <button
            type="button"
            data-testid="didit-cnh-physical"
            onClick={() => onPickFormat('physical')}
            className={`flex-1 rounded-xl border py-2.5 text-[10px] font-bold uppercase tracking-widest ${
              documentFormat === 'physical'
                ? 'border-cyan-400 bg-cyan-500/10 text-cyan-300'
                : 'border-white/10 text-gray-500'
            }`}
          >
            Cartão físico
          </button>
          <button
            type="button"
            data-testid="didit-cnh-digital"
            onClick={() => onPickFormat('digital')}
            className={`flex-1 rounded-xl border py-2.5 text-[10px] font-bold uppercase tracking-widest ${
              documentFormat === 'digital'
                ? 'border-cyan-400 bg-cyan-500/10 text-cyan-300'
                : 'border-white/10 text-gray-500'
            }`}
          >
            CNH-e PDF
          </button>
        </div>
      )}

      <button
        type="button"
        data-testid="didit-start-opening"
        disabled={!documentType || continuing}
        onClick={onContinue}
        className="regenera-primary-btn w-full disabled:cursor-not-allowed disabled:opacity-40"
      >
        {continuing ? (
          <span className="inline-flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Abrindo verificação Didit…
          </span>
        ) : (
          'Iniciar abertura'
        )}
      </button>

      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="w-full py-2 text-[10px] uppercase tracking-widest text-gray-500 hover:text-gray-300"
        >
          Voltar ao login
        </button>
      )}

      <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400/80" />
        <p className="text-[11px] leading-relaxed text-slate-400">
          A abertura exige validação cadastral, verificação documental na Didit, análise de
          elegibilidade e regras de compliance. Documento e selfie são capturados apenas no iframe
          seguro.
        </p>
      </div>
    </div>
  </section>
);

export default VerificationCaptureScreen;