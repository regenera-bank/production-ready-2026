# Modelo Lógico de Persistência
## Tabela: idempotency_records
- pk: idempotency_key + client_id
- fingerprint: varchar
- status: enum
- response_body: jsonb
- expires_at: timestamp
## Tabela: audit_outbox
- event_id: uuid
- payload: jsonb
- status: enum (PENDING/SENT)
