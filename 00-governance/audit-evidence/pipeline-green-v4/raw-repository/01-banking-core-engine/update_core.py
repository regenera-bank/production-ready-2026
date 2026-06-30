import re

with open('src/core/core.service.ts', 'r') as f:
    content = f.read()

# Add imports
content = content.replace("import { TransactionEntity } from './entities/transaction.entity';",
"import { TransactionEntity } from './entities/transaction.entity';\nimport { OutboxEventEntity } from './entities/outbox-event.entity';\nimport { createHash } from 'crypto';")

record_ledger_entry = """
  private async recordLedgerEntry(queryRunner: any, accountId: string, amountCents: number, balanceAfterCents: number, type: string, meta?: Partial<TransactionEntity>) {
    const txRepo = queryRunner.manager.getRepository(TransactionEntity);
    const outboxRepo = queryRunner.manager.getRepository(OutboxEventEntity);
    const lastTx = await txRepo.createQueryBuilder('tx').where('tx.accountId = :accountId', { accountId }).orderBy('tx.createdAt', 'DESC').getOne();
    const previousHash = lastTx?.hash || 'GENESIS_HASH';
    const idempotencyKey = meta?.idempotencyKey || null;
    const createdAt = new Date();
    const rawString = `${previousHash}|${accountId}|${amountCents}|${type}|${idempotencyKey}|${createdAt.toISOString()}`;
    const hash = createHash('sha256').update(rawString).digest('hex');
    const entry = txRepo.create({ accountId, amountCents, balanceAfterCents, type, status: 'SETTLED', counterpartyName: meta?.counterpartyName, counterpartyKey: meta?.counterpartyKey, endToEndId: meta?.endToEndId, idempotencyKey, previousHash, hash, createdAt });
    await txRepo.save(entry);
    await outboxRepo.save(outboxRepo.create({ topic: 'ledger.transaction.settled', payload: { transactionId: entry.id, accountId, amountCents, balanceAfterCents, type, hash } }));
    return entry;
  }
"""

content = content.replace("async freezeAccount", record_ledger_entry + "\n  async freezeAccount")

# freezeAccount
freeze_old = """      // Adiciona flag de auditoria para o BACEN no histórico
      await queryRunner.manager.getRepository(TransactionEntity).save(
        queryRunner.manager.getRepository(TransactionEntity).create({
          accountId: account.id,
          amount: 0,
          type: 'ACCOUNT_FROZEN',
          status: 'SETTLED',
          counterpartyName: 'BACEN / COAF',
          endToEndId: `FREEZE_${Date.now()}`
        })
      );"""

freeze_new = """      await this.recordLedgerEntry(queryRunner, account.id, 0, Number(account.balanceCents), 'ACCOUNT_FROZEN', { counterpartyName: 'BACEN / COAF', endToEndId: `FREEZE_${Date.now()}` });"""

content = content.replace(freeze_old, freeze_new)

# debit
debit_old = """  async debit(neuralId: string, amount: number, meta?: Partial<TransactionEntity>): Promise<number> {
    if (meta?.idempotencyKey) {
      const existing = await this.txRepo.findOne({ where: { idempotencyKey: meta.idempotencyKey } as any });
      if (existing) {
        this.logger.log(`[Idempotência] Requisão duplicada barrada no dédito: ${meta.idempotencyKey}`);
        const acc = await this.getActiveAccountStrict(neuralId);
        return Number(acc.balanceCents) / 100;
      }
    }

    return this.executeAtomicOperation(neuralId, async (account, queryRunner) => {
      const amountCents = Math.round(amount * 100);
      const balanceCents = Number(account.balanceCents);

      if (balanceCents < amountCents) {
        throw new InsufficientFundsException();
      }

      const newBalance = (balanceCents - amountCents) / 100;
      account.balanceCents = balanceCents - amountCents;
      
      await queryRunner.manager.getRepository(AccountEntity).save(account);

      await queryRunner.manager.getRepository(TransactionEntity).save(
        queryRunner.manager.getRepository(TransactionEntity).create({
          accountId: account.id,
          amount: -amount,
          type: meta?.type || 'DEBIT',
          status: 'SETTLED',
          counterpartyName: meta?.counterpartyName,
          counterpartyKey: meta?.counterpartyKey,
          endToEndId: meta?.endToEndId,
          idempotencyKey: meta?.idempotencyKey,
        }),
      );

      this.logger.log(`[LEDGER OUT] Conta ${account.accountNumber} debitada em ${amount}. Novo saldo: ${newBalance}`);
      return newBalance;
    });
  }"""

