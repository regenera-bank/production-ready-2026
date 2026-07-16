// Cadeia de Auditoria — cada evento carrega o hash do anterior.
// Quebrar um elo invalida todos os posteriores; adulteração não passa em verify().

export const AUDIT_GENESIS_HASH =
  '0000000000000000000000000000000000000000000000000000000000000000';

export interface AuditEventRecord {
  id: number;
  eventType: string;
  payload: Record<string, unknown>;
  previousHash: string;
  eventHash: string;
  correlationId: string | null;
  createdAt: string;
}

export interface AppendAuditEventInput {
  eventType: string;
  payload: Record<string, unknown>;
  correlationId?: string | null;
}