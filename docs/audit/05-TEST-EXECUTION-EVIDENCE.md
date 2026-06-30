# 05 — Evidência de Execução de Testes

**HEAD:** N/A (workspace sem git)  
**Timestamp:** 2026-06-30 UTC

## Matriz

| Pacote | Comando | Exit | Pass | Fail | Skip | Log |
|--------|---------|------|------|------|------|-----|
| domains/core-bank | `npm test` | 0 | 184 | 0 | 1 | `artifacts/verification/unit/core-bank-test.log` |
| domains/core-bank | `npm run gate:release` | 0 | — | — | — | (subagente A02) |
| bff/web-bff | `npm test` | 0 | 21 | 0 | 0 | `artifacts/verification/unit/bff-web-bff-test.log` |
| bff/web-bff | `npm run build` | 0 | — | — | — | `artifacts/verification/build/bff-web-bff-build.log` |
| bff/web-bff | `npm run lint` | 0 | — | — | — | `artifacts/verification/lint/bff-web-bff-lint.log` |
| apps/web-banking | `npm run build` | 0 | — | — | — | `artifacts/verification/build/web-banking-build.log` |

## BFF — suites (pós-correção)

```
Test Suites: 5 passed, 5 total
Tests:       23 passed, 23 total
```

Inclui novos testes de password-reset em `auth.service.spec.ts`.

## Core-bank

```
Test Suites: 19 passed, 19 total
Tests:       184 passed, 1 skipped, 185 total
```

## Web-banking build — PASS (G8)

```
> tsc --noEmit && vite build
✓ built in ~1s
WEB_BUILD_EXIT:0
```

Correções: `@simplewebauthn/types`, narrowing em `App.tsx`, imports não usados removidos.

## Não executado

| Gate | Motivo |
|------|--------|
| E2E Playwright/Cypress | Não configurado no canal web |
| Contract tests cross-repo | Sem pact/baseline |
| Integração Postgres real | Core-bank in-memory |
| Homologação Vision/DataValid real | Depende GCP + credenciais externas |