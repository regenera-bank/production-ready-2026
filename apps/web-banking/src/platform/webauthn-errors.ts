export const mapWebAuthnError = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return 'Falha na leitura biométrica — tente com senha.';
  }
  const name = error.name;
  const msg = error.message.toLowerCase();
  if (name === 'NotAllowedError' || msg.includes('not allowed')) {
    return 'Biometria cancelada ou negada — use CPF e senha.';
  }
  if (name === 'SecurityError' || msg.includes('origin')) {
    return 'Origem não permitida — abra http://localhost:5176 (não 127.0.0.1).';
  }
  if (name === 'InvalidStateError') {
    return 'Digital já cadastrada neste dispositivo — tente Entrar com Touch ID.';
  }
  if (msg.includes('expirado') || msg.includes('expired')) {
    return 'Sessão biométrica expirou — toque novamente.';
  }
  if (msg.includes('não validou') || msg.includes('not valid')) {
    return 'Digital não reconhecida — entre com senha e cadastre de novo.';
  }
  return error.message;
};