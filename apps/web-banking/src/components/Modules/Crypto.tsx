/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { Bitcoin, Wallet, ArrowUpRight, Coins } from 'lucide-react';
import type { BankingModuleProps } from '../../types';
import PremiumChart from '../UI/PremiumChart';
import { balanceTrend } from '../../platform/module-data';

const formatBrl = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const CryptoModule: React.FC<BankingModuleProps> = ({
  user,
  transactions,
  onNavigate,
}) => {
  const chartData = balanceTrend(transactions, user.balance);

  return (
    <div className="p-0 animate-in fade-in duration-700 pb-32" data-testid="view-crypto">
      <div className="px-6 pt-6 space-y-8">
        <div className="bg-gradient-to-br from-orange-950/40 to-bg-mid border border-orange-500/20 rounded-3xl p-6 relative overflow-hidden">
          <Bitcoin className="absolute top-4 right-4 w-24 h-24 text-orange-500 opacity-10" />
          <p className="text-[10px] text-orange-400 uppercase tracking-widest font-bold mb-2">
            Custódia BRL (conta ativa)
          </p>
          <h2 className="text-3xl font-bold text-white">{formatBrl(user.balance)}</h2>
          <p className="text-xs text-gray-400 mt-2">
            Posição em cripto no ledger: R$ 0,00 — exchange na Onda D
          </p>
          <div className="mt-6 h-16 w-full opacity-80">
            <PremiumChart data={chartData} color="#f97316" height={60} />
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <Coins className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="font-bold text-white mb-2">Nenhum ativo on-chain</h3>
          <p className="text-sm text-gray-400 max-w-sm mx-auto leading-relaxed">
            Seu patrimônio está 100% em reais no core-bank. Quando a custódia cripto
            estiver ligada, as posições aparecerão aqui com saldo auditável.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onNavigate('pix')}
            className="py-4 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-white font-bold text-[10px] uppercase tracking-widest flex flex-col items-center gap-2"
          >
            <Wallet className="w-5 h-5" />
            Depositar (Pix)
          </button>
          <button
            type="button"
            onClick={() => onNavigate('investments')}
            className="py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-gray-300 font-bold text-[10px] uppercase tracking-widest flex flex-col items-center gap-2"
          >
            <ArrowUpRight className="w-5 h-5" />
            Ver patrimônio
          </button>
        </div>
      </div>
    </div>
  );
};