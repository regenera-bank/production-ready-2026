
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useMemo, useState } from 'react';
import {
  Rocket, ShoppingBag, Plane, Star, MapPin, Tag, Crown, ArrowRight, CheckCircle,
} from 'lucide-react';
import type { BankingModuleProps } from '../../types';
import {
  centsToReais,
  executeLifestyleAction,
  fetchLifestyleCatalog,
  fetchRewards,
  type LifestyleCatalogItemDto,
  type RewardsDto,
} from '../../platform/bff-client';
import { createIdempotencyKey } from '../../platform/money';
import SandboxBanner from '../UI/SandboxBanner';

const LifestyleIntentButton: React.FC<{
  accessToken: string;
  moduleId: string;
  itemId?: string;
  label?: string;
}> = ({ accessToken, moduleId, itemId, label = 'Registrar intenção' }) => {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="mt-2">
      <button
        type="button"
        disabled={busy}
        onClick={(e) => {
          e.stopPropagation();
          setBusy(true);
          setMsg(null);
          void executeLifestyleAction(
            accessToken,
            moduleId,
            'select_item',
            itemId ? { itemId } : {},
            createIdempotencyKey('lifestyle'),
          )
            .then((r) => setMsg(`${r.status} · ${r.referenceId.slice(0, 8)}`))
            .catch((e) => setMsg(e instanceof Error ? e.message : 'Falha'))
            .finally(() => setBusy(false));
        }}
        className="w-full py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-bold uppercase tracking-widest text-cyan-300 disabled:opacity-50"
      >
        {busy ? 'Enviando…' : label}
      </button>
      {msg && <p className="text-[9px] text-gray-500 mt-1 text-center">{msg}</p>}
    </div>
  );
};

const formatBrl = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const useLifestyleCatalog = (accessToken: string, moduleId: string) => {
  const [items, setItems] = useState<LifestyleCatalogItemDto[]>([]);
  useEffect(() => {
    if (!accessToken) {
      return;
    }
    void fetchLifestyleCatalog(accessToken, moduleId)
      .then((catalog) => setItems(catalog.items))
      .catch(() => setItems([]));
  }, [accessToken, moduleId]);
  return items;
};

