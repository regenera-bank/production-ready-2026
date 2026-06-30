import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PartnerApiException } from '../common/partner-api.exception';

export type Money = { currency: 'BRL'; value: string };

export type CreatePixPaymentInput = {
  sourceAccountId: string;
  destination: { keyType: string; key: string };
  amount: Money;
  description?: string;
};

@Injectable()
export class PartnerService {
  private readonly payments = new Map<
    string,
    {
      id: string;
      status: string;
      amount: Money;
      createdAt: string;
      settledAt: string | null;
      failureCode: string | null;
    }
  >();

  listAccounts() {
    return [
      {
        id: 'acc-sandbox-0001',
        displayName: 'Sandbox Checking',
        type: 'CHECKING' as const,
        currency: 'BRL' as const,
        status: 'ACTIVE' as const,
      },
    ];
  }

  getBalance(accountId: string) {
    if (accountId !== 'acc-sandbox-0001') {
      throw new PartnerApiException('RBK-ACC-001', 404, 'Account not found');
    }
    const money: Money = { currency: 'BRL', value: '15000.00' };
    return {
      accountId,
      book: money,
      available: { currency: 'BRL', value: '14000.00' },
      blocked: { currency: 'BRL', value: '1000.00' },
      asOf: new Date().toISOString(),
    };
  }

  listTransactions(accountId: string) {
    if (accountId !== 'acc-sandbox-0001') {
      throw new PartnerApiException('RBK-ACC-001', 404, 'Account not found');
    }
    return {
      items: [
        {
          id: 'txn-sandbox-001',
          accountId,
          type: 'PIX',
          direction: 'DEBIT' as const,
          amount: { currency: 'BRL', value: '250.00' },
          status: 'SETTLED',
          occurredAt: new Date().toISOString(),
          description: 'Sandbox PIX debit',
        },
      ],
      nextCursor: null,
    };
  }

  createPixPayment(input: CreatePixPaymentInput) {
    if (!/^\d{1,17}\.\d{2}$/.test(input.amount.value)) {
      throw new PartnerApiException('RBK-VAL-002', 422, 'Invalid monetary amount');
    }

    const id = randomUUID();
    const payment = {
      id,
      status: 'CREATED',
      amount: input.amount,
      createdAt: new Date().toISOString(),
      settledAt: null,
      failureCode: null,
    };
    this.payments.set(id, payment);
    return payment;
  }

  getPixPayment(paymentId: string) {
    const payment = this.payments.get(paymentId);
    if (!payment) {
      throw new PartnerApiException('RBK-PIX-003', 404, 'PIX payment not found');
    }
    return payment;
  }
}