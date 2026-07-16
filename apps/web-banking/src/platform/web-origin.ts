/** WebAuthn exige hostname estável — 127.0.0.1 quebra com rpID localhost no BFF. */
export const webAuthnOriginWarning = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  if (!window.isSecureContext) {
    return 'Biometria web exige HTTPS ou localhost seguro.';
  }
  if (window.location.hostname === '127.0.0.1') {
    return 'Use http://localhost:5176 — 127.0.0.1 não funciona com Touch ID/WebAuthn.';
  }
  return null;
};

export const preferredWebEntryUrl = (): string => {
  if (typeof window === 'undefined') {
    return 'http://localhost:5176';
  }
  const port = window.location.port || '5176';
  return `http://localhost:${port}${window.location.pathname}${window.location.search}`;
};