export const DreamVault: React.FC<BankingModuleProps> = ({ user, accessToken, onNavigate }) => {
  const dreams = useMemo(() => {
    const target = Math.max(user.balance * 3, 10_000);
    return [
      {
        title: 'Reserva Regenera',
        target,
        current: user.balance,
        tone: 'from-fuchsia-900 to-bg-mid',
      },
      {
        title: 'Próximo objetivo',
        target: Math.max(user.availableBalance * 5, 5_000),
        current: user.availableBalance,
        tone: 'from-indigo-900 to-bg-mid',
      },
    ];
  }, [user]);

  return (
    <div className="p-6 space-y-8 animate-in slide-in-from-right duration-500 pb-32" data-testid="view-dreams">
      <SandboxBanner label="Sandbox lifestyle · metas derivadas do saldo BFF" />
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-fuchsia-900 to-bg-mid border border-fuchsia-500/20 p-8 shadow-2xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-fuchsia-500/20 rounded-xl border border-fuchsia-500/30">
            <Rocket className="w-8 h-8 text-fuchsia-400" />
          </div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-wider">Realizar</h2>
        </div>
        <p className="text-gray-300 text-sm max-w-xs leading-relaxed border-l-2 border-fuchsia-500/50 pl-4">
          Metas calculadas a partir do saldo real da sua conta — atualize com Pix e extrato.
        </p>
      </div>

      <div className="space-y-6">
        {dreams.map((dream) => (
          <div
            key={dream.title}
            className={`rounded-[2rem] overflow-hidden border border-white/10 bg-gradient-to-br ${dream.tone} p-6`}
          >
            <div className="flex justify-between items-end mb-3">
              <h3 className="text-xl font-bold text-white">{dream.title}</h3>
              <span className="text-xs font-bold text-fuchsia-400 bg-fuchsia-500/10 px-3 py-1.5 rounded-full border border-fuchsia-500/20">
                {Math.round((dream.current / dream.target) * 100)}%
              </span>
            </div>
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-fuchsia-600 to-pink-500"
                style={{ width: `${Math.min((dream.current / dream.target) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-300 font-mono font-bold">
              <span>{formatBrl(dream.current)}</span>
              <span>Meta: {formatBrl(dream.target)}</span>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onNavigate('pix')}
          className="w-full py-4 border border-dashed border-fuchsia-500/30 bg-fuchsia-500/5 rounded-2xl text-fuchsia-400 text-sm font-bold uppercase tracking-widest hover:bg-fuchsia-500/10"
        >
          + Aportar via Pix
        </button>
        {accessToken && (
          <LifestyleIntentButton accessToken={accessToken} moduleId="dreams" label="Registrar meta no BFF" />
        )}
      </div>
    </div>
  );
};

export const Marketplace: React.FC<BankingModuleProps> = ({
  user,
  accessToken,
  onNavigate,
}) => {
  const bffItems = useLifestyleCatalog(accessToken, 'marketplace');

  const items = useMemo(() => {
    if (bffItems.length > 0) {
      return bffItems.map((item) => ({
        name: item.name,
        price: centsToReais(item.priceCents),
        tag: 'Pix' as const,
        key: item.id,
      }));
    }
    const budget = user.availableBalance;
    return [
      { name: 'Reserva emergência', price: Math.min(budget * 0.2, budget), tag: 'Essencial' as const, key: 'local-1' },
      { name: 'Aporte investimento', price: Math.min(budget * 0.5, budget), tag: 'Patrimônio' as const, key: 'local-2' },
      { name: 'Pix presente', price: Math.min(500, budget), tag: 'Pix' as const, key: 'local-3' },
      { name: 'Transferência interna', price: Math.min(200, budget), tag: 'Conta' as const, key: 'local-4' },
    ]
      .filter((i) => i.price > 0)
      .map((i) => ({ ...i, tag: i.tag === 'Pix' ? 'Pix' : i.tag === 'Conta' ? 'Conta' : 'Pix' }));
  }, [user.availableBalance, bffItems]);

  return (
    <div className="p-6 space-y-6 animate-in slide-in-from-right duration-500 pb-32" data-testid="view-marketplace">
      <SandboxBanner label="Sandbox lifestyle · GET /lifestyle/marketplace/catalog" />
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-3">
          <ShoppingBag className="text-cyan-400 w-5 h-5" />
          Marketplace conta
        </h2>
        <span className="text-[10px] font-bold bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-full border border-cyan-500/20 uppercase">
          Orçamento: {formatBrl(user.availableBalance)}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">
          Sem saldo disponível — faça um Pix para liberar ações.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {items.map((item) => (
            <div
              key={item.key}
              className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden text-left hover:border-cyan-400/30 transition-all"
            >
              <button
                type="button"
                onClick={() => onNavigate(item.tag === 'Pix' ? 'pix' : 'transfer')}
                className="w-full text-left"
              >
                <div className="h-24 bg-gradient-to-br from-cyan-900/30 to-bg-mid flex items-center justify-center">
                  <Tag className="w-8 h-8 text-cyan-400 opacity-60" />
                </div>
                <div className="p-4 pb-0">
                  <h3 className="font-bold text-white text-sm truncate mb-1">{item.name}</h3>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-400 text-xs font-mono">{formatBrl(item.price)}</span>
                    <ArrowRight className="w-4 h-4 text-cyan-400" />
                  </div>
                </div>
              </button>
              {bffItems.length > 0 && item.key && !String(item.key).startsWith('local') && (
                <div className="px-4 pb-4">
                  <LifestyleIntentButton
                    accessToken={accessToken}
                    moduleId="marketplace"
                    itemId={String(item.key)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const Rewards: React.FC<BankingModuleProps> = ({ accessToken }) => {
  const bffItems = useLifestyleCatalog(accessToken, 'rewards');
  const [rewards, setRewards] = useState<RewardsDto | null>(null);
  const [rewardsError, setRewardsError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setRewardsError(null);
    fetchRewards(accessToken)
      .then((data) => { if (active) setRewards(data); })
      .catch(() => { if (active) setRewardsError('Pontuação indisponível no momento'); });
    return () => { active = false; };
  }, [accessToken]);

  const perks =
    bffItems.length > 0
      ? bffItems.map((item) => item.name)
      : ['Cashback Pix', 'Upgrade conta', 'Isenção tarifa', 'Prioridade suporte'];

  const tierLabel: Record<RewardsDto['tier'], string> = {
    SEMENTE: 'Semente', RAIZ: 'Raiz', COPA: 'Copa', FLORESTA: 'Floresta',
  };

  return (
    <div className="p-6 space-y-8 animate-in slide-in-from-right duration-500 pb-32" data-testid="view-rewards">
      <div className="text-center relative py-8">
        <Crown className="w-20 h-20 text-amber-400 mx-auto mb-4" strokeWidth={1} />
        {rewardsError ? (
          <>
            <h2 className="text-2xl font-bold text-gray-400">—</h2>
            <p className="text-xs text-amber-400/80 mt-2">{rewardsError}</p>
            <button
              type="button"
              onClick={() => {
                setRewardsError(null);
                fetchRewards(accessToken)
                  .then(setRewards)
                  .catch(() => setRewardsError('Pontuação indisponível no momento'));
              }}
              className="mt-3 text-[10px] uppercase tracking-widest text-cyan-400 font-bold"
            >
              Tentar novamente
            </button>
          </>
        ) : !rewards ? (
          <>
            <div className="h-12 w-40 mx-auto rounded-xl bg-white/5 animate-pulse" />
            <p className="text-xs text-gray-500 uppercase tracking-[0.3em] font-bold mt-3">
              Carregando pontos…
            </p>
          </>
        ) : (
          <>
            <h2 className="text-5xl font-bold text-white tracking-tighter">
              {rewards.pointsBalance.toLocaleString('pt-BR')}
            </h2>
            <p className="text-xs text-amber-400 uppercase tracking-[0.3em] font-bold mt-2">
              Nível {tierLabel[rewards.tier]}
            </p>
            <p className="text-[10px] text-gray-500 mt-4 max-w-xs mx-auto">
              Calculados pelo banco ({rewards.programVersion}) a partir do seu extrato.
              {rewards.nextTierAt !== null &&
                ` Faltam ${(rewards.nextTierAt - rewards.pointsBalance).toLocaleString('pt-BR')} pts para o próximo nível.`}
            </p>
          </>
        )}
      </div>

      {rewards && (
        <div className="space-y-3">
          {rewards.accruals.map((row) => (
            <div
              key={row.label}
              className="flex justify-between items-center bg-white/5 border border-white/5 p-4 rounded-2xl"
            >
              <span className="text-sm text-gray-300">{row.label}</span>
              <span className="font-bold text-amber-400">+{row.points.toLocaleString('pt-BR')}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {perks.map((perk, idx) => (
          <div
            key={perk}
            className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-2xl flex flex-col items-center gap-2 text-center"
          >
            <Star className="w-5 h-5 text-amber-400" />
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">{perk}</span>
            <CheckCircle className="w-4 h-4 text-gray-600" />
            {bffItems[idx] && (
              <LifestyleIntentButton
                accessToken={accessToken}
                moduleId="rewards"
                itemId={bffItems[idx].id}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const TravelConcierge: React.FC<BankingModuleProps> = ({ user, accessToken, onNavigate }) => {
  const bffItems = useLifestyleCatalog(accessToken, 'travel');
  const trips =
    bffItems.length > 0
      ? bffItems.map((item, idx) => ({
          city: item.name,
          note: formatBrl(centsToReais(item.priceCents)),
          icon: idx === 0 ? MapPin : Plane,
        }))
      : [
          { city: 'São Paulo', note: 'Base da conta', icon: MapPin },
          { city: 'Destino nacional', note: 'Consultar câmbio via Raphaela', icon: Plane },
        ];

  return (
    <div className="p-6 space-y-6 animate-in slide-in-from-right duration-500 pb-32" data-testid="view-travel">
      <SandboxBanner label="Sandbox lifestyle · GET /lifestyle/travel/catalog" />
      <div className="bg-gradient-to-br from-blue-950 to-bg-mid border border-blue-500/20 rounded-[2rem] p-8">
        <div className="flex items-center gap-4 mb-4">
          <Plane className="w-10 h-10 text-blue-400" />
          <h2 className="text-2xl font-bold text-white">Viagens</h2>
        </div>
        <p className="text-sm text-gray-400 leading-relaxed">
          Orçamento de viagem sugerido com base no disponível:{' '}
          <strong className="text-white">{formatBrl(user.availableBalance * 0.15)}</strong>
        </p>
      </div>

      <div className="space-y-4">
        {trips.map((trip, idx) => (
          <div
            key={trip.city}
            className="bg-white/5 border border-white/5 p-5 rounded-2xl flex items-center gap-4"
          >
            <trip.icon className="w-6 h-6 text-cyan-400" />
            <div className="flex-1">
              <p className="font-bold text-white">{trip.city}</p>
              <p className="text-xs text-gray-500">{trip.note}</p>
              {bffItems[idx] && (
                <LifestyleIntentButton
                  accessToken={accessToken}
                  moduleId="travel"
                  itemId={bffItems[idx].id}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onNavigate('support')}
        className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-bold uppercase tracking-widest text-xs"
      >
        Falar com Raphaela (viagens)
      </button>
    </div>
  );
};