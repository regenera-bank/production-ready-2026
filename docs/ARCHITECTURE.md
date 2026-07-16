# Arquitetura — monorepo Regenera Bank

## Fronteiras

- **Canal / BFF** — intenção, sessão, projeção de UI.
- **Domínios (`domains/`, `05-core-banking/` com runtime)** — regras e persistência.
- **Ledger** — razão append-only; dinheiro em BIGINT minor units.
- **Integrações** — adaptadores externos; sem lógica de saldo no canal.

## Princípios

Idempotência, correlação, trilha de auditoria, timeout explícito, homolog ≠ produção.

Detalhes de domínio: README do pacote e ADRs locais quando existirem.
