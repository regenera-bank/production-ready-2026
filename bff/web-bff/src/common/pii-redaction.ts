const CPF_DIGITS = /^\d{11}$/;

/** Mascara CPF completo — mantém apenas dígitos centrais parciais para correlação. */
export const maskCpf = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 11) {
    return '***';
  }
  return `***.${digits.substring(3, 6)}.***-${digits.slice(-2)}`;
};

/** userId no BFF homolog é o CPF normalizado; outros ids são truncados. */
export const maskUserId = (userId: string): string => {
  const digits = userId.replace(/\D/g, '');
  if (CPF_DIGITS.test(digits)) {
    return maskCpf(digits);
  }
  if (!userId) {
    return '***';
  }
  return `${userId.slice(0, 4)}…`;
};

const DATA_URI_BASE64 =
  /data:(?:image|application)\/[\w.+-]+;base64,[A-Za-z0-9+/=]+/gi;
const LONG_BASE64_CHUNK = /[A-Za-z0-9+/]{256,}={0,2}/g;

/** Remove imagens/base64 de mensagens de log antes de persistir ou imprimir. */
export const redactSensitiveLogPayload = (message: string): string =>
  message
    .replace(DATA_URI_BASE64, '[REDACTED_BINARY]')
    .replace(LONG_BASE64_CHUNK, '[REDACTED_BASE64]');