/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useState } from 'react';
import { Briefcase, HeartHandshake } from 'lucide-react';
import type { BankingModuleProps } from '../../types';
import {
  centsToReais,
  fetchCreditOffers,
  type CreditOfferDto,
} from '../../platform/bff-client';
import SandboxBanner from '../UI/SandboxBanner';

const formatBrl = (cents: string) =>
  centsToReais(cents).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const CreditModule: React.FC<BankingModuleProps> = ({ accessToken, onNavigate }) => {
  const [offers, setOffers] = useState<CreditOfferDto[]>([]);

  useEffect(() => {
    if (!accessToken) return;
    void fetchCreditOffers(accessToken)
      .then(setOffers)
      .catch(() => setOffers([]));
  }, [accessToken]);

  return (
    <div className="p-6 space-y-6 pb-32" data-testid="view-credit">
      <SandboxBanner label="Sandbox crédito · GET /products/credit/offers" />
      <h2 className="text-xl font-bold text-white flex items-center gap-3">
        <Briefcase className="w-6 h-6 text-indigo-400" />
        Linhas de crédito
      </h2>
      <div className="space-y-3">
        {offers.map((offer) => (
          <button
            key={offer.id}
            type="button"
            onClick={() => onNavigate('support')}
            className="w-full text-left bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-indigo-400/40"
          >
            <p className="font-bold text-white">{offer.name}</p>
            <p className="text-sm text-gray-400 mt-1">
              Até {formatBrl(offer.maxAmountCents)} · {offer.ratePct}% a.m.
            </p>
          </button>
        ))}
        {offers.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-8">Nenhuma oferta no BFF.</p>
        )}
      </div>
    </div>
  );
};

export const SeniorModule: React.FC<BankingModuleProps> = ({ onNavigate }) => (
  <div className="p-6 space-y-6 pb-32" data-testid="view-senior">
    <SandboxBanner label="Módulo Senior · atendimento via Raphaela / suporte" />
    <div className="text-center py-12 space-y-4">
      <HeartHandshake className="w-16 h-16 text-rose-400 mx-auto" />
      <h2 className="text-2xl font-bold text-white">Conta Senior</h2>
      <p className="text-sm text-gray-400 max-w-sm mx-auto">
        Serviços dedicados e SOS via canal de suporte. Domínio parceiro pendente de
        EXTERNAL_ACTIVATION.
      </p>
      <button
        type="button"
        onClick={() => onNavigate('support')}
        className="px-6 py-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold uppercase tracking-widest"
      >
        Falar com suporte
      </button>
    </div>
  </div>
);