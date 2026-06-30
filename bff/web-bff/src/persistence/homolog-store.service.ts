import {
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import {
  emptyHomologSnapshot,
  HomologSnapshot,
} from './homolog-store.types';

@Injectable()
export class HomologStoreService implements OnModuleInit {
  private readonly logger = new Logger(HomologStoreService.name);
  private readonly memoryOnly =
    process.env.HOMOLOG_STORE_MEMORY === 'true' ||
    process.env.NODE_ENV === 'test';
  private readonly filePath =
    process.env.HOMOLOG_STORE_PATH ??
    join(process.cwd(), '.data', 'homolog-store.json');
  private snapshot: HomologSnapshot = emptyHomologSnapshot();
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  onModuleInit(): void {
    if (this.memoryOnly) {
      this.snapshot = emptyHomologSnapshot();
      return;
    }
    this.snapshot = this.loadFromDisk();
    this.logger.log(
      `Homolog store carregado (${Object.keys(this.snapshot.users).length} usuários)`,
    );
  }

  get(): HomologSnapshot {
    return this.snapshot;
  }

  replace(next: HomologSnapshot): void {
    this.snapshot = next;
    this.scheduleSave();
  }

  mutate(mutator: (draft: HomologSnapshot) => void): void {
    const draft: HomologSnapshot = structuredClone(this.snapshot);
    mutator(draft);
    this.snapshot = draft;
    this.scheduleSave();
  }

  reset(): void {
    this.snapshot = emptyHomologSnapshot();
    if (!this.memoryOnly) {
      this.flushToDisk();
    }
  }

  private scheduleSave(): void {
    if (this.memoryOnly) {
      return;
    }
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      this.flushToDisk();
    }, 80);
  }

  private loadFromDisk(): HomologSnapshot {
    try {
      const raw = readFileSync(this.filePath, 'utf8');
      const parsed = JSON.parse(raw) as HomologSnapshot;
      if (parsed.version !== 1) {
        return emptyHomologSnapshot();
      }
      return {
        ...emptyHomologSnapshot(),
        ...parsed,
        banking: {
          ...emptyHomologSnapshot().banking,
          ...parsed.banking,
          balanceCentsByUser: parsed.banking?.balanceCentsByUser ?? {},
          welcomeCreditGrantedUserIds:
            parsed.banking?.welcomeCreditGrantedUserIds ?? {},
          welcomeCreditAccountsOpened:
            parsed.banking?.welcomeCreditAccountsOpened ?? 0,
        },
        prometeoPayments: parsed.prometeoPayments ?? {},
        prometeoProcessedEventIds: parsed.prometeoProcessedEventIds ?? {},
        passwordResetTokens: parsed.passwordResetTokens ?? {},
        passwordResetActiveByUserId: parsed.passwordResetActiveByUserId ?? {},
        passwordResetRateLimits: parsed.passwordResetRateLimits ?? {},
        passwordResetAudit: parsed.passwordResetAudit ?? [],
      };
    } catch {
      return emptyHomologSnapshot();
    }
  }

  private flushToDisk(): void {
    try {
      mkdirSync(dirname(this.filePath), { recursive: true });
      const tmp = `${this.filePath}.tmp`;
      writeFileSync(tmp, JSON.stringify(this.snapshot, null, 2), 'utf8');
      renameSync(tmp, this.filePath);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'erro desconhecido';
      this.logger.error(`Falha ao persistir homolog store: ${message}`);
    }
  }
}