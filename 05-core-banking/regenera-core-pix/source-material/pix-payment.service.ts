// pix-payment.service.ts
//
// o caminho do dinheiro inteiro passa por aqui.
// tudo até o débito vive numa transação só. o envio fica fora dela
// de propósito: provedor caiu, o estado DEBITED segura e a gente retoma.
// já vi banco perder dinheiro por achar que rede não falha. não aqui.

import { randomBytes, createHmac } from 'crypto';
import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Money } from '../domain/money.value-object';
import { LedgerDirection, PixPaymentStatus, PixStateMachine } from '../domain/state-machines';
import { IdempotencyService } from '../core/idempotency.service';
import { LedgerPostingService } from '../ledger/ledger-posting.service';
import { MetricsService } from '../metrics/metrics.service';
import { FraudSignalProvider, PixSettlementProvider } from '../providers/provider.contracts';

export interface CreatePixDto {
  senderAccountId: string;
  senderLedgerAccountId: string;
  receiverKey: string;
  receiverIspb: string | null;
  amountCents: string;
  idempotencyKey: string;
  deviceFingerprint: string;
  correlationId: string;
}

export interface PixLimits {
  perTransactionCents: string;
  dailyCents: string;
  nightlyCents: string;
  nightStartHour: number;
  nightEndHour: number;
}

const E2E_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

// limite noturno é regra de Brasília, não do fuso onde o servidor calhou
// de subir. servidor em UTC marcava "noite" três horas errado e ninguém
// percebia em teste porque teste roda de dia.
const LIMITS_TIMEZONE = 'America/Sao_Paulo';

// formato BACEN: E + ISPB(8) + aaaammddHHmm + 11 alfanuméricos = 32 chars.
// o módulo no alfabeto tem viés estatístico minúsculo. pra id de transação
// tanto faz; pra chave criptográfica seria crime. aqui não é.
export function generateEndToEndId(ispb: string, now: Date = new Date()): string {
  const stamp = now.toISOString().replace(/[-:T]/g, '').slice(0, 12);
  const bytes = randomBytes(11);
  let suffix = '';
  for (let i = 0; i < 11; i += 1) suffix += E2E_ALPHABET[bytes[i] % E2E_ALPHABET.length];
  return `E${ispb}${stamp}${suffix}`;
}

// chave pix em log ou em coluna legível é vazamento esperando data.
// guarda mascarado pra suporte e HMAC pra busca. o valor cru não para em lugar nenhum.
function maskKey(key: string): string {
  if (key.includes('@')) {
    const [user, domain] = key.split('@');
    return `${user.slice(0, 2)}***@${domain}`;
  }
  return key.length <= 6 ? '***' : `${key.slice(0, 3)}***${key.slice(-2)}`;
}

@Injectable()
export class PixPaymentService {
  private readonly logger = new Logger(PixPaymentService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly idempotency: IdempotencyService,
    private readonly ledger: LedgerPostingService,
    private readonly metrics: MetricsService,
    private readonly fraud: FraudSignalProvider,
    private readonly settlement: PixSettlementProvider,
    private readonly config: { ispb: string; transitLedgerAccountId: string; keyHashSecret: string },
    private readonly limits: PixLimits,
  ) {}

