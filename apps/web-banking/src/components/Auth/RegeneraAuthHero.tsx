import React from 'react';
import { Fingerprint, Lock } from 'lucide-react';

interface RegeneraAuthHeroProps {
  scanning?: boolean;
  onBiometricTap?: () => void;
  biometricDisabled?: boolean;
  showBiometric?: boolean;
}

const RegeneraAuthHero: React.FC<RegeneraAuthHeroProps> = ({
  scanning = false,
  onBiometricTap,
  biometricDisabled = false,
  showBiometric = false,
}) => (
  <section className="flex flex-col items-center w-full" aria-labelledby="regenera-brand-title">
    <div className="regenera-security-stage" aria-hidden="true">
      <i className="regenera-stage-corner regenera-stage-corner-tl" />
      <i className="regenera-stage-corner regenera-stage-corner-tr" />
      <i className="regenera-stage-corner regenera-stage-corner-bl" />
      <i className="regenera-stage-corner regenera-stage-corner-br" />
      <div className="regenera-stage-halo" />
      <div className="regenera-stage-ring" />
      <div className="regenera-stage-orbit" />
      {scanning && <div className="regenera-stage-scan" />}
      <div className="regenera-hologram">
        <svg viewBox="0 0 96 96" fill="none" className="regenera-hologram-svg">
          <path
            className="regenera-shield-wire"
            d="M48 8 75 21.5v19.8c0 21.8-12 36.8-27 43.7-15-6.9-27-21.9-27-43.7V21.5L48 8Z"
            fill="rgba(88,214,255,.08)"
            stroke="currentColor"
            strokeWidth="4.8"
            strokeLinejoin="round"
          />
          <path
            d="M48 18 65 27v14.2c0 14-6.8 23.6-17 29-10.2-5.4-17-15-17-29V27l17-9Z"
            fill="rgba(18, 68, 132, .34)"
            stroke="rgba(184,241,255,.54)"
            strokeWidth="1.8"
          />
          <rect x="35" y="42.5" width="26" height="23.5" rx="5.2" fill="currentColor" opacity=".82" />
          <path
            d="M40 42.5V34a8 8 0 0 1 16 0v8.5"
            stroke="currentColor"
            strokeWidth="5.4"
            strokeLinecap="round"
          />
          <circle cx="48" cy="54.5" r="3.4" fill="#061c36" />
          <path d="M48 58v6.5" stroke="#061c36" strokeWidth="3.3" strokeLinecap="round" />
          <path
            className="regenera-circuit-wire"
            d="M25 33h10M61 33h10M24 48h8M64 48h8M30 66h8M58 66h8"
            stroke="rgba(184,241,255,.72)"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
        {showBiometric && onBiometricTap && (
          <button
            type="button"
            onClick={onBiometricTap}
            disabled={biometricDisabled}
            className="absolute inset-0 z-10 m-auto flex h-[72%] w-[72%] items-center justify-center rounded-full border border-cyan-400/25 bg-cyan-500/5 text-cyan-300 transition hover:scale-[1.03] disabled:opacity-40"
            aria-label="Touch ID"
          >
            <Fingerprint className="h-10 w-10" />
          </button>
        )}
      </div>
    </div>

    <h1
      id="regenera-brand-title"
      className="regenera-brand-title mt-2 text-center"
    >
      <span className="regenera-brand-regenera">Regenera</span>{' '}
      <span className="regenera-brand-bank">Bank</span>
    </h1>
    <p className="mt-2 text-center font-mono text-[9px] font-medium uppercase tracking-[0.28em] text-slate-400">
      International Private Banking
    </p>
  </section>
);

export const RegeneraTrustStrip: React.FC = () => (
  <div
    className="regenera-trust-strip my-5 grid w-full grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-0"
    aria-label="Credenciais institucionais"
  >
    {[
      'Segurança bancária',
      'Conta internacional',
      'Regeneração Financeira',
    ].map((label, idx) => (
      <div
        key={label}
        className={`flex min-h-[34px] items-center justify-center gap-2 px-2 text-center text-[11px] text-slate-300 ${
          idx > 0 ? 'sm:border-l sm:border-cyan-400/15' : ''
        }`}
      >
        <Lock className="h-4 w-4 shrink-0 text-cyan-300" />
        <span className="whitespace-nowrap">{label}</span>
      </div>
    ))}
  </div>
);

export default RegeneraAuthHero;