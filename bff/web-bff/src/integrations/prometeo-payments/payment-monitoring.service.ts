import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { normalizeDecimalAmount } from '../../common/decimal-money';
import { AuthService } from '../../auth/auth.service';
import { ChannelAncillaryService } from '@regenera/channel-persistence';
import { PrometeoBankingClient } from './prometeo-banking.client';
import { PrometeoPaymentsClient } from './prometeo-payments.client';
import type {
  MonitoredPaymentRecord,
  PrometeoPaymentWebhookBody,
  PrometeoTransferLog,
} from './prometeo-payments.types';

const PAYMENT_EVENT_PREFIX = 'payment.';

@Injectable()
export class PaymentMonitoringService {
  private readonly logger = new Logger(PaymentMonitoringService.name);

  constructor(
    private readonly prometeo: PrometeoBankingClient,
    private readonly payments: PrometeoPaymentsClient,
    private readonly auth: AuthService,
    private readonly ancillary: ChannelAncillaryService,
  ) {}

  getWidgetConfig(): {
    readonly widgetConfigured: boolean;
    readonly paymentsBaseUrl: string;
    readonly widgetSdkVersion: '2.0.0';
  } {
    const widgetId = process.env.PROMETEO_WIDGET_ID?.trim();
    return {
      widgetConfigured: Boolean(widgetId),
      paymentsBaseUrl:
        process.env.PROMETEO_PAYMENTS_BASE_URL?.trim() ||
        'https://payment.prometeoapi.net',
      widgetSdkVersion: '2.0.0',
    };
  }

