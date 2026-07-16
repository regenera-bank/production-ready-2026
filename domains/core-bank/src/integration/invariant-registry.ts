export const CORE_BANKING_INVARIANT_COUNT = 47 as const;

export interface InvariantDefinition {
  id: string;
  group: string;
  description: string;
}

export const CORE_BANKING_INVARIANTS: readonly InvariantDefinition[] = [
  { id: 'T01', group: 'MONEY', description: 'float é recusado na entrada' },
  { id: 'T02', group: 'MONEY', description: 'overflow de BigInt é detectado' },
  { id: 'T03', group: 'MONEY', description: 'moedas diferentes não somam' },
  { id: 'T04', group: 'MONEY', description: 'percentageBps é determinístico' },
  { id: 'T05', group: 'MONEY', description: 'allocate não cria nem destrói centavo' },
  { id: 'T06', group: 'ERRORS', description: 'ValidationException tipada com domain' },
  { id: 'T07', group: 'ERRORS', description: 'ConflictException retorna 409' },
  { id: 'T08', group: 'ERRORS', description: 'StateTransitionException retorna 422' },
  { id: 'T09', group: 'ACCOUNTS', description: 'open cria conta OPEN em BRL' },
  { id: 'T10', group: 'ACCOUNTS', description: 'CLOSED é terminal' },
  { id: 'T11', group: 'ACCOUNTS', description: 'referência externa duplicada → Conflict' },
  { id: 'T12', group: 'SQL', description: 'V001 proíbe mutação append-only' },
  { id: 'T13', group: 'SQL', description: 'V001 valida D=C ao postar' },
  { id: 'T14', group: 'SQL', description: 'V002 view saldo assinado' },
  { id: 'T15', group: 'SQL', description: 'V002 view saldo disponível' },
  { id: 'T16', group: 'Audit', description: 'cadeia íntegra passa verify()' },
  { id: 'T17', group: 'Audit', description: 'adulteração detectada por verify()' },
  { id: 'T18', group: 'OUTBOX', description: 'append com publishedAt null' },
  { id: 'T19', group: 'OUTBOX', description: 'markPublished idempotente' },
  { id: 'T20', group: 'IDEMPOTENCY', description: 'COMPLETED → Replay' },
  { id: 'T21', group: 'IDEMPOTENCY', description: 'UNKNOWN → Blocked' },
  { id: 'T22', group: 'IDEMPOTENCY', description: 'FAILED_RETRYABLE → Acquired' },
  { id: 'T23', group: 'IDEMPOTENCY', description: 'payload drift → Conflict' },
  { id: 'T24', group: 'HOLDS', description: 'hold reduz saldo disponível' },
  { id: 'T25', group: 'HOLDS', description: 'hold acima do disponível → Conflict' },
  { id: 'T26', group: 'HOLDS', description: 'hold expirado para de reservar' },
  { id: 'T27', group: 'HOLDS', description: 'hold liberado restaura disponível' },
  { id: 'T28', group: 'LEDGER', description: 'débitos ≠ créditos → ValidationException' },
  { id: 'T29', group: 'LEDGER', description: 'moedas misturadas → ValidationException' },
  { id: 'T30', group: 'LEDGER', description: 'linha zero → ValidationException' },
  { id: 'T31', group: 'LEDGER', description: 'idempotencyKey igual → replay' },
  { id: 'T32', group: 'LEDGER', description: 'idempotencyKey drift → Conflict' },
  { id: 'T33', group: 'LEDGER', description: 'verifyEntryHash estável' },
  { id: 'T34', group: 'LEDGER', description: 'reverse espelha sem editar original' },
  { id: 'T35', group: 'LEDGER', description: 'segunda reversão → Conflict' },
  { id: 'T36', group: 'LEDGER', description: 'reversão de reversão → StateTransition' },
  { id: 'T37', group: 'PAYMENTS', description: 'fundos insuficientes → Conflict' },
  { id: 'T38', group: 'PAYMENTS', description: 'UNKNOWN bloqueia retry' },
  { id: 'T39', group: 'PAYMENTS', description: 'reconciliação SETTLED debita' },
  { id: 'T40', group: 'PAYMENTS', description: 'reconciliação REJECTED restaura' },
  { id: 'T41', group: 'PAYMENTS', description: '16 threads mesma chave → 1 efeito' },
  { id: 'T42', group: 'PAYMENTS', description: 'ASSET clearing → ValidationException' },
  { id: 'T43', group: 'PIX', description: 'EndToEndId formato BACEN' },
  { id: 'T44', group: 'PIX', description: 'HMAC da chave determinístico' },
  { id: 'T45', group: 'PAYMENTS', description: 'falha infra → idempotência FAILED_FINAL' },
  { id: 'T46', group: 'RECONCILIATION', description: 'maker-checker obrigatório' },
  { id: 'T47', group: 'MODULE', description: 'CoreBankModule compõe domínio' },
] as const;

if (CORE_BANKING_INVARIANTS.length !== CORE_BANKING_INVARIANT_COUNT) {
  throw new Error(
    `Registry desalinhado: esperado ${CORE_BANKING_INVARIANT_COUNT}, obtido ${CORE_BANKING_INVARIANTS.length}`,
  );
}