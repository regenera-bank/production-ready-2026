# Evidências de validação — Vercel

## Base

- ZIP original SHA-256: `d5f4d342fc14e6db837972bb7e7d327677fad85bb84f5351336f2e0bda3e5f3a`;
- extração CRC: executada antes da revisão;
- quantidade inicial de arquivos: 120.

## Limite

Resultados de build, teste, assinatura e ferramentas específicas de plataforma são registrados após a execução. Etapa não executada não será convertida em “OK”.
## Resultados executados

- checksums internos: PASS;
- JSON e Shell: PASS;
- segredos `.env`: removidos;
- `npm ci`: FAIL por lockfile divergente;
- tentativa de regeneração: bloqueada por indisponibilidade do registro npm;
- lockfile inválido removido; build permanece bloqueado.

