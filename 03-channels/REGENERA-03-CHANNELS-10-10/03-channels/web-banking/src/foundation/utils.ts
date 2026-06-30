
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility to merge Tailwind classes efficiently, avoiding style conflicts.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number to BRL Currency (R$).
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formats a number to a percentage string.
 */
export function formatPercent(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}

/**
 * Masks a document (CPF/CNPJ) or Account Number.
 */
export function maskSecureData(data: string, visibleDigits: number = 4): string {
  if (data.length <= visibleDigits) return data;
  const maskedLength = data.length - visibleDigits;
  return '•'.repeat(maskedLength) + data.slice(-visibleDigits);
}
