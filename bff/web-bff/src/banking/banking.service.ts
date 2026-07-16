import {
  BadRequestException,
  ConflictException as HttpConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  forwardRef,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuthService } from '../auth/auth.service';
import { OnboardingService } from '../onboarding/onboarding.service';
import {
  AccountClass,
  ConflictException,
  CoreBankService,
  Money,
  PaymentStatus,
  PixKeyType,
  PostingSide,
} from '../integrations/core-bank';
import { maskUserId } from '../common/pii-redaction';
import { PaymentSettlementPublisher } from '../projections/payment-settlement.publisher';
import {
  ChannelBankingService,
  TransactionProjectionService,
  type PixDirectoryRecord,
} from '@regenera/channel-persistence';
import {
  DashboardResponse,
  OpenCustomerAccountResult,
  PaymentChannelStatus,
  PaymentStatusResponse,
  PixKeyItem,
  PixLookupResponse,
  PixTransferResponse,
  TransactionItem,
  TransactionReceipt,
  TransferResponse,
} from './banking.dto';

const coreConflictCode = (error: unknown): string | undefined => {
  if (error instanceof ConflictException) {
    return error.code;
  }
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return String((error as { code: unknown }).code);
  }
  return undefined;
};

const isAccountRefConflict = (error: unknown): boolean =>
  coreConflictCode(error) === 'ACCOUNT_EXTERNAL_REFERENCE_EXISTS';

const conflictAccountId = (error: unknown): string | undefined => {
  if (!(error instanceof ConflictException)) {
    return undefined;
  }
  const accountId = error.getBody().details?.accountId;
  return accountId ? String(accountId) : undefined;
};

const conflictCode = (error: unknown): string | undefined => coreConflictCode(error);

interface PixDirectoryEntry {
  userId: string;
  displayName: string;
  accountId: string;
  keyType: PixKeyType;
  rawKey: string;
}

@Injectable()
export class BankingService implements OnModuleInit {
  private readonly logger = new Logger(BankingService.name);
  private clearingAccountId: string | null = null;
  private cashAssetAccountId: string | null = null;
  private cardClearingAccountId: string | null = null;
  private investmentsPoolAccountId: string | null = null;
  private static readonly AGENCY = '0001';
  /** Homolog: R$ 1,00 nas primeiras 30 contas abertas */
  private static readonly HOMOLOG_WELCOME_CREDIT_MAX = 30;
  private static readonly HOMOLOG_WELCOME_CREDIT_CENTS = 100n;
  /** Intervalo sugerido ao canal enquanto pagamento está em PROCESSING. */
  static readonly PIX_POLL_AFTER_MS = 800;

  constructor(
    private readonly core: CoreBankService,
    private readonly auth: AuthService,
    private readonly channelBanking: ChannelBankingService,
    private readonly projections: TransactionProjectionService,
    private readonly settlementPublisher: PaymentSettlementPublisher,
    @Inject(forwardRef(() => OnboardingService))
    private readonly onboarding: OnboardingService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.clearingAccountId = await this.openSystemAccount(
      AccountClass.LIABILITY,
      'pix-clearing',
    );
    this.cashAssetAccountId = await this.openSystemAccount(
      AccountClass.ASSET,
      'homolog-cash-asset',
    );
    this.cardClearingAccountId = await this.openSystemAccount(
      AccountClass.LIABILITY,
      'card-merchant-clearing',
    );
    this.investmentsPoolAccountId = await this.openSystemAccount(
      AccountClass.LIABILITY,
      'investments-pool',
    );
    await this.reconcileAccountsAfterRestart();
  }

  private async openSystemAccount(
    accountClass: AccountClass,
    externalReference: string,
  ): Promise<string> {
    try {
      const account = await this.core.accounts.open({
        accountClass,
        externalReference,
      });
      return account.id;
    } catch (error) {
      if (isAccountRefConflict(error)) {
        const accountId = conflictAccountId(error);
        if (accountId) {
          return accountId;
        }
      }
      throw error;
    }
  }

