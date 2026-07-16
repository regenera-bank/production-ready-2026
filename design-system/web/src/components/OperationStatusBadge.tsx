import React from 'react';

/** Aligned with domains/core-bank/src/payments/payment.entity.ts PaymentStatus */
export type OperationStatus =
  | 'CREATED'
  | 'AUTHORIZED'
  | 'SENT'
  | 'SETTLED'
  | 'UNKNOWN'
  | 'FAILED'
  | 'RECONCILED'
  | 'PROCESSING'
  | 'BLOCKED'
  | 'STEP_UP_REQUIRED';

export interface OperationStatusBadgeProps {
  status: OperationStatus;
  size?: 'sm' | 'md';
  className?: string;
}

const statusConfig: Record<
  OperationStatus,
  { label: string; bg: string; color: string; border: string }
> = {
  CREATED: {
    label: 'Criada',
    bg: 'rgba(148, 163, 184, 0.15)',
    color: '#94a3b8',
    border: 'rgba(148, 163, 184, 0.3)',
  },
  AUTHORIZED: {
    label: 'Autorizada',
    bg: 'rgba(34, 211, 238, 0.12)',
    color: '#67e8f9',
    border: 'rgba(34, 211, 238, 0.35)',
  },
  PROCESSING: {
    label: 'Processando',
    bg: 'rgba(34, 211, 238, 0.12)',
    color: '#22d3ee',
    border: 'rgba(34, 211, 238, 0.35)',
  },
  SENT: {
    label: 'Enviada',
    bg: 'rgba(30, 58, 138, 0.35)',
    color: '#93c5fd',
    border: 'rgba(30, 58, 138, 0.5)',
  },
  SETTLED: {
    label: 'Liquidada',
    bg: 'rgba(16, 185, 129, 0.15)',
    color: '#34d399',
    border: 'rgba(16, 185, 129, 0.35)',
  },
  RECONCILED: {
    label: 'Reconciliada',
    bg: 'rgba(16, 185, 129, 0.2)',
    color: '#10b981',
    border: 'rgba(16, 185, 129, 0.4)',
  },
  UNKNOWN: {
    label: 'Indeterminada',
    bg: 'rgba(217, 70, 239, 0.15)',
    color: '#e879f9',
    border: 'rgba(217, 70, 239, 0.4)',
  },
  FAILED: {
    label: 'Falhou',
    bg: 'rgba(244, 63, 94, 0.15)',
    color: '#fb7185',
    border: 'rgba(244, 63, 94, 0.35)',
  },
  BLOCKED: {
    label: 'Bloqueada',
    bg: 'rgba(245, 158, 11, 0.15)',
    color: '#fbbf24',
    border: 'rgba(245, 158, 11, 0.35)',
  },
  STEP_UP_REQUIRED: {
    label: 'Confirmação extra',
    bg: 'rgba(245, 158, 11, 0.15)',
    color: '#f59e0b',
    border: 'rgba(245, 158, 11, 0.35)',
  },
};

export const OperationStatusBadge: React.FC<OperationStatusBadgeProps> = ({
  status,
  size = 'md',
  className,
}) => {
  const config = statusConfig[status];

  return (
    <span
      className={className}
      data-testid="operation-status-badge"
      role="status"
      aria-label={`Status: ${config.label}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: size === 'sm' ? '0.125rem 0.5rem' : '0.25rem 0.625rem',
        borderRadius: '9999px',
        fontFamily: 'var(--regenera-font-sans)',
        fontSize: size === 'sm' ? '0.625rem' : '0.75rem',
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        background: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
      }}
    >
      <span
        style={{
          width: size === 'sm' ? '5px' : '6px',
          height: size === 'sm' ? '5px' : '6px',
          borderRadius: '50%',
          background: config.color,
          boxShadow: status === 'UNKNOWN' ? `0 0 8px ${config.color}` : undefined,
        }}
      />
      {config.label}
    </span>
  );
};