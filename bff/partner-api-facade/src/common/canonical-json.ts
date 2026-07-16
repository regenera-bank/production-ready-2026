export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(',')}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  return `{${entries.map(([key, val]) => `${JSON.stringify(key)}:${canonicalJson(val)}`).join(',')}}`;
}

export function payloadHash(payload: unknown): string {
  const { createHash } = require('node:crypto') as typeof import('node:crypto');
  return createHash('sha256').update(canonicalJson(payload)).digest('hex');
}