  /** Débito no ledger na captura de cartão — dinheiro sai da conta do titular. */
  async settleCardCapture(
    userId: string,
    amountCents: bigint,
    idempotencyKey: string,
    merchant: string,
    referenceId: string,
  ): Promise<{ paymentId: string; balanceCents: string; availableCents: string }> {
    if (amountCents <= 0n) {
      throw new BadRequestException('Valor de captura inválido');
    }
    const debtorAccountId = await this.resolveAccountForUser(userId);
    const creditorAccountId = this.requireCardClearingAccount();
    let payment;
    try {
      payment = await this.core.payments.create({
        debtorAccountId,
        creditorAccountId,
        amount: Money.fromCents(amountCents),
        idempotencyKey: `card-capture-${idempotencyKey}`,
        correlationId: randomUUID(),
      });
      await this.settlePayment(payment.id);
    } catch (error: unknown) {
      this.rethrowPaymentError(error);
    }
    await this.publishSettled(userId, {
      paymentId: referenceId,
      transactionId: referenceId,
      correlationId: randomUUID(),
      idempotencyKey: `card-capture-${idempotencyKey}`,
      direction: 'outflow',
      amountCents,
      title: 'Compra cartão',
      party: merchant,
      channel: 'card',
      icon: 'credit-card',
      category: 'lifestyle',
    });
    const dashboard = await this.getDashboard(userId);
    return {
      paymentId: payment.id,
      balanceCents: dashboard.balanceCents,
      availableCents: dashboard.availableCents,
    };
  }

  /** Crédito no ledger no estorno de captura. */
  async creditCardReversal(
    userId: string,
    amountCents: bigint,
    idempotencyKey: string,
    merchant: string,
    referenceId: string,
  ): Promise<{ paymentId: string; balanceCents: string; availableCents: string }> {
    if (amountCents <= 0n) {
      throw new BadRequestException('Valor de estorno inválido');
    }
    const creditorAccountId = await this.resolveAccountForUser(userId);
    const debtorAccountId = this.requireCardClearingAccount();
    let payment;
    try {
      payment = await this.core.payments.create({
        debtorAccountId,
        creditorAccountId,
        amount: Money.fromCents(amountCents),
        idempotencyKey: `card-reverse-${idempotencyKey}`,
        correlationId: randomUUID(),
      });
      await this.settlePayment(payment.id);
    } catch (error: unknown) {
      this.rethrowPaymentError(error);
    }
    await this.publishSettled(userId, {
      paymentId: referenceId,
      transactionId: referenceId,
      correlationId: randomUUID(),
      idempotencyKey: `card-reverse-${idempotencyKey}`,
      direction: 'inflow',
      amountCents,
      title: 'Estorno cartão',
      party: merchant,
      channel: 'card',
      icon: 'download',
      category: 'lifestyle',
    });
    const dashboard = await this.getDashboard(userId);
    return {
      paymentId: payment.id,
      balanceCents: dashboard.balanceCents,
      availableCents: dashboard.availableCents,
    };
  }

  /** Débito no ledger na aplicação em investimentos. */
  async settleInvestmentOrder(
    userId: string,
    amountCents: bigint,
    idempotencyKey: string,
    productName: string,
    orderId: string,
  ): Promise<{ paymentId: string; balanceCents: string; availableCents: string }> {
    if (amountCents <= 0n) {
      throw new BadRequestException('Valor de investimento inválido');
    }
    const debtorAccountId = await this.resolveAccountForUser(userId);
    const creditorAccountId = this.requireInvestmentsPoolAccount();
    let payment;
    try {
      payment = await this.core.payments.create({
        debtorAccountId,
        creditorAccountId,
        amount: Money.fromCents(amountCents),
        idempotencyKey: `investment-order-${idempotencyKey}`,
        correlationId: randomUUID(),
      });
      await this.settlePayment(payment.id);
    } catch (error: unknown) {
      this.rethrowPaymentError(error);
    }
    await this.publishSettled(userId, {
      paymentId: orderId,
      transactionId: orderId,
      correlationId: randomUUID(),
      idempotencyKey: `investment-order-${idempotencyKey}`,
      direction: 'outflow',
      amountCents,
      title: 'Aplicação investimento',
      party: productName,
      channel: 'investments',
      icon: 'trending-up',
      category: 'investment',
    });
    const dashboard = await this.getDashboard(userId);
    return {
      paymentId: payment.id,
      balanceCents: dashboard.balanceCents,
      availableCents: dashboard.availableCents,
    };
  }

