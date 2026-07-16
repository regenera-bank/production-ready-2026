# mobile-bff

BFF compartilhado entre `apps/ios` e `apps/android`.

- `src/contracts/mobile-api.ts` — contrato Zod usado por ambos os canais
- `src/server.ts` — servidor Fastify (porta 8082)

Valores monetários: sempre `amountCents` como string inteira. Float é bloqueante.