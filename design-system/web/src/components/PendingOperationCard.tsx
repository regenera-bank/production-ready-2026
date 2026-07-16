import React from 'react';
import { MoneyDisplay } from './MoneyDisplay';
import { OperationStatusBadge, type OperationStatus } from './OperationStatusBadge';

export interface PendingOperationCardProps {
  title: string;
  subtitle?: string;
  amountCents: string;
  status: OperationStatus;
  timestamp?: string;
  correlationId?: string;
  onAction?: () => void;
  actionLabel?: string;
  className?: string;
}

export const PendingOperationCard: React.FC<PendingOperationCardProps> = ({
  title,
  subtitle,
  amountCents,
  status,
  timestamp,
  correlationId,
  onAction,
  actionLabel = 'Ver detalhes',
  className,
}) => {
  const isPending = ['CREATED', 'AUTHORIZED', 'SENT', 'PROCESSING', 'UNKNOWN'].includes(status);

  return (
    <article
      className={className}
      data-testid="pending-operation-card"
      style={{
        width: '100%',
        maxWidth: '360px',
        padding: '1rem 1.125rem',
        borderRadius: 'var(--regenera-radius-2xl)',
        background: 'var(--regenera-glass)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${isPending ? 'rgba(34, 211, 238, 0.22)' : 'var(--regenera-border)'}`,
        boxShadow: isPending ? '0 0 18px rgba(34, 211, 238, 0.08)' : 'none',
        fontFamily: 'var(--regenera-font-sans)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
        <div style={{ minWidth: 0 }}>
          <h3
            style={{
              margin: 0,
              fontSize: '0.875rem',
              fontWeight: 700,
              color: 'var(--regenera-on-background)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </h3>
          {subtitle ? (
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--regenera-text-secondary)' }}>
              {subtitle}
            </p>
          ) : null}
        </div>
        <OperationStatusBadge status={status} size="sm" />
      </div>

      <div style={{ marginTop: '0.875rem', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <MoneyDisplay
          amountCents={amountCents}
          size="lg"
          variant={amountCents.startsWith('-') ? 'debit' : 'default'}
        />
        {timestamp ? (
          <time style={{ fontSize: '0.625rem', color: 'var(--regenera-text-secondary)', fontWeight: 600 }}>
            {timestamp}
          </time>
        ) : null}
      </div>

      {correlationId ? (
        <p
          style={{
            margin: '0.625rem 0 0',
            fontSize: '0.625rem',
            color: 'var(--regenera-text-secondary)',
            fontFamily: 'ui-monospace, monospace',
            opacity: 0.8,
          }}
        >
          {correlationId}
        </p>
      ) : null}

      {onAction ? (
        <button
          type="button"
          onClick={onAction}
          style={{
            marginTop: '0.875rem',
            width: '100%',
            padding: '0.625rem 1rem',
            borderRadius: 'var(--regenera-radius-lg)',
            border: '1px solid rgba(34, 211, 238, 0.35)',
            background: 'rgba(34, 211, 238, 0.08)',
            color: 'var(--regenera-primary)',
            fontFamily: 'inherit',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: `background 200ms var(--regenera-transition)`,
          }}
        >
          {actionLabel}
        </button>
      ) : null}
    </article>
  );
};