  async getDashboard(userId: string): Promise<DashboardResponse> {
    const accountId = await this.resolveAccountForUser(userId);
    await this.ensureDefaultPixKey(userId, accountId);
    const signed = await this.core.ledger.signedBalance(
      accountId,
      AccountClass.LIABILITY,
    );
    const available = await this.core.holds.availableBalance(accountId);
    const suffix = accountId.replace(/-/g, '').slice(-4);
    const recent = (await this.getTransactions(userId)).slice(0, 10);
    const balanceCents = signed.amountCents.toString();
    const availableCents = available.amountCents.toString();
    this.snapshotBalance(userId, balanceCents);
    const user = this.auth.findUserById(userId);
    return {
      accountId,
      maskedAccount: `···· ${suffix}`,
      agency: BankingService.AGENCY,
      document: user?.document ?? userId,
      balanceCents,
      availableCents,
      currency: 'BRL',
      correlationId: randomUUID(),
      recentTransactions: recent,
    };
  }

  async getTransactions(userId: string): Promise<TransactionItem[]> {
    const items = await this.projections.listByCustomerAsync(userId);
    return items as TransactionItem[];
  }

  async getReceipt(
    userId: string,
    transactionId: string,
  ): Promise<TransactionReceipt> {
    const tx = (await this.getTransactions(userId)).find(
      (item) => item.id === transactionId,
    );
    if (!tx) {
      throw new NotFoundException('Transação não encontrada');
    }
    const accountId = await this.resolveAccountForUser(userId);
    const suffix = accountId.replace(/-/g, '').slice(-4);
    return {
      receiptId: `rcpt-${transactionId}`,
      transactionId: tx.id,
      title: tx.title,
      party: tx.party,
      amountCents: tx.amountCents,
      type: tx.type,
      channel: tx.channel,
      issuedAt: tx.date,
      accountId,
      maskedAccount: `···· ${suffix}`,
      agency: BankingService.AGENCY,
      correlationId: randomUUID(),
    };
  }

  async listPixKeys(userId: string): Promise<PixKeyItem[]> {
    const keys = await this.channelBanking.listPixKeys(userId);
    return keys as PixKeyItem[];
  }

  async registerPixKey(
    userId: string,
    key: string,
    keyType: PixKeyItem['type'],
  ): Promise<PixKeyItem> {
    const accountId = await this.resolveAccountForUser(userId);
    const pixType = this.mapKeyType(keyType);
    const normalized = this.normalizePixKey(key, pixType);
    if (await this.channelBanking.pixDirectoryHas(pixType, normalized)) {
      throw new HttpConflictException('Chave Pix já cadastrada');
    }
    const item: PixKeyItem = {
      id: randomUUID(),
      type: keyType,
      key,
      createdAt: new Date().toLocaleDateString('pt-BR'),
    };
    const entry = this.toDirectoryRecord({
      userId,
      displayName: this.auth.getUserDisplayName(userId) ?? 'Cliente',
      accountId,
      keyType: pixType,
      rawKey: key,
    });
    await this.channelBanking.registerPixKeyEntry(
      userId,
      accountId,
      pixType,
      normalized,
      this.maskKey(key, pixType),
      entry.displayName,
      key,
      item,
    );
    return item;
  }

  async lookupPixKey(key: string): Promise<PixLookupResponse> {
    const trimmed = key.trim();
    if (!trimmed) {
      return { found: false };
    }
    const pixType = this.detectKeyType(trimmed);
    const normalized = this.normalizePixKey(trimmed, pixType);
    const entry = await this.getDirectoryEntry(normalized, pixType);
    if (entry) {
      return {
        found: true,
        displayName: entry.displayName,
        maskedKey: this.maskKey(trimmed, pixType),
        institution: 'Regenera Bank',
      };
    }
    return {
      found: false,
      displayName: 'Destinatário externo',
      maskedKey: this.maskKey(trimmed, pixType),
      institution: 'Instituição parceira',
    };
  }

  async sendPix(
    userId: string,
    key: string,
    amountCents: bigint,
    idempotencyKey: string,
  ): Promise<PixTransferResponse> {
    if (amountCents <= 0n) {
      throw new BadRequestException('Valor Pix inválido');
    }
    const debtorAccountId = await this.resolveAccountForUser(userId);
    const pixType = this.detectKeyType(key);
    const normalized = this.normalizePixKey(key, pixType);
    const entry = await this.getDirectoryEntry(normalized, pixType);
    const creditorAccountId =
      entry?.accountId ?? this.requireClearingAccount();
    const correlationId = randomUUID();
    let pix;
    try {
      pix = await this.core.pix.create({
        debtorAccountId,
        creditorAccountId,
        receiverKey: key.trim(),
        receiverKeyType: pixType,
        amount: Money.fromCents(amountCents),
        idempotencyKey,
        correlationId,
      });
    } catch (error: unknown) {
      this.rethrowPaymentError(error);
    }
    const dashboard = await this.getDashboard(userId);
    return {
      endToEndId: pix.endToEndId,
      paymentId: pix.paymentId,
      receiverMasked: pix.receiverMasked,
      amountCents: amountCents.toString(),
      status: 'PROCESSING',
      pollAfterMs: BankingService.PIX_POLL_AFTER_MS,
      balanceCents: dashboard.balanceCents,
      availableCents: dashboard.availableCents,
    };
  }