  // tudo até o débito numa transação só: idempotência, limites, antifraude,
  // lock de conta, saldo e partida dobrada. ou entra tudo, ou não entra nada.
  async create(dto: CreatePixDto): Promise<{ paymentId: string; internalEndToEndId: string; status: PixPaymentStatus }> {
    this.metrics.increment('pix_requests_total');
    const amount = Money.fromCents(dto.amountCents);
    if (!amount.isPositive()) {
      throw new UnprocessableEntityException({ code: 'PIX_AMOUNT_NOT_POSITIVE' });
    }

    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction('READ COMMITTED');
    try {
      const outcome = await this.idempotency.begin(runner, 'pix:create', dto.idempotencyKey, {
        senderAccountId: dto.senderAccountId,
        receiverKey: dto.receiverKey,
        amountCents: dto.amountCents,
      });
      if (outcome.kind === 'REPLAY') {
        await runner.commitTransaction();
        return outcome.responseBody as { paymentId: string; internalEndToEndId: string; status: PixPaymentStatus };
      }

      await this.assertWithinLimits(runner, dto.senderAccountId, amount);

      const decision = await this.fraud.scoreTransaction({
        accountId: dto.senderAccountId,
        amount,
        receiverKeyHash: this.hashKey(dto.receiverKey),
        deviceFingerprint: dto.deviceFingerprint,
        correlationId: dto.correlationId,
      });
      if (decision.action === 'BLOCK') {
        this.metrics.increment('pix_failed_total', { reason: 'FRAUD_BLOCK' });
        throw new ForbiddenException({ code: 'PIX_FRAUD_BLOCK', signals: decision.signals });
      }
      if (decision.action === 'CHALLENGE') {
        throw new ForbiddenException({ code: 'PIX_STEP_UP_REQUIRED' });
      }

      // lockAccount=true trava a linha da conta ANTES de somar o saldo.
      // sem isso, duas requisições simultâneas liam o mesmo saldo, passavam
      // as duas na checagem, e o cliente gastava o mesmo centavo duas vezes.
      // read committed não salva ninguém aqui — quem salva é o FOR UPDATE.
      const balance = await this.ledger.signedBalance(runner, dto.senderLedgerAccountId, true);
      if (balance.compare(amount) < 0) {
        this.metrics.increment('pix_failed_total', { reason: 'INSUFFICIENT_FUNDS' });
        throw new UnprocessableEntityException({ code: 'PIX_INSUFFICIENT_FUNDS' });
      }

      const internalEndToEndId = generateEndToEndId(this.config.ispb);
      const [payment]: Array<{ id: string }> = await runner.query(
        `INSERT INTO pix_payments
           (sender_account_id, receiver_key_masked, receiver_key_hash, receiver_ispb,
            amount_cents, idempotency_key, internal_end_to_end_id, status, authorized_at)
         VALUES ($1, $2, $3, $4, $5::bigint, $6, $7, 'AUTHORIZED', now())
         RETURNING id`,
        [dto.senderAccountId, maskKey(dto.receiverKey), this.hashKey(dto.receiverKey),
         dto.receiverIspb, amount.toCentsString(), dto.idempotencyKey, internalEndToEndId],
      );

      const entryId = await this.ledger.post(runner, {
        referenceType: 'PIX_PAYMENT',
        referenceId: payment.id,
        description: `PIX_DEBIT:${internalEndToEndId}`,
        correlationId: dto.correlationId,
        eventType: 'PIX_DEBITED',
        eventPayload: { paymentId: payment.id, internalEndToEndId, amountCents: amount.toCentsString() },
        lines: [
          { ledgerAccountId: dto.senderLedgerAccountId, direction: LedgerDirection.DEBIT, amount },
          { ledgerAccountId: this.config.transitLedgerAccountId, direction: LedgerDirection.CREDIT, amount },
        ],
      });

      await runner.query(
        `UPDATE pix_payments SET status = 'DEBITED', ledger_entry_id = $2, updated_at = now()
          WHERE id = $1`,
        [payment.id, entryId],
      );

      const response = { paymentId: payment.id, internalEndToEndId, status: PixPaymentStatus.DEBITED };
      await this.idempotency.complete(runner, 'pix:create', dto.idempotencyKey, 201, response);
      await runner.commitTransaction();
      return response;
    } catch (error: unknown) {
      await runner.rollbackTransaction();
      throw error;
    } finally {
      await runner.release();
    }
  }

  // o envio tem duas verdades que precisam andar juntas: o provedor aceitou
  // e o banco sabe disso. a versão antiga lia sem lock, mandava, e dava
  // update torcendo pra ninguém ter mexido no meio — se o update pegava
  // zero linhas, o id externo evaporava. agora: trava, manda, grava;
  // e se a gravação não casar, grita no log com o id em mãos pra
  // reconciliação achar. silêncio é a única falha imperdoável aqui.
  async submit(paymentId: string, correlationId: string): Promise<void> {
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    try {
      const rows: Array<{
        status: PixPaymentStatus;
        internal_end_to_end_id: string;
        receiver_key_hash: string;
        receiver_ispb: string | null;
        amount_cents: string;
      }> = await runner.query(
        `SELECT status, internal_end_to_end_id, receiver_key_hash, receiver_ispb,
                amount_cents::text AS amount_cents
           FROM pix_payments WHERE id = $1 FOR UPDATE`,
        [paymentId],
      );
      if (rows.length === 0) throw new NotFoundException({ code: 'PIX_NOT_FOUND' });
      const payment = rows[0];
      PixStateMachine.assertTransition(payment.status, PixPaymentStatus.SENT);

      const result = await this.settlement.submit({
        internalEndToEndId: payment.internal_end_to_end_id,
        senderIspb: this.config.ispb,
        receiverKeyHash: payment.receiver_key_hash,
        receiverIspb: payment.receiver_ispb,
        amount: Money.fromCents(payment.amount_cents),
        correlationId,
      });

      const updated: Array<{ id: string }> = await runner.query(
        `UPDATE pix_payments
            SET status = 'SENT', external_end_to_end_id = $2, updated_at = now()
          WHERE id = $1 AND status = 'DEBITED'
          RETURNING id`,
        [paymentId, result.externalEndToEndId],
      );
      if (updated.length === 0) {
        this.logger.error(
          `pix ${paymentId} aceito no provedor (externalE2E=${result.externalEndToEndId}) ` +
          `mas o estado local mudou no meio. reconciliação precisa olhar isso agora.`,
        );
      }
      await runner.commitTransaction();
    } catch (error: unknown) {
      await runner.rollbackTransaction();
      throw error;
    } finally {
      await runner.release();
    }
  }

