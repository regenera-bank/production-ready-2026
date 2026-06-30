# REORG.md — regras de reorganização (executáveis)

Este arquivo é a fonte de verdade da estrutura. O `01-reorg.mjs` lê estas regras.
Humano lê para entender o porquê; o script lê para executar o quê.

---

## PRINCÍPIO

O miolo (`apps/banking-api`, `database`, `contracts`, …) já é forte. O problema é
a **borda**: o código bom estava preso numa pasta `regenera:` (dois-pontos —
ilegal no Windows/CI), afogado em binário de release, com migrations duplicadas e
uma `quarantine/` de arquivos mortos. A reorg **promove o miolo a raiz e queima a
borda**. Nada de valor é perdido — git history guarda o que sai.

---

## MOVIMENTOS

### M1 — promover a raiz
`regenera:/1.regenera-corebank/core-bank/`  →  raiz do repo (`regenera-corebank/`).
Morre o wrapper `regenera:`. Dois-pontos quebra ferramenta; fonte não convive com binário.

### M2 — deletar diretórios-fantasma (estavam vazios)
```
backend-core/  backend-api/  backend-database/  backend-services/
deploy-build/  deploy-dist/  deploy-release/  deploy-scripts/
```
Backend é `apps/banking-api`. Deploy é `infrastructure/` + `tooling/deployment/`.
Duas fontes de verdade = incidente futuro.

### M3 — tirar binário de release do VCS
```
app-android/Google Play.zip      app-ios/App Store.zip
app-desktop/Windows/*.msix*       app-desktop/Windows/*.appxbundle
app-web/vercel.zip                **/*.zip
```
São OUTPUT de build. Vão para `release/` (gitignored) localmente; de verdade vivem
no registry/loja. Não entram no repositório.

### M4 — dissolver quarentena e arquivo
```
quarantine/**   →  referenciado: volta ao path real do módulo; resto sai do repo
archive/**      →  sai da árvore ativa (vscode-legacy, wrappers legados)
```
Os nomes achatados `01-banking-core-engine__src__...__file.ts` recompõem o caminho:
`__` vira `/`, e o arquivo volta ao módulo de origem.

### M5 — colapsar SQL legado
```
database/legacy-migrations/{typeorm,flyway}/  +  infrastructure/sql-legacy/
   →  database/legacy-migrations/   (read-only, FORA do runner ativo)
```

---

## DEDUPLICAÇÃO (pares explícitos)

Migration não pode ter dois arquivos no mesmo ordinal — runner escolhe errado, vira
drift de schema. Mantém o canônico, descarta o resto:

| ordinal | mantém (canônico)                       | descarta                                      | motivo                          |
|--------:|------------------------------------------|-----------------------------------------------|---------------------------------|
| 0003    | `0003-auth-and-inbound.sql`              | `0003-authentication-and-inbound.sql`         | conteúdo idêntico               |
| 0004    | `0004-chart-of-accounts-seed.sql`        | `0004-chart-of-accounts-reference-data.sql`   | header quebrado (`## --`)       |

Regra geral: se dois arquivos têm o mesmo prefixo ordinal `NNNN-`, são candidatos a
dedupe. Idênticos → apaga um. Diferentes → o humano decide, não o script.

---

## REMOÇÃO POR PADRÃO

Apague em qualquer lugar:
```
**/.DS_Store   **/Thumbs.db   __MACOSX/**   **/*.log (em tracked)
```

---

## ÁRVORE CANÔNICA (alvo)

```
regenera-corebank/
├── apps/
│   ├── banking-api/        # NestJS modular monolith (DDD bounded contexts)
│   │   └── src/{bootstrap,shared-kernel,platform,modules}/
│   ├── customer-web/  customer-mobile/  operations-console/
│   └── workers/{outbox-publisher,reconciliation,webhook-delivery,analytical-export}-worker/
├── contracts/{http-api,domain-events,webhooks,generated-clients}/
├── database/
│   ├── migrations/{sql,runners}/         # uma migration por ordinal
│   ├── {schema,functions,triggers,constraints,verification,reference-data}/
│   └── legacy-migrations/                # histórico, read-only
├── infrastructure/{gcp,kubernetes,argocd,observability,environments,local,security}/
├── governance/{compliance,runbooks,security,architecture,release-readiness,evidence}/
├── tooling/{database,security,audit,deployment,migration,validation,agents}/
├── tests/{financial-integrity,concurrency,resilience,security,contract,integration,e2e}/
├── .github/workflows/
├── package.json  tsconfig.base.json  .gitignore  LICENSE
├── dist/        # gitignored
└── release/     # gitignored — ponteiro p/ loja/registry, não binário versionado
```