  async getPaymentStatus(
    userId: string,
    paymentId: string,
  ): Promise<PaymentStatusResponse> {
    const payment = await this.requirePaymentForUser(userId, paymentId);
    const settled = await this.advancePixSettlement(userId, payment);
    const channelStatus = this.toChannelStatus(settled.status);
    const dashboard =
      channelStatus === 'SETTLED'
        ? await this.getDashboard(userId)
        : undefined;
    return {
      paymentId: settled.id,
      status: channelStatus,
      pollAfterMs:
        channelStatus === 'PROCESSING' ? BankingService.PIX_POLL_AFTER_MS : 0,
      amountCents: settled.amount.toCentsString(),
      correlationId: settled.correlationId,
      ...(dashboard
        ? {
            balanceCents: dashboard.balanceCents,
            availableCents: dashboard.availableCents,
          }
        : {}),
    };
  }

  async getPixTransfer(
    userId: string,
    paymentId: string,
  ): Promise<PixTransferResponse> {
    const payment = await this.requirePaymentForUser(userId, paymentId);
    const pix = await this.core.pix.findByPaymentId(paymentId);
    if (!pix) {
      throw new NotFoundException('Transferência Pix não encontrada');
    }
    const settled = await this.advancePixSettlement(userId, payment);
    const channelStatus = this.toChannelStatus(settled.status);
    const dashboard = await this.getDashboard(userId);
    return {
      endToEndId: pix.endToEndId,
      paymentId: pix.paymentId,
      receiverMasked: pix.receiverMasked,
      amountCents: settled.amount.toCentsString(),
      status: channelStatus,
      pollAfterMs:
        channelStatus === 'PROCESSING' ? BankingService.PIX_POLL_AFTER_MS : 0,
      balanceCents: dashboard.balanceCents,
      availableCents: dashboard.availableCents,
    };
  }

  async transfer(
    userId: string,
    toDocument: string,
    amountCents: bigint,
    idempotencyKey: string,
  ): Promise<TransferResponse> {
    if (amountCents <= 0n) {
      throw new BadRequestException('Valor de transferência inválido');
    }
    const creditorUserId = this.auth.findUserIdByDocument(toDocument);
    if (!creditorUserId) {
      throw new NotFoundException('Conta destino não encontrada');
    }
    if (creditorUserId === userId) {
      throw new BadRequestException('Não é possível transferir para a própria conta');
    }
    const debtorAccountId = await this.resolveAccountForUser(userId);
    const creditorAccountId = await this.resolveAccountForUser(creditorUserId);
    const correlationId = randomUUID();
    let payment;
    try {
      payment = await this.core.payments.create({
        debtorAccountId,
        creditorAccountId,
        amount: Money.fromCents(amountCents),
        idempotencyKey,
        correlationId,
      });
      await this.core.payments.ensureSettled(payment.id);
    } catch (error: unknown) {
      this.rethrowPaymentError(error);
    }
    const creditorName =
      this.auth.getUserDisplayName(creditorUserId) ?? 'Cliente';
    const debtorName = this.auth.getUserDisplayName(userId) ?? 'Cliente';
    await this.publishSettled(userId, {
      paymentId: payment.id,
      transactionId: payment.id,
      correlationId,
      idempotencyKey,
      direction: 'outflow',
      amountCents,
      title: 'Transferência enviada',
      party: creditorName,
      channel: 'transfer',
      icon: 'send',
      category: 'essential',
    });
    const inboundId = `${payment.id}-in`;
    await this.publishSettled(creditorUserId, {
      paymentId: inboundId,
      transactionId: inboundId,
      correlationId,
      idempotencyKey: `${idempotencyKey}-in`,
      direction: 'inflow',
      amountCents,
      title: 'Transferência recebida',
      party: debtorName,
      channel: 'transfer',
      icon: 'download',
      category: 'lifestyle',
    });
    const dashboard = await this.getDashboard(userId);
    return {
      paymentId: payment.id,
      creditorName,
      amountCents: amountCents.toString(),
      balanceCents: dashboard.balanceCents,
      availableCents: dashboard.availableCents,
    };
  }