debit_new = """  async debit(neuralId: string, amountCents: number, meta?: Partial<TransactionEntity>): Promise<number> {
    if (meta?.idempotencyKey) {
      const existing = await this.txRepo.findOne({ where: { idempotencyKey: meta.idempotencyKey } as any });
      if (existing) {
        this.logger.log(`[Idempotência] Requisão duplicada barrada no dédito: ${meta.idempotencyKey}`);
        const acc = await this.getActiveAccountStrict(neuralId);
        return Number(acc.balanceCents) / 100;
      }
    }

    return this.executeAtomicOperation(neuralId, async (account, queryRunner) => {
      const balanceCents = Number(account.balanceCents);

      if (balanceCents < amountCents) {
        throw new InsufficientFundsException();
      }

      const newBalanceCents = balanceCents - amountCents;
      account.balanceCents = newBalanceCents;
      
      await queryRunner.manager.getRepository(AccountEntity).save(account);

      await this.recordLedgerEntry(queryRunner, account.id, -amountCents, newBalanceCents, meta?.type || 'DEBIT', meta);

      this.logger.log(`[LEDGER OUT] Conta ${account.accountNumber} debitada em ${amountCents/100}. Novo saldo: ${newBalanceCents/100}`);
      return newBalanceCents / 100;
    });
  }"""
content = content.replace(debit_old, debit_new)

# credit
credit_old = """  async credit(accountId: string, amount: number, meta?: Partial<TransactionEntity>): Promise<number> {
    if (meta?.idempotencyKey) {
      const existing = await this.txRepo.findOne({ where: { idempotencyKey: meta.idempotencyKey } as any });
      if (existing) {
        this.logger.log(`[Idempotência] Requisão duplicada barrada no crédito: ${meta.idempotencyKey}`);
        const acc = await this.accountRepo.findOne({ where: { id: accountId } });
        return acc ? Number(acc.balanceCents) / 100 : 0;
      }
    }

    return this.executeAtomicOperation(accountId, async (account, queryRunner) => {
      const amountCents = Math.round(amount * 100);
      const balanceCents = Number(account.balanceCents);

      const newBalance = (balanceCents + amountCents) / 100;
      account.balanceCents = balanceCents + amountCents;
      
      await queryRunner.manager.getRepository(AccountEntity).save(account);

      await queryRunner.manager.getRepository(TransactionEntity).save(
        queryRunner.manager.getRepository(TransactionEntity).create({
          accountId: account.id,
          amount: Math.abs(amount),
          type: meta?.type || 'CREDIT',
          status: 'SETTLED',
          counterpartyName: meta?.counterpartyName,
          counterpartyKey: meta?.counterpartyKey,
          endToEndId: meta?.endToEndId,
          idempotencyKey: meta?.idempotencyKey,
        }),
      );

      this.logger.log(`[LEDGER IN] Conta ${account.accountNumber} creditada em ${amount}. Novo saldo: ${newBalance}`);
      return newBalance;
    });
  }"""

credit_new = """  async credit(accountId: string, amountCents: number, meta?: Partial<TransactionEntity>): Promise<number> {
    if (meta?.idempotencyKey) {
      const existing = await this.txRepo.findOne({ where: { idempotencyKey: meta.idempotencyKey } as any });
      if (existing) {
        this.logger.log(`[Idempotência] Requisão duplicada barrada no crédito: ${meta.idempotencyKey}`);
        const acc = await this.accountRepo.findOne({ where: { id: accountId } });
        return acc ? Number(acc.balanceCents) / 100 : 0;
      }
    }

    return this.executeAtomicOperation(accountId, async (account, queryRunner) => {
      const balanceCents = Number(account.balanceCents);

      const newBalanceCents = balanceCents + amountCents;
      account.balanceCents = newBalanceCents;
      
      await queryRunner.manager.getRepository(AccountEntity).save(account);

      await this.recordLedgerEntry(queryRunner, account.id, amountCents, newBalanceCents, meta?.type || 'CREDIT', meta);

      this.logger.log(`[LEDGER IN] Conta ${account.accountNumber} creditada em ${amountCents/100}. Novo saldo: ${newBalanceCents/100}`);
      return newBalanceCents / 100;
    });
  }"""
