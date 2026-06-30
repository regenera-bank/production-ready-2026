# Especificação - Idempotency
## 1. Escopo
- Operações financeiras transacionais POST/PUT.
## 2. Chave
- UUID fornecido pelo cliente + `client_id` autenticado.
## 3. Fingerprint
- Hash SHA-256 do payload e path omitindo timestamps dinâmicos.
## 5. Concorrência
- Row-level lock (FOR UPDATE) via DB.
