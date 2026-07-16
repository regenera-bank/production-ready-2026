import { createHash, randomUUID } from 'crypto';
import { Injectable, Optional } from '@nestjs/common';
import { Pool } from 'pg';
import { DocumentAssetPgStore } from './document-asset-pg.store';
import { DocumentObjectStore } from './document-object-store';

export interface DocumentAssetMeta {
  readonly id: string;
  readonly customerId: string;
  readonly journeyId?: string;
  readonly contentType: string;
  readonly sha256: string;
  readonly storageBucket?: string;
  readonly storageKey?: string;
  readonly createdAt: string;
}

interface StoredAsset {
  readonly meta: DocumentAssetMeta;
  readonly content: string;
}

@Injectable()
export class DocumentAssetService {
  private readonly vault = new Map<string, StoredAsset>();
  private readonly objectStore = DocumentObjectStore.fromEnv();
  private readonly pgStore?: DocumentAssetPgStore;

  constructor(@Optional() pool?: Pool) {
    if (pool) {
      this.pgStore = new DocumentAssetPgStore(pool);
    }
  }

  /** Memória — testes e fallback. Produção: registerAsync. */
  register(
    customerId: string,
    content: string,
    contentType = 'image/jpeg',
    journeyId?: string,
  ): DocumentAssetMeta {
    const trimmed = content.trim();
    if (!trimmed) {
      throw new Error('Conteúdo do documento vazio');
    }
    const sha256 = createHash('sha256').update(trimmed).digest('hex');
    const meta: DocumentAssetMeta = {
      id: `doc_${randomUUID().replace(/-/g, '')}`,
      customerId,
      journeyId,
      contentType,
      sha256,
      createdAt: new Date().toISOString(),
    };
    this.vault.set(meta.id, { meta, content: trimmed });
    return meta;
  }

  /** §6 — blob em object store; metadados em document_assets (PG). */
  async registerAsync(
    customerId: string,
    content: string,
    contentType = 'image/jpeg',
    journeyId?: string,
    assetKind: 'RG' | 'CNH' | 'SELFIE' | 'LIVENESS' | 'OTHER' = 'RG',
  ): Promise<DocumentAssetMeta> {
    const trimmed = content.trim();
    if (!trimmed) {
      throw new Error('Conteúdo do documento vazio');
    }
    const raw = trimmed.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(raw, 'base64');
    const sha256 = createHash('sha256').update(buffer).digest('hex');

    if (this.pgStore) {
      const uuid = await this.pgStore.resolveCustomerUuid(customerId);
      if (uuid) {
        const object = this.objectStore.put(customerId, assetKind, buffer, contentType);
        const row = await this.pgStore.insertAsset(uuid, journeyId, assetKind, object);
        const meta: DocumentAssetMeta = {
          id: row.id,
          customerId,
          journeyId,
          contentType: row.contentType,
          sha256: row.sha256,
          storageBucket: row.storageBucket,
          storageKey: row.storageKey,
          createdAt: new Date().toISOString(),
        };
        this.vault.set(meta.id, { meta, content: trimmed });
        return meta;
      }
    }
    return this.register(customerId, trimmed, contentType, journeyId);
  }

  getContent(assetId: string): string | undefined {
    return this.vault.get(assetId)?.content;
  }

  async getContentAsync(assetId: string): Promise<string | undefined> {
    const cached = this.vault.get(assetId)?.content;
    if (cached) {
      return cached;
    }
    if (!this.pgStore) {
      return undefined;
    }
    const row = await this.pgStore.findById(assetId);
    if (!row) {
      return undefined;
    }
    const bytes = this.objectStore.read(row.storageBucket, row.storageKey);
    return `data:${row.contentType};base64,${bytes.toString('base64')}`;
  }

  getMeta(assetId: string): DocumentAssetMeta | undefined {
    return this.vault.get(assetId)?.meta;
  }

  revoke(assetId: string): void {
    this.vault.delete(assetId);
  }

  reset(): void {
    this.vault.clear();
  }
}