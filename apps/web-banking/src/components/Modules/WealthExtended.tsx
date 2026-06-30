
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useMemo } from 'react';
import {
  Shield, Umbrella, TrendingUp, AlertCircle, PiggyBank, Briefcase, ChevronRight,
} from 'lucide-react';
import type { BankingModuleProps } from '../../types';
import PremiumChart from '../UI/PremiumChart';
import {
  activityScore,
  balanceTrend,
  sumOutflows,
} from '../../platform/module-data';

const formatBrl = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const LoansModule: React.FC<BankingModuleProps> = ({ user, transactions, onNavigate }) => {
  const score = activityScore(user, transactions);
  const preApproved = user.balance > 0 ? Math.floor(user.balance * 1.5) : 0;

  return (
    <div className="p-6 space-y-8 animate-in slide-in-from-right duration-500 pb-32">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-indigo-950 to-bg-deep border border-indigo-500/20 p-8 shadow-2xl">
        <div className="flex justify-between items-start relative z-10">
          <div>
            <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest mb-1">
              Score de relacionamento
            </p>
            <h2 className="text-6xl font-bold text-white tracking-tighter">{score}</h2>
            <p className="text-xs text-gray-400 mt-2">
              Baseado em {transactions.length} lançamentos e saldo em conta
            </p>
          </div>
          <TrendingUp className="w-12 h-12 text-indigo-400 opacity-60" />
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">
          Linhas disponíveis sobre saldo
        </h3>
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => onNavigate('support')}
            className="w-full text-left bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-primary/50 transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                <Briefcase className="w-6 h-6 text-primary" />
              </div>
              <span className="text-[10px] text-emerald-400 font-bold uppercase border border-emerald-500/20 px-2 py-1 rounded">
                Provisório
              </span>
            </div>
            <h4 className="text-lg font-bold text-white mb-1">Crédito pessoal</h4>
            <p className="text-sm text-gray-400 mb-4">
              Teto indicativo: 150% do saldo atual — sujeito a motor de crédito Onda B.
            </p>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-bold text-white">{formatBrl(preApproved)}</span>
              <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('profile')}
            className="w-full text-left bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-indigo-500/50 transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-indigo-500/10 rounded-xl">
                <Shield className="w-6 h-6 text-indigo-400" />
              </div>
            </div>
            <h4 className="text-lg font-bold text-white mb-1">Garantia futura</h4>
            <p className="text-sm text-gray-400">
              Produtos com garantia real dependem de integração com custódia de garantias.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};

export const SavingsModule: React.FC<BankingModuleProps> = ({ user, transactions }) => {
  const chartData = useMemo(
    () => balanceTrend(transactions, user.balance),
    [transactions, user.balance],
  );
  const goals = useMemo(() => {
    const reserveTarget = Math.max(user.balance * 2, 1000);
    const travelTarget = Math.max(user.balance * 0.5, 500);
    return [
      {
        title: 'Reserva (saldo atual)',
        target: reserveTarget,
        current: user.balance,
        color: 'bg-emerald-500',
      },
      {
        title: 'Meta viagem',
        target: travelTarget,
        current: Math.min(user.availableBalance * 0.3, travelTarget),
        color: 'bg-cyan-500',
      },
    ];
  }, [user]);

  return (
    <div className="p-6 space-y-8 animate-in slide-in-from-right duration-500 pb-32">
      <div className="bg-gradient-to-br from-emerald-900/40 to-bg-mid border border-emerald-500/20 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="p-3 bg-emerald-500/10 rounded-xl">
            <PiggyBank className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Poupança & reserva</h2>
            <p className="text-xs text-emerald-400/70 uppercase tracking-widest font-bold">
              Saldo auditável
            </p>
          </div>
        </div>
        <div className="h-40 w-full relative z-10">
          <PremiumChart data={chartData} color="#34d399" height={150} />
        </div>
        <div className="mt-6 flex justify-between items-center text-sm relative z-10 bg-black/20 p-4 rounded-xl border border-white/5">
          <span className="text-gray-400">Total em conta</span>
          <span className="font-bold text-white text-2xl">{formatBrl(user.balance)}</span>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">
          Objetivos (derivados do saldo)
        </h3>
        {goals.map((goal) => (
          <div
            key={goal.title}
            className="bg-white/5 border border-white/5 p-5 rounded-2xl mb-4"
          >
            <div className="flex justify-between mb-3">
              <span className="font-bold text-white text-sm">{goal.title}</span>
              <span className="text-xs font-bold text-gray-400 bg-white/10 px-2 py-1 rounded">
                {Math.round((goal.current / goal.target) * 100)}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden mb-3">
              <div
                className={`h-full ${goal.color}`}
                style={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 font-mono">
              <span>{formatBrl(goal.current)}</span>
              <span>Meta: {formatBrl(goal.target)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const InsuranceModule: React.FC<BankingModuleProps> = ({ user, transactions }) => {
  const outflows = sumOutflows(transactions);
  const digitalCover = user.balance > 0 ? Math.min(user.balance, 50_000) : 0;

  return (
    <div className="p-6 space-y-6 animate-in slide-in-from-right duration-500 pb-32">
      <div className="bg-indigo-950/30 border border-indigo-500/30 p-8 rounded-[2rem] flex items-center gap-6">
        <div className="p-4 bg-indigo-500/20 rounded-2xl">
          <Umbrella className="w-10 h-10 text-indigo-400" />
        </div>
        <div>
          <h3 className="font-bold text-white text-xl">Proteção da conta</h3>
          <p className="text-xs text-indigo-300 uppercase tracking-wider mt-1 font-bold">
            Conta ativa · KYC concluído
          </p>
        </div>
      </div>

      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">
        Coberturas derivadas do perfil
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {[
          { name: 'Fraude Pix', val: formatBrl(digitalCover), icon: AlertCircle },
          { name: 'Conta', val: user.accountNumber || 'Ativa', icon: Shield },
          { name: 'Movimentação', val: `${transactions.length} ops`, icon: Umbrella },
          { name: 'Exposição saídas', val: formatBrl(outflows), icon: Shield },
        ].map((ins) => (
          <div
            key={ins.name}
            className="bg-white/5 border border-white/5 p-6 rounded-2xl flex flex-col items-center text-center gap-3"
          >
            <ins.icon className="w-6 h-6 text-gray-400" />
            <span className="font-bold text-white text-sm">{ins.name}</span>
            <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              {ins.val}
            </span>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-bold uppercase tracking-widest"
      >
        Abrir protocolo de sinistro (Onda B)
      </button>
    </div>
  );
};