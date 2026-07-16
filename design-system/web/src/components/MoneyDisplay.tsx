import React from 'react';

const CENTS_PATTERN = /^-?\d{1,19}$/;

export type MoneyDisplaySize = 'sm' | 'md' | 'lg' | 'hero';
export type MoneyDisplayVariant = 'default' | 'credit' | 'debit' | 'masked';

export interface MoneyDisplayProps {
  /** Ledger-safe cent string — never pass float/number for money paths. */
  amountCents: string;
  currency?: 'BRL';
  size?: MoneyDisplaySize;
  variant?: MoneyDisplayVariant;
  masked?: boolean;
  showSign?: boolean;
  className?: string;
}

const formatCentsBrl = (cents: string): string => {
  if (!CENTS_PATTERN.test(cents.trim())) {
    return '—';
  }
  const negative = cents.startsWith('-');
  const abs = negative ? cents.slice(1) : cents;
  const intPart = abs.length <= 2 ? '0' : abs.slice(0, -2).replace(/^0+(?=\d)/, '') || '0';
  const fracPart = abs.padStart(3, '0').slice(-2);
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${negative ? '-' : ''}${grouped},${fracPart}`;
};

const sizeStyles: Record<MoneyDisplaySize, React.CSSProperties> = {
  sm: { fontSize: '0.75rem', fontWeight: 600 },
  md: { fontSize: '1rem', fontWeight: 700 },
  lg: { fontSize: '1.5rem', fontWeight: 800 },
  hero: { fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em' },
};

const variantColor: Record<MoneyDisplayVariant, string> = {
  default: 'var(--regenera-on-background)',
  credit: 'var(--regenera-success)',
  debit: 'var(--regenera-error)',
  masked: 'var(--regenera-text-secondary)',
};

export const MoneyDisplay: React.FC<MoneyDisplayProps> = ({
  amountCents,
  currency = 'BRL',
  size = 'md',
  variant = 'default',
  masked = false,
  showSign = false,
  className,
}) => {
  const isMasked = masked || variant === 'masked';
  const formatted = isMasked ? 'R$ ••••••' : `R$ ${formatCentsBrl(amountCents)}`;
  const sign =
    !isMasked && showSign && amountCents !== '0'
      ? amountCents.startsWith('-') || variant === 'debit'
        ? '− '
        : variant === 'credit'
          ? '+ '
          : ''
      : '';

  return (
    <span
      className={className}
      data-testid="money-display"
      style={{
        fontFamily: 'var(--regenera-font-sans)',
        color: variantColor[variant],
        fontVariantNumeric: 'tabular-nums',
        ...sizeStyles[size],
      }}
      aria-label={isMasked ? 'Saldo oculto' : `${sign}${formatted} ${currency}`}
    >
      {sign}
      {formatted}
    </span>
  );
};