  private toChannelStatus(status: PaymentStatus): PaymentChannelStatus {
    if (status === PaymentStatus.SETTLED || status === PaymentStatus.RECONCILED) {
      return 'SETTLED';
    }
    if (status === PaymentStatus.UNKNOWN) {
      return 'UNKNOWN';
    }
    if (status === PaymentStatus.FAILED) {
      return 'FAILED';
    }
    return 'PROCESSING';
  }

  private async requirePaymentForUser(userId: string, paymentId: string) {
    const payment = await this.core.payments.getById(paymentId);
    if (!payment) {
      throw new NotFoundException('Pagamento não encontrado');
    }
    const debtorUserId = await this.channelBanking.findUserIdByLedgerAccount(
      payment.debtorAccountId,
    );
    const creditorUserId = await this.channelBanking.findUserIdByLedgerAccount(
      payment.creditorAccountId,
    );
    if (userId !== debtorUserId && userId !== creditorUserId) {
      throw new ForbiddenException('Pagamento não pertence ao titular autenticado');
    }
    return payment;
  }

  private async advancePixSettlement(
    userId: string,
    payment: Awaited<ReturnType<CoreBankService['payments']['getById']>> & object,
  ) {
    if (!payment) {
      throw new NotFoundException('Pagamento não encontrado');
    }
    const pix = await this.core.pix.findByPaymentId(payment.id);
    if (!pix) {
      if (
        payment.status !== PaymentStatus.SETTLED &&
        payment.status !== PaymentStatus.RECONCILED
      ) {
        return this.core.payments.ensureSettled(payment.id);
      }
      return payment;
    }
    let current = payment;
    if (
      current.status !== PaymentStatus.SETTLED &&
      current.status !== PaymentStatus.RECONCILED
    ) {
      current = await this.core.payments.ensureSettled(payment.id);
    }
    await this.projectPixSettlement(userId, pix, current);
    return current;
  }

  private async projectPixSettlement(
    actorUserId: string,
    pix: { id: string; paymentId: string; receiverMasked: string },
    payment: {
      id: string;
      debtorAccountId: string;
      creditorAccountId: string;
      amount: Money;
      correlationId: string;
      idempotencyKey: string;
    },
  ): Promise<void> {
    const amountCents = BigInt(payment.amount.toCentsString());
    const debtorUserId =
      (await this.channelBanking.findUserIdByLedgerAccount(
        payment.debtorAccountId,
      )) ?? actorUserId;
    const creditorUserId = await this.channelBanking.findUserIdByLedgerAccount(
      payment.creditorAccountId,
    );
    await this.publishSettled(debtorUserId, {
      paymentId: pix.id,
      transactionId: pix.id,
      correlationId: payment.correlationId,
      idempotencyKey: payment.idempotencyKey,
      direction: 'outflow',
      amountCents,
      title: 'Pix enviado',
      party: pix.receiverMasked,
      channel: 'pix',
      icon: 'send',
      category: 'essential',
    });
    if (creditorUserId && creditorUserId !== debtorUserId) {
      const inboundId = `${pix.id}-in`;
      await this.publishSettled(creditorUserId, {
        paymentId: inboundId,
        transactionId: inboundId,
        correlationId: payment.correlationId,
        idempotencyKey: `${payment.idempotencyKey}-in`,
        direction: 'inflow',
        amountCents,
        title: 'Pix recebido',
        party: this.auth.getUserDisplayName(debtorUserId) ?? 'Cliente',
        channel: 'pix',
        icon: 'download',
        category: 'lifestyle',
      });
    }
  }

  private rethrowPaymentError(error: unknown): never {
    if (conflictCode(error) === 'PAYMENT_INSUFFICIENT_FUNDS') {
      throw new HttpConflictException('Saldo insuficiente');
    }
    throw error;
  }

  private async settlePayment(paymentId: string): Promise<void> {
    await this.core.payments.markSent(paymentId);
    await this.core.payments.markSettled(paymentId);
  }

