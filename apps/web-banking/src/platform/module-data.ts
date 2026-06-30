import type { Transaction, UserProfile } from '../types';
import type { CardDetails } from '../types';

const formatHolder = (name: string): string =>
  name.trim().toUpperCase() || 'TITULAR CONTA';

const lastFourDigits = (value: string | undefined): string => {
  const digits = (value ?? '').replace(/\D/g, '');
  return digits.slice(-4).padStart(4, '0');
};

export const sumOutflows = (transactions: Transaction[]): number =>
  transactions
    .filter((t) => t.type === 'outflow')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

export const sumInflows = (transactions: Transaction[]): number =>
  transactions
    .filter((t) => t.type === 'inflow')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

export const investmentTransactions = (transactions: Transaction[]): Transaction[] =>
  transactions.filter(
    (t) =>
      t.category === 'investment' ||
      t.title.toLowerCase().includes('aplic') ||
      t.title.toLowerCase().includes('cdb'),
  );

export const buildAccountCards = (
  user: UserProfile,
  transactions: Transaction[],
): CardDetails[] => {
  const last4 = lastFourDigits(user.accountNumber);
  const holder = formatHolder(user.name);
  const used = sumOutflows(transactions);
  const limit = Math.max(user.availableBalance, used, 0);
  const expiryYear = (new Date().getFullYear() + 4) % 100;

  return [
    {
      id: 'debit-primary',
      alias: 'Regenera Débito',
      number: `5502 8800 1200 ${last4}`,
      holder,
      expiry: `12/${String(expiryYear).padStart(2, '0')}`,
      cvv: '---',
      limit,
      used,
      brand: 'mastercard',
      type: 'black',
      status: 'active',
    },
    {
      id: 'digital-wallet',
      alias: 'Carteira Digital',
      number: `4829 0100 3400 ${last4}`,
      holder,
      expiry: `09/${String(expiryYear).padStart(2, '0')}`,
      cvv: '---',
      limit: user.availableBalance,
      used: Math.min(used, user.availableBalance),
      brand: 'visa',
      type: 'infinite',
      status: 'active',
    },
  ];
};

export const balanceTrend = (
  transactions: Transaction[],
  currentBalance: number,
): number[] => {
  if (transactions.length === 0) {
    return [currentBalance];
  }
  const ordered = [...transactions].reverse();
  let running = currentBalance;
  const points: number[] = [running];
  for (const tx of ordered) {
    running -= tx.type === 'inflow' ? tx.amount : -Math.abs(tx.amount);
    points.unshift(running);
  }
  const sliced = points.slice(-8);
  if (sliced.length === 1) {
    return [sliced[0], sliced[0]];
  }
  return sliced.length > 0 ? sliced : [currentBalance, currentBalance];
};

export const activityScore = (
  user: UserProfile,
  transactions: Transaction[],
): number => {
  const base = 520;
  const txBonus = Math.min(transactions.length * 8, 200);
  const balanceBonus = user.balance > 0 ? 80 : 0;
  return Math.min(900, base + txBonus + balanceBonus);
};

export const regeneraPoints = (
  user: UserProfile,
  transactions: Transaction[],
): number =>
  Math.floor(user.balance) + transactions.length * 25 + sumInflows(transactions);