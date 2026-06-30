# Especificação - Audit Trail
## 1. Responsabilidade
- Registrar ações materiais imutáveis.
- Não substitui log técnico.
## 2. Envelope Mínimo
- `event_id`, `occurred_at`, `actor`, `action`, `outcome`, `reason_code`.
## 5. Persistência
- Proposta: Tabela append-only PostgreSQL temporária -> Sink externo. Necessita decisão de banco.
## 6. Comportamento em Falha
- Transações financeiras usarão Outbox. Falha de audit de segurança derruba requisição.