  private async publishSettled(
    userId: string,
    input: {
      paymentId: string;
      transactionId: string;
      correlationId: string;
      idempotencyKey: string;
      direction: 'inflow' | 'outflow';
      amountCents: bigint;
      title: string;
      party: string;
      channel: TransactionItem['channel'];
      icon: string;
      category: TransactionItem['category'];
    },
  ): Promise<void> {
    if (this.projections.has(userId, input.paymentId)) {
      return;
    }
    await this.settlementPublisher.publishSettled({
      eventType: 'payment.settled',
      customerId: userId,
      paymentId: input.paymentId,
      transactionId: input.transactionId,
      correlationId: input.correlationId,
      idempotencyKey: input.idempotencyKey,
      direction: input.direction,
      amountCents: input.amountCents.toString(),
      title: input.title,
      party: input.party,
      channel: input.channel,
      icon: input.icon,
      category: input.category,
      occurredAt: new Date().toISOString(),
    });
  }

  private async ensureDefaultPixKey(
    userId: string,
    accountId: string,
  ): Promise<void> {
    const existing = await this.channelBanking.listPixKeys(userId);
    if (existing.length > 0) {
      return;
    }
    const evp = randomUUID();
    const item: PixKeyItem = {
      id: randomUUID(),
      type: 'random',
      key: evp,
      createdAt: new Date().toLocaleDateString('pt-BR'),
    };
    const keys: PixKeyItem[] = [item];
    const directoryUpdates: Record<string, PixDirectoryRecord> = {};
    directoryUpdates[this.normalizePixKey(evp, PixKeyType.EVP)] =
      this.toDirectoryRecord({
        userId,
        displayName: this.auth.getUserDisplayName(userId) ?? 'Cliente',
        accountId,
        keyType: PixKeyType.EVP,
        rawKey: evp,
      });

    const registerKey = async (
      type: PixKeyItem['type'],
      rawKey: string,
      pixType: PixKeyType,
    ) => {
      const normalized = this.normalizePixKey(rawKey, pixType);
      if (await this.channelBanking.pixDirectoryHas(pixType, normalized)) {
        return;
      }
      const keyItem: PixKeyItem = {
        id: randomUUID(),
        type,
        key: rawKey,
        createdAt: new Date().toLocaleDateString('pt-BR'),
      };
      keys.push(keyItem);
      const entry = this.toDirectoryRecord({
        userId,
        displayName: this.auth.getUserDisplayName(userId) ?? 'Cliente',
        accountId,
        keyType: pixType,
        rawKey,
      });
      directoryUpdates[normalized] = entry;
      await this.channelBanking.registerPixKeyEntry(
        userId,
        accountId,
        pixType,
        normalized,
        this.maskKey(rawKey, pixType),
        entry.displayName,
        rawKey,
        keyItem,
      );
    };

    if (userId.length === 11) {
      const cpfKey = userId.replace(
        /(\d{3})(\d{3})(\d{3})(\d{2})/,
        '$1.$2.$3-$4',
      );
      await registerKey('cpf', cpfKey, PixKeyType.CPF);
    }

    const email = this.auth.getUserEmail(userId);
    if (email) {
      await registerKey('email', email, PixKeyType.EMAIL);
    }

    const phone = this.auth.getUserPhone(userId);
    if (phone) {
      await registerKey('phone', phone, PixKeyType.PHONE);
    }

    const evpNormalized = this.normalizePixKey(evp, PixKeyType.EVP);
    if (!(await this.channelBanking.pixDirectoryHas(PixKeyType.EVP, evpNormalized))) {
      await this.channelBanking.registerPixKeyEntry(
        userId,
        accountId,
        PixKeyType.EVP,
        evpNormalized,
        evp,
        this.auth.getUserDisplayName(userId) ?? 'Cliente',
        evp,
        item,
      );
    }
  }

  async syncPixDisplayName(userId: string, displayName: string): Promise<void> {
    const trimmed = displayName.trim();
    if (!trimmed) {
      return;
    }
    await this.channelBanking.syncPixDisplayName(userId, trimmed);
  }