content = content.replace(credit_old, credit_new)

# calcVolume
calcVolumeOld = """  async calculateDailyVolume(accountId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const txs = await this.txRepo.createQueryBuilder('tx')
      .where('tx.accountId = :accountId', { accountId })
      .andWhere('tx.amount < 0')
      .andWhere('tx.createdAt >= :today', { today })
      .getMany();

    const volume = txs.reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0);
    return Math.round(volume * 100);
  }"""

calcVolumeNew = """  async calculateDailyVolume(accountId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const txs = await this.txRepo.createQueryBuilder('tx')
      .where('tx.accountId = :accountId', { accountId })
      .andWhere('tx.amountCents < 0')
      .andWhere('tx.createdAt >= :today', { today })
      .getMany();

    const volumeCents = txs.reduce((sum, tx) => sum + Math.abs(Number(tx.amountCents)), 0);
    return volumeCents;
  }"""
content = content.replace(calcVolumeOld, calcVolumeNew)

# transfer
transferOld = """  async transfer(senderId: string, receiverId: string, amount: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('READ COMMITTED');

    try {
      const accountRepo = queryRunner.manager.getRepository(AccountEntity);
      const txRepo = queryRunner.manager.getRepository(TransactionEntity);
      const amountCents = Math.round(amount * 100);

      // Lock Ordenado para evitar Deadlocks (ordena IDs lexicalmente)
      const lockOrder = [senderId, receiverId].sort();

      const accountA = await accountRepo.createQueryBuilder('a').where('a.neuralId = :id', { id: lockOrder[0] }).setLock('pessimistic_write').getOne();
      const accountB = await accountRepo.createQueryBuilder('a').where('a.neuralId = :id', { id: lockOrder[1] }).setLock('pessimistic_write').getOne();

      if (!accountA || !accountB) throw new FinancialSecurityException('Falha de consistência: Conta de destino ou origem inválida.');

      const sender = senderId === lockOrder[0] ? accountA : accountB;
      const receiver = receiverId === lockOrder[0] ? accountA : accountB;

      if (sender.status !== 'ACTIVE' || receiver.status !== 'ACTIVE') {
        throw new FinancialSecurityException('Operação bloqueada. Uma das contas envolvidas está inativa.');
      }

      const senderBalanceCents = Number(sender.balanceCents);
      
      if (senderBalanceCents < amountCents) {
        throw new InsufficientFundsException();
      }

      // Liquidação
      sender.balanceCents = senderBalanceCents - amountCents;
      receiver.balanceCents = Number(receiver.balanceCents) + amountCents;

      await accountRepo.save([sender, receiver]);

      const e2eInternal = `I${Date.now()}${'12345678'}`;

      // Comprovantes Imutáveis
      await txRepo.save([
        txRepo.create({ accountId: sender.id, amount: -amount, type: 'INTERNAL_TED_OUT', status: 'SETTLED', counterpartyKey: receiverId, endToEndId: e2eInternal }),
        txRepo.create({ accountId: receiver.id, amount: amount, type: 'INTERNAL_TED_IN', status: 'SETTLED', counterpartyKey: senderId, endToEndId: e2eInternal })
      ]);

      await queryRunner.commitTransaction();
      this.logger.log(`[TED COMPLETA] Transferência ${e2eInternal} liquidada. Valor: ${amount}. Origem: ${senderId}`);

      return { status: 'SETTLED_INTERNAL', amount, endToEndId: e2eInternal, timestamp: new Date().toISOString() };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`[CRÍTICO] Falha no assentamento de TED entre ${senderId} e ${receiverId}. Rollback executado. Erro: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }"""

