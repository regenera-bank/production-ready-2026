import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import {
  CardsAdapterKind,
  CardsCommand,
  CardsHealth,
  CardsPort,
  CardsResult,
} from '../../ports/cards.port';

type CardStatus = 'active' | 'locked' | 'blocked';

export interface SandboxCard {
  id: string;
  alias: string;
  number: string;
  holder: string;
  expiry: string;
  cvv: string;
  limitCents: string;
  usedCents: string;
  brand: 'mastercard' | 'visa';
  type: string;
  status: CardStatus;
  virtual: boolean;
}

interface SandboxInvoice {
  cardId: string;
  period: string;
  dueDate: string;
  totalCents: string;
  minimumCents: string;
  status: 'open' | 'paid';
}

interface SandboxCardTransaction {
  id: string;
  cardId: string;
  title: string;
  amountCents: string;
  date: string;
  category: string;
}

const seedCards = (principalId: string): SandboxCard[] => {
  const suffix = principalId.replace(/\D/g, '').slice(-4).padStart(4, '0');
  const year = (new Date().getFullYear() + 4) % 100;
  const expiry = `12/${String(year).padStart(2, '0')}`;
  return [
    {
      id: `debit-${principalId}`,
      alias: 'Regenera Débito',
      number: `5502 8800 1200 ${suffix}`,
      holder: 'TITULAR CONTA',
      expiry,
      cvv: '---',
      limitCents: '500000',
      usedCents: '12500',
      brand: 'mastercard',
      type: 'black',
      status: 'active',
      virtual: false,
    },
    {
      id: `digital-${principalId}`,
      alias: 'Carteira Digital',
      number: `4829 0100 3400 ${suffix}`,
      holder: 'TITULAR CONTA',
      expiry: `09/${String(year).padStart(2, '0')}`,
      cvv: '---',
      limitCents: '200000',
      usedCents: '4500',
      brand: 'visa',
      type: 'infinite',
      status: 'active',
      virtual: true,
    },
  ];
};

@Injectable()
export class CardsSandboxAdapter implements CardsPort {
  readonly kind: CardsAdapterKind = 'sandbox';
  private readonly idempotency = new Map<string, CardsResult>();
  private readonly cardsByPrincipal = new Map<string, SandboxCard[]>();
  private readonly invoices = new Map<string, SandboxInvoice[]>();
  private readonly transactions = new Map<string, SandboxCardTransaction[]>();

  async health(): Promise<CardsHealth> {
    return {
      ok: true,
      domain: 'cards',
      adapter: 'sandbox',
    };
  }

  async execute(command: CardsCommand): Promise<CardsResult> {
    const cached = this.idempotency.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }

