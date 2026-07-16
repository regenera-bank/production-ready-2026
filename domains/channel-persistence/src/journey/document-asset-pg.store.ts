import { Pool } from 'pg';
import type { StoredObjectRef } from './document-object-store';

export interface DocumentAssetRow {
  readonly id: string;
  readonly customerId: string;
  readonly assetKind: string;
  readonly storageBucket: string;
  readonly storageKey: string;
  readonly contentType: string;
  readonly sha256: string;
}

export class DocumentAssetPgStore {
  constructor(private readonly pool: Pool) {}

  async resolveCustomerUuid(externalRef: string): Promise<string | null> {
    const row = await this.pool.query<{ id: string }>(
      `SELECT id FROM channel_experience.customers WHERE external_ref = $1 LIMIT 1`,
      [externalRef],
    );
    return row.rows[0]?.id ?? null;
  }

  async insertAsset(
    customerUuid: string,
    journeyId: string | undefined,
    assetKind: string,
    object: StoredObjectRef,
    encryptionKeyId = 'homolog-local-v1',
  ): Promise<DocumentAssetRow> {
    const retention = new Date();
    retention.setFullYear(retention.getFullYear() + 5);
    const inserted = await this.pool.query<{
      id: string;
      customer_id: string;
      asset_kind: string;
      storage_bucket: string;
      storage_key: string;
      content_type: string;
      sha256: string;
    }>(
      `INSERT INTO channel_experience.document_assets
         (customer_id, journey_id, asset_kind, storage_bucket, storage_key,
          content_type, size_bytes, sha256, encryption_key_id, retention_until)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::timestamptz)
       RETURNING id, customer_id, asset_kind, storage_bucket, storage_key, content_type, sha256`,
      [
        customerUuid,
        journeyId ?? null,
        assetKind,
        object.bucket,
        object.key,
        object.contentType,
        object.sizeBytes,
        object.sha256,
        encryptionKeyId,
        retention.toISOString(),
      ],
    );
    const row = inserted.rows[0];
    return {
      id: row.id,
      customerId: row.customer_id,
      assetKind: row.asset_kind,
      storageBucket: row.storage_bucket,
      storageKey: row.storage_key,
      contentType: row.content_type,
      sha256: row.sha256,
    };
  }

  async findById(assetId: string): Promise<DocumentAssetRow | null> {
    const row = await this.pool.query<{
      id: string;
      customer_id: string;
      asset_kind: string;
      storage_bucket: string;
      storage_key: string;
      content_type: string;
      sha256: string;
    }>(
      `SELECT id, customer_id, asset_kind, storage_bucket, storage_key, content_type, sha256
       FROM channel_experience.document_assets WHERE id = $1::uuid LIMIT 1`,
      [assetId],
    );
    const found = row.rows[0];
    if (!found) {
      return null;
    }
    return {
      id: found.id,
      customerId: found.customer_id,
      assetKind: found.asset_kind,
      storageBucket: found.storage_bucket,
      storageKey: found.storage_key,
      contentType: found.content_type,
      sha256: found.sha256,
    };
  }
}