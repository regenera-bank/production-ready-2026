import { Injectable } from '@nestjs/common';
import { randomBytes, randomUUID } from 'node:crypto';
import { timingSafeEqual } from 'node:crypto';

export type SandboxKeyRecord = {
  id: string;
  name: string;
  clientId: string;
  clientSecret: string;
  scopes: string[];
  createdAt: string;
};

function equal(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

@Injectable()
export class SandboxKeysService {
  private readonly keys = new Map<string, SandboxKeyRecord>();

  constructor() {
    const bootstrap: SandboxKeyRecord = {
      id: randomUUID(),
      name: 'Default Sandbox',
      clientId: 'sandbox-client-001',
      clientSecret: 'sandbox-secret-001',
      scopes: [
        'accounts:read',
        'balances:read',
        'transactions:read',
        'pix:read',
        'pix:write',
        'webhooks:read',
        'webhooks:write',
        'sandbox:admin',
      ],
      createdAt: new Date().toISOString(),
    };
    this.keys.set(bootstrap.clientId, bootstrap);
  }

  list() {
    return [...this.keys.values()].map(({ clientSecret: _secret, ...rest }) => rest);
  }

  create(input: { name: string; scopes: string[] }) {
    const record: SandboxKeyRecord = {
      id: randomUUID(),
      name: input.name,
      clientId: `sandbox-${randomBytes(6).toString('hex')}`,
      clientSecret: randomBytes(18).toString('base64url'),
      scopes: input.scopes,
      createdAt: new Date().toISOString(),
    };
    this.keys.set(record.clientId, record);
    return record;
  }

  validateCredentials(clientId: string, clientSecret: string): SandboxKeyRecord | null {
    const record = this.keys.get(clientId);
    if (!record || !equal(record.clientSecret, clientSecret)) {
      return null;
    }
    return record;
  }
}