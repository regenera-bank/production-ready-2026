/**
 * Canonical JSON para X-Signature-V2 (Didit webhooks).
 * Ordem: shortenFloats → sortKeys → JSON.stringify (Unicode não escapado).
 */

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const shortenFloats = (value: unknown): unknown => {
  if (typeof value === 'number' && Number.isFinite(value) && value % 1 === 0) {
    return Math.trunc(value);
  }
  if (Array.isArray(value)) {
    return value.map(shortenFloats);
  }
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      out[key] = shortenFloats(child);
    }
    return out;
  }
  return value;
};

export const sortKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) {
      out[key] = sortKeys(value[key]);
    }
    return out;
  }
  return value;
};

export const canonicalJsonV2 = (body: unknown): string => {
  const normalized = sortKeys(shortenFloats(body));
  return JSON.stringify(normalized);
};

/** Alias usado pelo DiditWebhookVerifier (patch real-flow). */
export const diditCanonicalJson = canonicalJsonV2;