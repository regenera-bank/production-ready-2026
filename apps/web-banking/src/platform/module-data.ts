/**
 * Derivações do extrato/saldo BFF — não contém valores financeiros hardcoded.
 * Saldo oficial vem de fetchDashboard; aqui só agregações para gráficos UI.
 */
import type { Transaction } from '../types';

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

// regeneraPoints REMOVIDO (§17: "Não gerar pontos com fórmula local").
// A pontuação agora vem do BFF: GET /products/rewards (fetchRewards).