  async openCustomerAccount(
    userId: string,
  ): Promise<OpenCustomerAccountResult> {
    this.onboarding.requireKycApproved(userId);
    const existing = await this.channelBanking.getAccountForUser(userId);
    if (existing) {
      const welcomeCents = await this.applyWelcomeCreditIfEligible(
        userId,
        existing,
      );
      return {
        accountId: existing,
        welcomeCreditCents: welcomeCents.toString(),
      };
    }
    const externalReference = `web-user-${userId}`;
    let customerId: string;
    try {
      const customer = await this.core.accounts.open({
        accountClass: AccountClass.LIABILITY,
        externalReference,
      });
      customerId = customer.id;
    } catch (error: unknown) {
      if (isAccountRefConflict(error)) {
        customerId = conflictAccountId(error) ?? '';
        if (!customerId) {
          throw error;
        }
      } else {
        throw error;
      }
    }
    await this.channelBanking.upsertAccountOwnership(
      userId,
      customerId,
      randomUUID(),
    );
    await this.ensureDefaultPixKey(userId, customerId);
    await this.syncPixDisplayName(
      userId,
      this.auth.getUserDisplayName(userId) ?? 'Cliente',
    );
    const welcomeCents = await this.applyWelcomeCreditIfEligible(
      userId,
      customerId,
    );
    await this.restoreLedgerBalance(userId, customerId);
    return {
      accountId: customerId,
      welcomeCreditCents: welcomeCents.toString(),
    };
  }

  private async reconcileAccountsAfterRestart(): Promise<void> {
    const activeIds = this.onboarding.listActiveUserIds();
    if (activeIds.length === 0) {
      return;
    }
    await this.channelBanking.clearActiveUsersState(activeIds);
    for (const userId of activeIds) {
      try {
        await this.openCustomerAccount(userId);
        this.logger.log(`Conta reaberta no ledger para ${maskUserId(userId)}`);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'erro desconhecido';
        this.logger.warn(
          `Falha ao reabrir conta ${maskUserId(userId)}: ${message}`,
        );
      }
    }
  }

  private async resolveAccountForUser(userId: string): Promise<string> {
    this.onboarding.requireActiveAccount(userId);
    const existing = await this.channelBanking.getAccountForUser(userId);
    if (!existing) {
      throw new ForbiddenException(
        'Conta ainda não aberta — conclua o onboarding',
      );
    }
    return existing;
  }

  private requireClearingAccount(): string {
    if (!this.clearingAccountId) {
      throw new Error('Conta clearing Pix indisponível');
    }
    return this.clearingAccountId;
  }

  private requireCardClearingAccount(): string {
    if (!this.cardClearingAccountId) {
      throw new Error('Conta clearing cartões indisponível');
    }
    return this.cardClearingAccountId;
  }

  private requireInvestmentsPoolAccount(): string {
    if (!this.investmentsPoolAccountId) {
      throw new Error('Conta pool investimentos indisponível');
    }
    return this.investmentsPoolAccountId;
  }

  private async getDirectoryEntry(
    normalized: string,
    pixType: PixKeyType,
  ): Promise<PixDirectoryEntry | undefined> {
    const record = await this.channelBanking.getDirectoryEntry(pixType, normalized);
    if (!record) {
      return undefined;
    }
    return {
      userId: record.userId,
      displayName: record.displayName,
      accountId: record.accountId,
      keyType: record.keyType as PixKeyType,
      rawKey: record.rawKey,
    };
  }

  private toDirectoryRecord(entry: PixDirectoryEntry): PixDirectoryRecord {
    return {
      userId: entry.userId,
      displayName: entry.displayName,
      accountId: entry.accountId,
      keyType: entry.keyType,
      rawKey: entry.rawKey,
    };
  }

  private mapKeyType(type: PixKeyItem['type']): PixKeyType {
    switch (type) {
      case 'cpf':
        return PixKeyType.CPF;
      case 'email':
        return PixKeyType.EMAIL;
      case 'phone':
        return PixKeyType.PHONE;
      default:
        return PixKeyType.EVP;
    }
  }

