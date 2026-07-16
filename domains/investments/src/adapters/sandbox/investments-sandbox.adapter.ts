import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import {
  InvestmentsAdapterKind,
  InvestmentsCommand,
  InvestmentsHealth,
  InvestmentsPort,
  InvestmentsResult,
} from '../../ports/investments.port';

type SuitabilityProfile = 'conservative' | 'moderate' | 'aggressive';
type OrderStatus = 'pending' | 'filled' | 'cancelled' | 'rejected';

interface SandboxCatalogItem {
  id: string;
  name: string;
  type: 'cdb' | 'lci' | 'fund';
  minAmountCents: string;
  expectedYieldPct: string;
  risk: SuitabilityProfile;
}

interface SandboxPosition {
  productId: string;
  productName: string;
  amountCents: string;
  yieldPct: string;
}

interface SandboxOrder {
  id: string;
  productId: string;
  productName: string;
  amountCents: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

const CATALOG: SandboxCatalogItem[] = [
  {
    id: 'cdb-homolog',
    name: 'CDB Homolog Sandbox',
    type: 'cdb',
    minAmountCents: '50',
    expectedYieldPct: '100.0',
    risk: 'conservative',
  },
  {
    id: 'cdb-110',
    name: 'CDB Regenera 110% CDI',
    type: 'cdb',
    minAmountCents: '10000',
    expectedYieldPct: '110.0',
    risk: 'conservative',
  },
  {
    id: 'lci-95',
    name: 'LCI Isenta 95% CDI',
    type: 'lci',
    minAmountCents: '50000',
    expectedYieldPct: '95.0',
    risk: 'moderate',
  },
  {
    id: 'fund-multi',
    name: 'Fundo Multimercado Sandbox',
    type: 'fund',
    minAmountCents: '100000',
    expectedYieldPct: '8.5',
    risk: 'aggressive',
  },
];

@Injectable()
export class InvestmentsSandboxAdapter implements InvestmentsPort {
  readonly kind: InvestmentsAdapterKind = 'sandbox';
  private readonly idempotency = new Map<string, InvestmentsResult>();
  private readonly profiles = new Map<string, { suitability: SuitabilityProfile; score: number }>();
  private readonly positions = new Map<string, SandboxPosition[]>();
  private readonly orders = new Map<string, SandboxOrder[]>();

  async health(): Promise<InvestmentsHealth> {
    return { ok: true, domain: 'investments', adapter: 'sandbox' };
  }

  async execute(command: InvestmentsCommand): Promise<InvestmentsResult> {
    const cached = this.idempotency.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }
    const action = String(command.payload.action ?? 'unknown');
    const result = this.dispatch(action, command);
    this.idempotency.set(command.idempotencyKey, result);
    return result;
  }

  private dispatch(action: string, command: InvestmentsCommand): InvestmentsResult {
    const principalId = command.principalId;

    switch (action) {
      case 'get_profile':
        return this.accept(command, {
          profile: this.ensureProfile(principalId),
          externalActivation: 'EXTERNAL_ACTIVATION_REQUIRED — broker/custodiante não ativo',
        });
      case 'get_suitability':
        return this.accept(command, { suitability: this.ensureProfile(principalId) });
      case 'get_catalog':
        return this.accept(command, { catalog: CATALOG, sandbox: true });
      case 'get_position':
        return this.accept(command, { positions: this.ensurePositions(principalId) });
      case 'place_order': {
        const productId = String(command.payload.productId ?? '');
        const amountCents = String(command.payload.amountCents ?? '');
        if (!/^\d{1,19}$/.test(amountCents)) {
          return this.reject(command, 'INVALID_AMOUNT');
        }
        const product = CATALOG.find((p) => p.id === productId);
        if (!product) {
          return this.reject(command, 'PRODUCT_NOT_FOUND');
        }
        if (BigInt(amountCents) < BigInt(product.minAmountCents)) {
          return this.reject(command, 'BELOW_MINIMUM');
        }
        const order: SandboxOrder = {
          id: randomUUID(),
          productId,
          productName: product.name,
          amountCents,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const list = this.ensureOrders(principalId);
        list.push(order);
        order.status = 'filled';
        order.updatedAt = new Date().toISOString();
        const positions = this.ensurePositions(principalId);
        positions.push({
          productId,
          productName: product.name,
          amountCents,
          yieldPct: product.expectedYieldPct,
        });
        return this.accept(command, { order });
      }
      case 'get_order': {
        const orderId = String(command.payload.orderId ?? '');
        const order = this.ensureOrders(principalId).find((o) => o.id === orderId);
        if (!order) {
          return this.reject(command, 'ORDER_NOT_FOUND');
        }
        return this.accept(command, { order });
      }
      case 'cancel_order': {
        const orderId = String(command.payload.orderId ?? '');
        const order = this.ensureOrders(principalId).find((o) => o.id === orderId);
        if (!order) {
          return this.reject(command, 'ORDER_NOT_FOUND');
        }
        if (order.status !== 'pending') {
          return this.reject(command, 'CANCEL_NOT_ALLOWED');
        }
        order.status = 'cancelled';
        order.updatedAt = new Date().toISOString();
        return this.accept(command, { order });
      }
      case 'settle_position': {
        const productId = String(command.payload.productId ?? '');
        const amountCents = String(command.payload.amountCents ?? '0');
        const positions = this.ensurePositions(principalId);
        const existing = positions.find((p) => p.productId === productId);
        if (existing) {
          existing.amountCents = String(BigInt(existing.amountCents) + BigInt(amountCents));
        } else {
          const product = CATALOG.find((p) => p.id === productId);
          positions.push({
            productId,
            productName: product?.name ?? productId,
            amountCents,
            yieldPct: product?.expectedYieldPct ?? '0',
          });
        }
        return this.accept(command, { positions, settledAt: new Date().toISOString(), sandbox: true });
      }
      case 'list_history':
        return this.accept(command, { orders: this.ensureOrders(principalId) });
      case 'activation_status':
        return this.accept(command, {
          externalProviderActive: false,
          message: 'EXTERNAL_ACTIVATION_REQUIRED — broker/custodiante não ativo em homolog',
          sandbox: true,
        });
      default:
        return this.reject(command, `UNSUPPORTED_ACTION:${action}`);
    }
  }

  private ensureProfile(principalId: string) {
    let profile = this.profiles.get(principalId);
    if (!profile) {
      profile = { suitability: 'moderate', score: 62 };
      this.profiles.set(principalId, profile);
    }
    return profile;
  }

  private ensurePositions(principalId: string): SandboxPosition[] {
    let list = this.positions.get(principalId);
    if (!list) {
      list = [];
      this.positions.set(principalId, list);
    }
    return list;
  }

  private ensureOrders(principalId: string): SandboxOrder[] {
    let list = this.orders.get(principalId);
    if (!list) {
      list = [];
      this.orders.set(principalId, list);
    }
    return list;
  }

  private accept(command: InvestmentsCommand, metadata: Record<string, unknown>): InvestmentsResult {
    return {
      referenceId: `sbx-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: { tier: 'sandbox', principalId: command.principalId, ...metadata },
    };
  }

  private reject(command: InvestmentsCommand, reason: string): InvestmentsResult {
    return {
      referenceId: `sbx-rej-${command.idempotencyKey}`,
      status: 'REJECTED',
      metadata: { tier: 'sandbox', principalId: command.principalId, reason },
    };
  }
}