  async confirmSettlement(externalEndToEndId: string): Promise<void> {
    const updated = await this.dataSource.query(
      `UPDATE pix_payments SET status = 'SETTLED', settled_at = now(), updated_at = now()
        WHERE external_end_to_end_id = $1 AND status = 'SENT'
        RETURNING id`,
      [externalEndToEndId],
    );
    if (updated.length > 0) this.metrics.increment('pix_settled_total');
  }

  // falha depois do débito devolve por lançamento compensatório, na mesma
  // transação que registra a falha. update de saldo na mão é proibido —
  // saldo aqui é consequência do razão, nunca uma coluna que alguém edita.
  async fail(paymentId: string, reasonCode: string, detail: string, correlationId: string): Promise<void> {
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    try {
      const [payment]: Array<{ status: PixPaymentStatus; ledger_entry_id: string | null }> =
        await runner.query(
          `SELECT status, ledger_entry_id FROM pix_payments WHERE id = $1 FOR UPDATE`,
          [paymentId],
        );
      if (!payment) throw new NotFoundException({ code: 'PIX_NOT_FOUND' });
      PixStateMachine.assertTransition(payment.status, PixPaymentStatus.FAILED);

      let reversalEntryId: string | null = null;
      if (payment.ledger_entry_id) {
        reversalEntryId = await this.ledger.reverse(
          runner, payment.ledger_entry_id, reasonCode, correlationId,
        );
      }
      await runner.query(
        `UPDATE pix_payments
            SET status = 'FAILED', failure_reason_code = $2, failure_reason_detail = $3,
                reversal_ledger_entry_id = $4, updated_at = now()
          WHERE id = $1`,
        [paymentId, reasonCode, detail.slice(0, 500), reversalEntryId],
      );
      await runner.commitTransaction();
      this.metrics.increment('pix_failed_total', { reason: reasonCode });
    } catch (error: unknown) {
      await runner.rollbackTransaction();
      throw error;
    } finally {
      await runner.release();
    }
  }

  private async assertWithinLimits(runner: import('typeorm').QueryRunner, accountId: string, amount: Money): Promise<void> {
    // hora local de Brasília via Intl. parece exagero até o dia em que
    // o cluster muda de região e o limite noturno desloca sozinho.
    const hour = Number(
      new Intl.DateTimeFormat('pt-BR', { hour: 'numeric', hour12: false, timeZone: LIMITS_TIMEZONE })
        .format(new Date()),
    ) % 24;
    const night = hour >= this.limits.nightStartHour || hour < this.limits.nightEndHour;
    const perTx = Money.fromCents(
      night ? this.limits.nightlyCents : this.limits.perTransactionCents,
    );
    if (amount.compare(perTx) > 0) {
      this.metrics.increment('pix_failed_total', { reason: 'LIMIT_PER_TX' });
      throw new UnprocessableEntityException({ code: 'PIX_LIMIT_PER_TX', limitCents: perTx.toCentsString() });
    }
    // "dia" do limite diário também é o dia civil de Brasília.
    // date_trunc em UTC virava o dia às 21h e o cliente ganhava limite novo de brinde.
    const [row]: Array<{ total: string }> = await runner.query(
      `SELECT COALESCE(SUM(amount_cents), 0)::text AS total
         FROM pix_payments
        WHERE sender_account_id = $1
          AND status IN ('AUTHORIZED','DEBITED','SENT','SETTLED')
          AND created_at >= date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo')
                            AT TIME ZONE 'America/Sao_Paulo'`,
      [accountId],
    );
    const dailyUsed = Money.fromCents(row.total).add(amount);
    if (dailyUsed.compare(Money.fromCents(this.limits.dailyCents)) > 0) {
      this.metrics.increment('pix_failed_total', { reason: 'LIMIT_DAILY' });
      throw new UnprocessableEntityException({ code: 'PIX_LIMIT_DAILY' });
    }
  }

  private hashKey(key: string): string {
    return createHmac('sha256', this.config.keyHashSecret).update(key, 'utf8').digest('hex');
  }
}