  private detectKeyType(key: string): PixKeyType {
    const trimmed = key.trim();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return PixKeyType.EMAIL;
    }
    const digits = trimmed.replace(/\D/g, '');
    if (digits.length === 11) {
      return PixKeyType.CPF;
    }
    if (digits.length === 14) {
      return PixKeyType.CNPJ;
    }
    if (/^\+?\d{10,13}$/.test(trimmed.replace(/[\s()-]/g, ''))) {
      return PixKeyType.PHONE;
    }
    return PixKeyType.EVP;
  }

  private normalizePixKey(key: string, type: PixKeyType): string {
    const trimmed = key.trim().toLowerCase();
    if (type === PixKeyType.CPF || type === PixKeyType.CNPJ) {
      return trimmed.replace(/\D/g, '');
    }
    if (type === PixKeyType.PHONE) {
      return trimmed.replace(/\D/g, '');
    }
    return trimmed;
  }

  private snapshotBalance(userId: string, balanceCents: string): void {
    if (!this.channelBanking.isMemoryMode()) {
      return;
    }
    this.channelBanking.snapshotBalance(userId, balanceCents);
  }

  private async applyWelcomeCreditIfEligible(
    userId: string,
    accountId: string,
  ): Promise<bigint> {
    const banking = this.channelBanking.isMemoryMode()
      ? this.channelBanking.getWelcomeCreditMeta()
      : { granted: {}, opened: 0, balanceCentsByUser: {} };
    if (banking.granted[userId]) {
      return 0n;
    }
    const opened = banking.opened ?? 0;
    if (opened >= BankingService.HOMOLOG_WELCOME_CREDIT_MAX) {
      return 0n;
    }
    if (!this.cashAssetAccountId) {
      return 0n;
    }
    const cents = BankingService.HOMOLOG_WELCOME_CREDIT_CENTS;
    const amount = Money.fromCents(cents);
    await this.core.ledger.post({
      correlationId: randomUUID(),
      idempotencyKey: `welcome-credit-${userId}`,
      postings: [
        {
          ledgerAccountId: this.cashAssetAccountId,
          accountClass: AccountClass.ASSET,
          side: PostingSide.DEBIT,
          amount,
        },
        {
          ledgerAccountId: accountId,
          accountClass: AccountClass.LIABILITY,
          side: PostingSide.CREDIT,
          amount,
        },
      ],
    });
    const slot = opened + 1;
    if (this.channelBanking.isMemoryMode()) {
      this.channelBanking.applyWelcomeCreditMeta(userId, slot, cents.toString());
    }
    const welcomeTxId = randomUUID();
    await this.publishSettled(userId, {
      paymentId: `welcome-${userId}`,
      transactionId: welcomeTxId,
      correlationId: randomUUID(),
      idempotencyKey: `welcome-credit-${userId}`,
      direction: 'inflow',
      amountCents: cents,
      title: 'Crédito de boas-vindas',
      party: 'Regenera Bank',
      channel: 'seed',
      icon: 'download',
      category: 'lifestyle',
    });
    this.logger.log(
      `Crédito homolog R$1,00 para ${maskUserId(userId)} (conta ${slot}/${BankingService.HOMOLOG_WELCOME_CREDIT_MAX})`,
    );
    return cents;
  }

  private async restoreLedgerBalance(
    userId: string,
    accountId: string,
  ): Promise<void> {
    const stored = this.channelBanking.isMemoryMode()
      ? this.channelBanking.getWelcomeCreditMeta().balanceCentsByUser[userId]
      : undefined;
    if (!stored || !this.cashAssetAccountId) {
      return;
    }
    const cents = BigInt(stored);
    if (cents <= 0n) {
      return;
    }
    const current = await this.core.ledger.signedBalance(
      accountId,
      AccountClass.LIABILITY,
    );
    if (current.amountCents >= cents) {
      return;
    }
    const delta = cents - current.amountCents;
    if (delta <= 0n) {
      return;
    }
    const amount = Money.fromCents(delta);
    await this.core.ledger.post({
      correlationId: randomUUID(),
      idempotencyKey: `restore-balance-${userId}`,
      postings: [
        {
          ledgerAccountId: this.cashAssetAccountId,
          accountClass: AccountClass.ASSET,
          side: PostingSide.DEBIT,
          amount,
        },
        {
          ledgerAccountId: accountId,
          accountClass: AccountClass.LIABILITY,
          side: PostingSide.CREDIT,
          amount,
        },
      ],
    });
    this.logger.log(
      `Saldo restaurado no ledger para ${maskUserId(userId)}: ${delta.toString()} centavos`,
    );
  }

  private maskKey(key: string, type: PixKeyType): string {
    const digits = key.replace(/\D/g, '');
    if (type === PixKeyType.CPF && digits.length === 11) {
      return `***.***.***-${digits.slice(-2)}`;
    }
    if (type === PixKeyType.EMAIL) {
      const [local, domain] = key.split('@');
      return `${local?.[0] ?? '*'}***@${domain ?? '***'}`;
    }
    return key.slice(0, 4) + '...';
  }
}