    const action = String(command.payload.action ?? 'unknown');
    const result = this.dispatch(action, command);
    this.idempotency.set(command.idempotencyKey, result);
    return result;
  }

  private dispatch(action: string, command: CardsCommand): CardsResult {
    const principalId = command.principalId;
    const cards = this.ensureCards(principalId);

    switch (action) {
      case 'list_cards':
        return this.accept(command, { cards });
      case 'get_card': {
        const cardId = String(command.payload.cardId ?? '');
        const card = cards.find((c) => c.id === cardId);
        if (!card) {
          return this.reject(command, 'CARD_NOT_FOUND');
        }
        return this.accept(command, { card });
      }
      case 'block_card':
      case 'lock_card':
        return this.setStatus(command, cards, 'locked');
      case 'unblock_card':
      case 'unlock_card':
        return this.setStatus(command, cards, 'active');
      case 'update_limit': {
        const cardId = String(command.payload.cardId ?? '');
        const limitCents = String(command.payload.limitCents ?? '');
        if (!/^\d{1,19}$/.test(limitCents)) {
          return this.reject(command, 'INVALID_LIMIT');
        }
        const card = cards.find((c) => c.id === cardId);
        if (!card) {
          return this.reject(command, 'CARD_NOT_FOUND');
        }
        card.limitCents = limitCents;
        return this.accept(command, { card });
      }
      case 'get_invoice': {
        const cardId = String(command.payload.cardId ?? '');
        const invoice = this.ensureInvoice(principalId, cardId);
        return this.accept(command, { invoice });
      }
      case 'list_transactions': {
        const cardId = String(command.payload.cardId ?? '');
        const items = this.ensureTransactions(principalId, cardId);
        return this.accept(command, { items });
      }
      case 'create_virtual_card': {
        const virtual: SandboxCard = {
          id: `virtual-${randomUUID()}`,
          alias: 'Cartão Virtual',
          number: `4000 1200 ${randomUUID().replace(/-/g, '').slice(0, 4)} ${randomUUID().replace(/-/g, '').slice(0, 4)}`,
          holder: 'TITULAR CONTA',
          expiry: `06/${String((new Date().getFullYear() + 2) % 100).padStart(2, '0')}`,
          cvv: '---',
          limitCents: String(command.payload.limitCents ?? '50000'),
          usedCents: '0',
          brand: 'visa',
          type: 'virtual',
          status: 'active',
          virtual: true,
        };
        cards.push(virtual);
        return this.accept(command, { card: virtual });
      }
      case 'activation_status':
        return this.accept(command, {
          externalProviderActive: false,
          message: 'EXTERNAL_ACTIVATION_REQUIRED — processador de cartões não ativo em homolog',
          sandbox: true,
        });
      default:
        return this.reject(command, `UNSUPPORTED_ACTION:${action}`);
    }
  }

  private ensureCards(principalId: string): SandboxCard[] {
    let cards = this.cardsByPrincipal.get(principalId);
    if (!cards) {
      cards = seedCards(principalId);
      this.cardsByPrincipal.set(principalId, cards);
    }
    return cards;
  }

  private ensureInvoice(principalId: string, cardId: string): SandboxInvoice {
    const key = `${principalId}:${cardId}`;
    let list = this.invoices.get(key);
    if (!list) {
      list = [
        {
          cardId,
          period: new Date().toISOString().slice(0, 7),
          dueDate: new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10),
          totalCents: '12500',
          minimumCents: '1250',
          status: 'open',
        },
      ];
      this.invoices.set(key, list);
    }
    return list[0];
  }

  private ensureTransactions(principalId: string, cardId: string): SandboxCardTransaction[] {
    const key = `${principalId}:${cardId}`;
    let list = this.transactions.get(key);
    if (!list) {
      list = [
        {
          id: randomUUID(),
          cardId,
          title: 'Compra sandbox',
          amountCents: '4590',
          date: new Date().toISOString(),
          category: 'lifestyle',
        },
        {
          id: randomUUID(),
          cardId,
          title: 'Assinatura streaming',
          amountCents: '2990',
          date: new Date(Date.now() - 86_400_000).toISOString(),
          category: 'leisure',
        },
      ];
      this.transactions.set(key, list);
    }
    return list;
  }

  private setStatus(
    command: CardsCommand,
    cards: SandboxCard[],
    status: CardStatus,
  ): CardsResult {
    const cardId = String(command.payload.cardId ?? '');
    const card = cards.find((c) => c.id === cardId);
    if (!card) {
      return this.reject(command, 'CARD_NOT_FOUND');
    }
    card.status = status;
    return this.accept(command, { card });
  }

  private accept(command: CardsCommand, metadata: Record<string, unknown>): CardsResult {
    return {
      referenceId: `sbx-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: { tier: 'sandbox', principalId: command.principalId, ...metadata },
    };
  }

  private reject(command: CardsCommand, reason: string): CardsResult {
    return {
      referenceId: `sbx-rej-${command.idempotencyKey}`,
      status: 'REJECTED',
      metadata: { tier: 'sandbox', principalId: command.principalId, reason },
    };
  }
}