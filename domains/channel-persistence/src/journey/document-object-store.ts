import { createHash, randomUUID } from 'crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';

export interface StoredObjectRef {
  readonly bucket: string;
  readonly key: string;
  readonly contentType: string;
  readonly sizeBytes: number;
  readonly sha256: string;
}

/**
 * Vault homolog — blob fora do PostgreSQL (§6).
 * Produção: substituir por GCS/S3 com KMS (EXTERNAL-BLOCKERS).
 */
export class DocumentObjectStore {
  constructor(private readonly root: string) {
    mkdirSync(root, { recursive: true });
  }

  static fromEnv(): DocumentObjectStore {
    const root =
      process.env.DOCUMENT_VAULT_PATH?.trim() ||
      join(process.cwd(), 'data', 'document-vault');
    return new DocumentObjectStore(root);
  }

  put(
    customerId: string,
    assetKind: string,
    content: Buffer,
    contentType: string,
  ): StoredObjectRef {
    const bucket = 'regenera-homolog-vault';
    const key = `${customerId}/${assetKind}/${randomUUID()}.bin`;
    const sha256 = createHash('sha256').update(content).digest('hex');
    const absolute = join(this.root, bucket, key);
    mkdirSync(dirname(absolute), { recursive: true });
    writeFileSync(absolute, content);
    return {
      bucket,
      key,
      contentType,
      sizeBytes: content.length,
      sha256,
    };
  }

  read(bucket: string, key: string): Buffer {
    return readFileSync(join(this.root, bucket, key));
  }
}