content = re.sub(r"  async transfer\(senderId: string, receiverId: string, amount: number\) \{[\s\S]*?finally \{\s*await queryRunner\.release\(\);\s*\}\s*\}", 
"""  async transfer(senderId: string, receiverId: string, amountCents: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('READ COMMITTED');

    try {
      const accountRepo = queryRunner.manager.getRepository(AccountEntity);

      // Lock Ordenado para evitar Deadlocks (ordena IDs lexicalmente)
      const lockOrder = [senderId, receiverId].sort();

      const accountA = await accountRepo.createQueryBuilder('a').where('a.neuralId = :id', { id: lockOrder[0] }).setLock('pessimistic_write').getOne();
      const accountB = await accountRepo.createQueryBuilder('a').where('a.neuralId = :id', { id: lockOrder[1] }).setLock('pessimistic_write').getOne();

      if (!accountA || !accountB) throw new FinancialSecurityException('Falha de consistência: Conta de destino ou origem inválida.');

      const sender = senderId === lockOrder[0] ? accountA : accountB;
      const receiver = receiverId === lockOrder[0] ? accountA : accountB;

      if (sender.status !== 'ACTIVE' || receiver.status !== 'ACTIVE') {
        throw new FinancialSecurityException('Operação bloqueada. Uma das contas envolvidas está inativa.');
      }

      const senderBalanceCents = Number(sender.balanceCents);
      
      if (senderBalanceCents < amountCents) {
        throw new InsufficientFundsException();
      }

      // Liquidação
      sender.balanceCents = senderBalanceCents - amountCents;
      receiver.balanceCents = Number(receiver.balanceCents) + amountCents;

      await accountRepo.save([sender, receiver]);

      const e2eInternal = `I${Date.now()}`;

      // Comprovantes Imutáveis
      await this.recordLedgerEntry(queryRunner, sender.id, -amountCents, sender.balanceCents, 'INTERNAL_TED_OUT', { counterpartyKey: receiverId, endToEndId: e2eInternal });
      await this.recordLedgerEntry(queryRunner, receiver.id, amountCents, receiver.balanceCents, 'INTERNAL_TED_IN', { counterpartyKey: senderId, endToEndId: e2eInternal });

      await queryRunner.commitTransaction();
      this.logger.log(`[TED COMPLETA] Transferência ${e2eInternal} liquidada. Valor: ${amountCents/100}. Origem: ${senderId}`);

      return { status: 'SETTLED_INTERNAL', amount: amountCents / 100, endToEndId: e2eInternal, timestamp: new Date().toISOString() };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`[CRÍTICO] Falha no assentamento de TED entre ${senderId} e ${receiverId}. Rollback executado. Erro: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }""", content)

# executePixAtomic
atomic_old = """  async executePixAtomic(senderNeuralId: string, receiverKey: string, amount: number, meta: { endToEndId: string; idempotencyKey?: string; typeOut?: string; typeIn?: string }) {
    // Delegado de Pix para TED interno caso a chave pertença a uma conta do mesmo ecossistema (Routing Inteligente)
    const isInternalRouting = receiverKey.includes('RG-') || receiverKey.startsWith('0001');

    if (isInternalRouting) {
      return this.transfer(senderNeuralId, receiverKey, amount);
    }

    // PIX SPI Externo (Apenas debita, pois o crédito é liquidado no banco de destino pelo Bacen)
    const newBalance = await this.debit(senderNeuralId, amount, {
      type: meta.typeOut || 'PIX_SPI_OUT',
      counterpartyKey: receiverKey,
      endToEndId: meta.endToEndId,
      idempotencyKey: meta.idempotencyKey,
    });

    return { status: 'DEBITED_SPI_READY', amount, senderNewBalance: newBalance, timestamp: new Date().toISOString() };
  }"""

atomic_new = """  async executePixAtomic(senderNeuralId: string, receiverKey: string, amountCents: number, meta: { endToEndId: string; idempotencyKey?: string; typeOut?: string; typeIn?: string }) {
    // Delegado de Pix para TED interno caso a chave pertença a uma conta do mesmo ecossistema (Routing Inteligente)
    const isInternalRouting = receiverKey.includes('RG-') || receiverKey.startsWith('0001');

    if (isInternalRouting) {
      return this.transfer(senderNeuralId, receiverKey, amountCents);
    }

    // PIX SPI Externo (Apenas debita, pois o crédito é liquidado no banco de destino pelo Bacen)
    const newBalance = await this.debit(senderNeuralId, amountCents, {
      type: meta.typeOut || 'PIX_SPI_OUT',
      counterpartyKey: receiverKey,
      endToEndId: meta.endToEndId,
      idempotencyKey: meta.idempotencyKey,
    });

    return { status: 'DEBITED_SPI_READY', amount: amountCents/100, senderNewBalance: newBalance, timestamp: new Date().toISOString() };
  }"""
content = content.replace(atomic_old, atomic_new)

with open('src/core/core.service.ts', 'w') as f:
    f.write(content)
