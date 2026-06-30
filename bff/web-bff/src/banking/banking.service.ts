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
  PixKeyType,
  PostingSide,
} from '../integrations/core-bank';
import { maskUserId } from '../common/pii-redaction';
import { HomologStoreService } from '../persistence/homolog-store.service';
import type { PixDirectoryRecord } from '../persistence/homolog-store.types';
import {
  DashboardResponse,
  OpenCustomerAccountResult,
  PixKeyItem,
  PixLookupResponse,
  PixTransferResponse,
  TransactionItem,
  TransferResponse,
} from './banking.dto';

const isAccountRefConflict = (
  error: unknown,
): error is ConflictException & { code: 'ACCOUNT_EXTERNAL_REFERENCE_EXISTS' } =>
  error instanceof ConflictException &&
  error.code === 'ACCOUNT_EXTERNAL_REFERENCE_EXISTS';

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
  private static readonly AGENCY = '0001';
  /** Homolog: R$ 1,00 nas primeiras 30 contas abertas */
  private static readonly HOMOLOG_WELCOME_CREDIT_MAX = 30;
  private static readonly HOMOLOG_WELCOME_CREDIT_CENTS = 100n;

  constructor(
    private readonly core: CoreBankService,
    private readonly auth: AuthService,
    private readonly store: HomologStoreService,
    @Inject(forwardRef(() => OnboardingService))
    private readonly onboarding: OnboardingService,
  ) {}

  async onModuleInit(): Promise<void> {
    const clearing = await this.core.accounts.open({
      accountClass: AccountClass.LIABILITY,
      externalReference: 'pix-clearing',
    });
    this.clearingAccountId = clearing.id;
    const cashAsset = await this.core.accounts.open({
      accountClass: AccountClass.ASSET,
      externalReference: 'homolog-cash-asset',
    });
    this.cashAssetAccountId = cashAsset.id;
    await this.reconcileAccountsAfterRestart();
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
    const recent = this.getTransactions(userId).slice(0, 10);
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

  getTransactions(userId: string): TransactionItem[] {
    const list = this.store.get().banking.transactionsByUser[userId] ?? [];
    return [...list].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }

  listPixKeys(userId: string): PixKeyItem[] {
    return [...(this.store.get().banking.pixKeysByUser[userId] ?? [])];
  }

  async registerPixKey(
    userId: string,
    key: string,
    keyType: PixKeyItem['type'],
  ): Promise<PixKeyItem> {
    const accountId = await this.resolveAccountForUser(userId);
    const pixType = this.mapKeyType(keyType);
    const normalized = this.normalizePixKey(key, pixType);
    if (this.store.get().banking.pixDirectory[normalized]) {
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
    this.store.mutate((draft) => {
      const list = draft.banking.pixKeysByUser[userId] ?? [];
      list.push(item);
      draft.banking.pixKeysByUser[userId] = list;
      draft.banking.pixDirectory[normalized] = entry;
    });
    return item;
  }

  lookupPixKey(key: string): PixLookupResponse {
    const trimmed = key.trim();
    if (!trimmed) {
      return { found: false };
    }
    const pixType = this.detectKeyType(trimmed);
    const normalized = this.normalizePixKey(trimmed, pixType);
    const entry = this.getDirectoryEntry(normalized);
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
    const entry = this.getDirectoryEntry(normalized);
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
      await this.settlePayment(pix.paymentId);
    } catch (error: unknown) {
      this.rethrowPaymentError(error);
    }
    const receiverName =
      entry?.displayName ?? pix.receiverMasked;
    this.appendTransaction(userId, {
      id: pix.id,
      title: 'Pix enviado',
      party: receiverName,
      date: new Date().toISOString(),
      amountCents: (-amountCents).toString(),
      type: 'outflow',
      channel: 'pix',
      icon: 'send',
      category: 'essential',
    });
    if (entry && entry.userId !== userId) {
      this.appendTransaction(entry.userId, {
        id: `${pix.id}-in`,
        title: 'Pix recebido',
        party: this.auth.getUserDisplayName(userId) ?? 'Cliente',
        date: new Date().toISOString(),
        amountCents: amountCents.toString(),
        type: 'inflow',
        channel: 'pix',
        icon: 'download',
        category: 'lifestyle',
      });
    }
    const dashboard = await this.getDashboard(userId);
    return {
      endToEndId: pix.endToEndId,
      paymentId: pix.paymentId,
      receiverMasked: pix.receiverMasked,
      amountCents: amountCents.toString(),
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
      await this.settlePayment(payment.id);
    } catch (error: unknown) {
      this.rethrowPaymentError(error);
    }
    const creditorName =
      this.auth.getUserDisplayName(creditorUserId) ?? 'Cliente';
    const debtorName = this.auth.getUserDisplayName(userId) ?? 'Cliente';
    this.appendTransaction(userId, {
      id: payment.id,
      title: 'Transferência enviada',
      party: creditorName,
      date: new Date().toISOString(),
      amountCents: (-amountCents).toString(),
      type: 'outflow',
      channel: 'transfer',
      icon: 'send',
      category: 'essential',
    });
    this.appendTransaction(creditorUserId, {
      id: `${payment.id}-in`,
      title: 'Transferência recebida',
      party: debtorName,
      date: new Date().toISOString(),
      amountCents: amountCents.toString(),
      type: 'inflow',
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

  private rethrowPaymentError(error: unknown): never {
    if (
      error instanceof ConflictException &&
      error.code === 'PAYMENT_INSUFFICIENT_FUNDS'
    ) {
      throw new HttpConflictException('Saldo insuficiente');
    }
    throw error;
  }

  private async settlePayment(paymentId: string): Promise<void> {
    await this.core.payments.markSent(paymentId);
    await this.core.payments.markSettled(paymentId);
  }

  private appendTransaction(userId: string, item: TransactionItem): void {
    this.store.mutate((draft) => {
      const list = draft.banking.transactionsByUser[userId] ?? [];
      list.unshift(item);
      draft.banking.transactionsByUser[userId] = list;
    });
  }

  private async ensureDefaultPixKey(
    userId: string,
    accountId: string,
  ): Promise<void> {
    const existing = this.store.get().banking.pixKeysByUser[userId] ?? [];
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

    const registerKey = (
      type: PixKeyItem['type'],
      rawKey: string,
      pixType: PixKeyType,
    ) => {
      const normalized = this.normalizePixKey(rawKey, pixType);
      if (this.store.get().banking.pixDirectory[normalized]) {
        return;
      }
      const keyItem: PixKeyItem = {
        id: randomUUID(),
        type,
        key: rawKey,
        createdAt: new Date().toLocaleDateString('pt-BR'),
      };
      keys.push(keyItem);
      directoryUpdates[normalized] = this.toDirectoryRecord({
        userId,
        displayName: this.auth.getUserDisplayName(userId) ?? 'Cliente',
        accountId,
        keyType: pixType,
        rawKey,
      });
    };

    if (userId.length === 11) {
      const cpfKey = userId.replace(
        /(\d{3})(\d{3})(\d{3})(\d{2})/,
        '$1.$2.$3-$4',
      );
      registerKey('cpf', cpfKey, PixKeyType.CPF);
    }

    const email = this.auth.getUserEmail(userId);
    if (email) {
      registerKey('email', email, PixKeyType.EMAIL);
    }

    const phone = this.auth.getUserPhone(userId);
    if (phone) {
      registerKey('phone', phone, PixKeyType.PHONE);
    }

    this.store.mutate((draft) => {
      draft.banking.pixKeysByUser[userId] = keys;
      for (const [normalized, entry] of Object.entries(directoryUpdates)) {
        draft.banking.pixDirectory[normalized] = entry;
      }
    });
  }

  syncPixDisplayName(userId: string, displayName: string): void {
    const trimmed = displayName.trim();
    if (!trimmed) {
      return;
    }
    this.store.mutate((draft) => {
      for (const [key, entry] of Object.entries(draft.banking.pixDirectory)) {
        if (entry.userId === userId) {
          draft.banking.pixDirectory[key] = { ...entry, displayName: trimmed };
        }
      }
    });
  }

  async openCustomerAccount(
    userId: string,
  ): Promise<OpenCustomerAccountResult> {
    this.onboarding.requireKycApproved(userId);
    const existing = this.store.get().banking.accountsByUser[userId];
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
        customerId = String(error.getBody().details?.accountId ?? '');
        if (!customerId) {
          throw error;
        }
      } else {
        throw error;
      }
    }
    this.store.mutate((draft) => {
      draft.banking.accountsByUser[userId] = customerId;
    });
    await this.ensureDefaultPixKey(userId, customerId);
    this.syncPixDisplayName(
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
    this.store.mutate((draft) => {
      for (const userId of activeIds) {
        delete draft.banking.accountsByUser[userId];
        draft.banking.pixKeysByUser[userId] = [];
      }
      draft.banking.pixDirectory = Object.fromEntries(
        Object.entries(draft.banking.pixDirectory).filter(
          ([, entry]) => !activeIds.includes(entry.userId),
        ),
      );
    });
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
    const existing = this.store.get().banking.accountsByUser[userId];
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

  private getDirectoryEntry(normalized: string): PixDirectoryEntry | undefined {
    const record = this.store.get().banking.pixDirectory[normalized];
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
    this.store.mutate((draft) => {
      draft.banking.balanceCentsByUser[userId] = balanceCents;
    });
  }

  private async applyWelcomeCreditIfEligible(
    userId: string,
    accountId: string,
  ): Promise<bigint> {
    const banking = this.store.get().banking;
    if (banking.welcomeCreditGrantedUserIds?.[userId]) {
      return 0n;
    }
    const opened = banking.welcomeCreditAccountsOpened ?? 0;
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
    this.store.mutate((draft) => {
      if (!draft.banking.welcomeCreditGrantedUserIds) {
        draft.banking.welcomeCreditGrantedUserIds = {};
      }
      draft.banking.welcomeCreditGrantedUserIds[userId] = true;
      draft.banking.welcomeCreditAccountsOpened = slot;
      draft.banking.balanceCentsByUser[userId] = cents.toString();
    });
    this.appendTransaction(userId, {
      id: randomUUID(),
      title: 'Crédito de boas-vindas',
      party: 'Regenera Bank',
      date: new Date().toISOString(),
      amountCents: cents.toString(),
      type: 'inflow',
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
    const stored = this.store.get().banking.balanceCentsByUser[userId];
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