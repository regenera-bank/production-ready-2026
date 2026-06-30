import { createHmac, randomBytes, randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { PaymentEngineService } from '../payments/payment-engine.service';
import { ValidationException } from '../errors/core-banking.errors';
import {
  CreatePixCommand,
  HOMOLOG_ISPB,
  PixKeyType,
  PixPaymentRecord,
} from './pix.entity';
import { PixRepository } from './pix.repository';

const E2E_PATTERN = /^E\d{8}\d{12}[A-Za-z0-9]{11}$/;
const ALPHANUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

@Injectable()
export class PixEngineService {
  constructor(
    private readonly pix: PixRepository,
    private readonly payments: PaymentEngineService,
    private readonly hmacSecret: string,
  ) {}

  static generateEndToEndId(
    ispb: string = HOMOLOG_ISPB,
    at: Date = new Date(),
  ): string {
    if (!/^\d{8}$/.test(ispb)) {
      throw new ValidationException(
        'ISPB deve ter 8 dígitos',
        'PIX_INVALID_ISPB',
        { ispb },
      );
    }
    const stamp = PixEngineService.formatTimestamp(at);
    let suffix = '';
    for (let i = 0; i < 11; i += 1) {
      suffix += ALPHANUM[randomBytes(1)[0]! % ALPHANUM.length];
    }
    return `E${ispb}${stamp}${suffix}`;
  }

  static validateEndToEndId(endToEndId: string): boolean {
    return E2E_PATTERN.test(endToEndId);
  }

  static hmacPixKey(key: string, secret: string): string {
    const normalized = key.trim().toLowerCase();
    return createHmac('sha256', secret).update(normalized, 'utf8').digest('hex');
  }

  static maskReceiverKey(key: string, type: PixKeyType): string {
    const trimmed = key.trim();
    switch (type) {
      case PixKeyType.CPF: {
        const digits = trimmed.replace(/\D/g, '');
        if (digits.length !== 11) return '***.***.***-**';
        return `***.***.***-${digits.slice(-2)}`;
      }
      case PixKeyType.CNPJ: {
        const digits = trimmed.replace(/\D/g, '');
        if (digits.length !== 14) return '**.***.***/****-**';
        return `**.***.***/****-${digits.slice(-2)}`;
      }
      case PixKeyType.EMAIL: {
        const [local, domain] = trimmed.split('@');
        if (!local || !domain) return '***@***';
        return `${local[0] ?? '*'}***@${domain}`;
      }
      case PixKeyType.PHONE: {
        const digits = trimmed.replace(/\D/g, '');
        if (digits.length < 10) return '+55 ** *****-****';
        return `+55 ** *****-${digits.slice(-4)}`;
      }
      case PixKeyType.EVP:
        if (trimmed.length < 8) return '****';
        return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`;
      default: {
        const _exhaustive: never = type;
        return _exhaustive;
      }
    }
  }

  async create(command: CreatePixCommand): Promise<PixPaymentRecord> {
    this.validateReceiverKey(command.receiverKey, command.receiverKeyType);

    const endToEndId = PixEngineService.generateEndToEndId();
    if (!PixEngineService.validateEndToEndId(endToEndId)) {
      throw new ValidationException(
        'Falha ao gerar EndToEndId BACEN',
        'PIX_E2E_GENERATION_FAILED',
      );
    }

    const existing = await this.pix.findByEndToEndId(endToEndId);
    if (existing) {
      throw new ValidationException(
        'EndToEndId colidiu — regenere',
        'PIX_E2E_COLLISION',
        { endToEndId },
      );
    }

    const payment = await this.payments.create({
      debtorAccountId: command.debtorAccountId,
      creditorAccountId: command.creditorAccountId,
      amount: command.amount,
      idempotencyKey: command.idempotencyKey,
      correlationId: command.correlationId,
    });

    const record: PixPaymentRecord = {
      id: randomUUID(),
      paymentId: payment.id,
      endToEndId,
      receiverKeyHmac: PixEngineService.hmacPixKey(
        command.receiverKey,
        this.hmacSecret,
      ),
      receiverMasked: PixEngineService.maskReceiverKey(
        command.receiverKey,
        command.receiverKeyType,
      ),
      receiverKeyType: command.receiverKeyType,
      createdAt: new Date().toISOString(),
    };

    return this.pix.save(record);
  }

  private validateReceiverKey(key: string, type: PixKeyType): void {
    const trimmed = key.trim();
    if (!trimmed) {
      throw new ValidationException('Chave Pix vazia', 'PIX_KEY_EMPTY');
    }

    switch (type) {
      case PixKeyType.CPF:
        if (!/^\d{11}$/.test(trimmed.replace(/\D/g, ''))) {
          throw new ValidationException('CPF Pix inválido', 'PIX_KEY_INVALID_CPF');
        }
        return;
      case PixKeyType.CNPJ:
        if (!/^\d{14}$/.test(trimmed.replace(/\D/g, ''))) {
          throw new ValidationException('CNPJ Pix inválido', 'PIX_KEY_INVALID_CNPJ');
        }
        return;
      case PixKeyType.EMAIL:
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
          throw new ValidationException('E-mail Pix inválido', 'PIX_KEY_INVALID_EMAIL');
        }
        return;
      case PixKeyType.PHONE:
        if (!/^\+?\d{10,13}$/.test(trimmed.replace(/[\s()-]/g, ''))) {
          throw new ValidationException(
            'Telefone Pix inválido',
            'PIX_KEY_INVALID_PHONE',
          );
        }
        return;
      case PixKeyType.EVP:
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          trimmed,
        )) {
          throw new ValidationException('EVP Pix inválida', 'PIX_KEY_INVALID_EVP');
        }
        return;
      default: {
        const _exhaustive: never = type;
        return _exhaustive;
      }
    }
  }

  private static formatTimestamp(at: Date): string {
    const pad = (n: number) => n.toString(10).padStart(2, '0');
    return (
      at.getUTCFullYear().toString() +
      pad(at.getUTCMonth() + 1) +
      pad(at.getUTCDate()) +
      pad(at.getUTCHours()) +
      pad(at.getUTCMinutes())
    );
  }
}