  async createPaymentIntent(
    userId: string,
    input: {
      readonly amount: string;
      readonly currency?: string;
      readonly concept?: string;
      readonly reference?: string;
    },
  ): Promise<{
    readonly intentId: string;
    readonly widgetId: string;
    readonly amount: string;
    readonly currency: string;
    readonly concept?: string;
  }> {
    const user = this.auth.findUserById(userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const amount = this.normalizeAmount(input.amount);
    const currency = (input.currency?.trim() || 'BRL').toUpperCase();
    if (currency.length !== 3) {
      throw new BadRequestException('currency deve ser ISO-4217 (ex.: BRL)');
    }

    const productId = this.payments.resolveWidgetProductId();
    const intent = await this.payments.createPaymentIntent({
      productId,
      externalId: userId.slice(0, 50) || randomUUID(),
      amount,
      currency,
      concept: input.concept,
      reference: input.reference,
      username: user.displayName,
      documentNumber: user.document,
      userTaxId: currency === 'BRL' ? user.document : undefined,
    });

    return {
      intentId: intent.intentId,
      widgetId: productId,
      amount: intent.amount,
      currency: intent.currency,
      concept: intent.concept,
    };
  }

  private normalizeAmount(raw: string): string {
    return normalizeDecimalAmount(raw);
  }

  async handleWebhook(
    body: PrometeoPaymentWebhookBody,
  ): Promise<{
    readonly ok: true;
    readonly processed: number;
    readonly skipped: number;
    readonly failed: number;
  }> {
    const verifyOk = this.verifyWebhookToken(body.verify_token);
    if (!verifyOk) {
      throw new UnauthorizedException('verify_token inválido');
    }

    const events = body.events ?? [];
    let processed = 0;
    let skipped = 0;
    let failed = 0;

    for (const event of events) {
      if (!event.event_type?.startsWith(PAYMENT_EVENT_PREFIX)) {
        skipped += 1;
        continue;
      }
      const requestId = event.payload?.request_id?.trim();
      if (!requestId) {
        failed += 1;
        continue;
      }
      if (this.isEventProcessed(event.event_id)) {
        skipped += 1;
        continue;
      }

      try {
        await this.enrichAndStore({
          requestId,
          eventId: event.event_id,
          eventType: event.event_type,
          verifyTokenOk: verifyOk,
          prometeoTimestamp: event.timestamp,
          amount: event.payload.amount,
          currency: event.payload.currency,
          concept: event.payload.concept,
          destinationOwnerName: event.payload.destination_owner_name,
        });
        processed += 1;
      } catch (error) {
        failed += 1;
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(
          `[PaymentMonitor] Falha event=${event.event_id} request=${requestId}: ${message}`,
        );
        this.storeFailure({
          requestId,
          eventId: event.event_id,
          eventType: event.event_type,
          verifyTokenOk: verifyOk,
          prometeoTimestamp: event.timestamp,
          amount: event.payload.amount,
          currency: event.payload.currency,
          concept: event.payload.concept,
          destinationOwnerName: event.payload.destination_owner_name,
          lastError: message,
        });
      }
    }

    return { ok: true, processed, skipped, failed };
  }

  async pollTransferLogs(params: {
    dateStart: string;
    dateEnd: string;
  }): Promise<{ readonly imported: number; readonly items: MonitoredPaymentRecord[] }> {
    const logs = await this.prometeo.listTransfers(params);
    const items: MonitoredPaymentRecord[] = [];

    for (const transfer of logs) {
      const requestId = transfer.request_id?.trim();
      if (!requestId) {
        continue;
      }
      const syntheticEventId = `poll:${requestId}:${transfer.created_at ?? 'na'}`;
      if (this.isEventProcessed(syntheticEventId)) {
        const existing = this.getByRequestId(requestId);
        if (existing) {
          items.push(existing);
        }
        continue;
      }
      const record = this.buildRecord({
        requestId,
        eventId: syntheticEventId,
        eventType: 'payment.poll',
        verifyTokenOk: true,
        prometeoTimestamp: transfer.created_at,
        amount: transfer.amount,
        currency: transfer.currency,
        concept: transfer.concept,
        destinationOwnerName: transfer.destination_name,
        transferDetail: transfer,
        status: 'ENRICHED',
      });
      this.persist(record);
      items.push(record);
    }

    return { imported: items.length, items };
  }

  listMonitored(): MonitoredPaymentRecord[] {
    const snapshot = this.ancillary.listPrometeoPayments();
    return Object.values(snapshot)
      .map((item) => item as unknown as MonitoredPaymentRecord)
      .sort((a, b) => b.webhookReceivedAt.localeCompare(a.webhookReceivedAt));
  }

  getMonitored(requestId: string): MonitoredPaymentRecord | undefined {
    return this.getByRequestId(requestId);
  }

  private async enrichAndStore(input: {
    requestId: string;
    eventId: string;
    eventType: string;
    verifyTokenOk: boolean;
    prometeoTimestamp?: string;
    amount?: string;
    currency?: string;
    concept?: string;
    destinationOwnerName?: string;
  }): Promise<MonitoredPaymentRecord> {
    const transferDetail = await this.prometeo.fetchTransferDetail(
      input.requestId,
    );
    const record = this.buildRecord({
      ...input,
      transferDetail,
      status: 'ENRICHED',
    });
    this.persist(record);
    return record;
  }

  private storeFailure(input: {
    requestId: string;
    eventId: string;
    eventType: string;
    verifyTokenOk: boolean;
    prometeoTimestamp?: string;
    amount?: string;
    currency?: string;
    concept?: string;
    destinationOwnerName?: string;
    lastError: string;
  }): void {
    const record = this.buildRecord({
      ...input,
      status: 'FAILED',
    });
    this.persist(record);
  }

  private buildRecord(input: {
    requestId: string;
    eventId: string;
    eventType: string;
    verifyTokenOk: boolean;
    prometeoTimestamp?: string;
    amount?: string;
    currency?: string;
    concept?: string;
    destinationOwnerName?: string;
    transferDetail?: PrometeoTransferLog;
    status: MonitoredPaymentRecord['status'];
    lastError?: string;
  }): MonitoredPaymentRecord {
    return {
      requestId: input.requestId,
      eventId: input.eventId,
      eventType: input.eventType,
      verifyTokenOk: input.verifyTokenOk,
      webhookReceivedAt: new Date().toISOString(),
      prometeoTimestamp: input.prometeoTimestamp,
      amount: input.transferDetail?.amount ?? input.amount,
      currency: input.transferDetail?.currency ?? input.currency,
      concept: input.transferDetail?.concept ?? input.concept,
      destinationOwnerName:
        input.transferDetail?.destination_name ?? input.destinationOwnerName,
      status: input.status,
      transferDetail: input.transferDetail,
      lastError: input.lastError,
    };
  }

  private persist(record: MonitoredPaymentRecord): void {
    void this.ancillary.putPrometeoPayment(
      record.requestId,
      record as unknown as Record<string, unknown>,
    );
    void this.ancillary.markPrometeoEvent(record.eventId);
    this.ancillary.mutatePrometeo((draft) => {
      draft.prometeoPayments[record.requestId] =
        record as unknown as Record<string, unknown>;
      draft.prometeoProcessedEventIds[record.eventId] = record.webhookReceivedAt;
    });
  }

  private getByRequestId(requestId: string): MonitoredPaymentRecord | undefined {
    const raw = this.ancillary.getPrometeoPayment(requestId);
    return raw as unknown as MonitoredPaymentRecord | undefined;
  }

  private isEventProcessed(eventId: string): boolean {
    return this.ancillary.hasPrometeoEvent(eventId);
  }

  private verifyWebhookToken(token: string | undefined): boolean {
    const expected = process.env.PROMETEO_WEBHOOK_VERIFY_TOKEN?.trim();
    if (!expected) {
      this.logger.warn(
        'PROMETEO_WEBHOOK_VERIFY_TOKEN ausente — webhook aceito sem verificação (homolog)',
      );
      return true;
    }
    return token?.trim() === expected;
  }

  assertPollDates(dateStart: string, dateEnd: string): void {
    const datePattern = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!datePattern.test(dateStart) || !datePattern.test(dateEnd)) {
      throw new BadRequestException(
        'Datas devem estar no formato DD/MM/YYYY (date_start, date_end)',
      );
    }
  }
}