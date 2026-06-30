import { Injectable } from '@nestjs/common';
import { LedgerAccount } from './account.entity';
import { AccountRepository } from './account.repository';

// Repositório em memória só para PR-03 e testes — V001 em PR-04a troca por Postgres.
// Comportamento idêntico ao contrato; persistência real não é escopo deste PR.
@Injectable()
export class InMemoryAccountRepository implements AccountRepository {
  private readonly byId = new Map<string, LedgerAccount>();
  private readonly byExternalRef = new Map<string, LedgerAccount>();

  async save(account: LedgerAccount): Promise<LedgerAccount> {
    this.byId.set(account.id, account);
    if (account.externalReference !== null) {
      this.byExternalRef.set(account.externalReference, account);
    }
    return account;
  }

  async findById(id: string): Promise<LedgerAccount | null> {
    return this.byId.get(id) ?? null;
  }

  async findByExternalReference(reference: string): Promise<LedgerAccount | null> {
    return this.byExternalRef.get(reference) ?? null;
  }

  clear(): void {
    this.byId.clear();
    this.byExternalRef.clear();
  }
}