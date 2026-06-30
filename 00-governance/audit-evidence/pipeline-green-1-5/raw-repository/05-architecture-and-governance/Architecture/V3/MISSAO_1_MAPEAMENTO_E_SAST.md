# AUDITORIA ESTÁTICA PROFUNDA — REGENERABANK

Auditoria automatizada sobre Parte 1, Parte 2 em 7 pacotes e ZIP GitHub com pipeline verde.

## Inventário por pacote

| Pacote | entradas zip | arquivos fonte/config analisáveis | node_modules | __MACOSX |
|---|---:|---:|---:|---:|
| PARTE_1_HOMOLOGADA | 242 | 95 | 0 | 121 |
| PARTE_2_BACKEND | 49116 | 157 | 42805 | 655 |
| PARTE_2_MOBILE | 109214 | 52 | 100865 | 54579 |
| PARTE_2_FRONTEND | 115066 | 181 | 106428 | 57495 |
| PARTE_2_INFRA | 23 | 8 | 0 | 11 |
| PARTE_2_DOCS | 53 | 23 | 0 | 24 |
| PARTE_2_SOLTOS | 20 | 8 | 0 | 10 |
| PARTE_2_ARQUIVO_5 | 855 | 3 | 0 | 362 |
| GITHUB_PIPELINE_VERDE | 1194 | 417 | 0 | 597 |

## Achados por severidade

- CRITICO: 36
- ALTO: 392
- MEDIO: 49
- BAIXO: 564

## Top 200 achados

### [CRITICO] JWT_OR_SECRET_LITERAL
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/.github/workflows/ci.yml`
- linha: `21`
- achado: possível segredo/credencial em texto claro
- amostra: `      JWT_NEURAL_SECRET: "***REDACTED***"`

### [CRITICO] PROMETEO_KEY_HINT
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/.github/workflows/ci.yml`
- linha: `22`
- achado: possível segredo/credencial em texto claro
- amostra: `      PROMETEO_API_KEY: "***REDACTED***"`

### [CRITICO] DATABASE_URL_WITH_PASSWORD
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/.github/workflows/ci.yml`
- linha: `90`
- achado: possível segredo/credencial em texto claro
- amostra: `          DATABASE_URL: postgres://***REDACTED***`

### [CRITICO] PROMETEO_KEY_HINT
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/DEPLOY_BACKEND.sh`
- linha: `38`
- achado: possível segredo/credencial em texto claro
- amostra: `#   gcloud secrets create PROMETEO_API_KEY --data-file=<(echo -n 'YOUR_REAL_KEY') --project=project-93b8df04-72ab-4e44-8a6`

### [CRITICO] PROMETEO_KEY_HINT
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/DEPLOY_BACKEND.sh`
- linha: `46`
- achado: possível segredo/credencial em texto claro
- amostra: `grep -qF "PROMETEO_API_KEY" .env 2>/dev/null || echo "PROMETEO_API_KEY=PLACEHOLDER_FROM_SM_OR_VAULT" >> .env`

### [CRITICO] JWT_OR_SECRET_LITERAL
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/FIX_AND_DEPLOY.sh`
- linha: `40`
- achado: possível segredo/credencial em texto claro
- amostra: `  --set-secrets="***REDACTED***" \`

### [CRITICO] DATABASE_URL_WITH_PASSWORD
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/scripts/run-neon-init.js`
- linha: `27`
- achado: possível segredo/credencial em texto claro
- amostra: `const connectionString = process.env.DATABASE_URL || 'postgres://***REDACTED***';`

### [CRITICO] JWT_OR_SECRET_LITERAL
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/src/auth/auth.service.ts`
- linha: `322`
- achado: possível segredo/credencial em texto claro
- amostra: `    return { token: '***REDACTED***' };`

### [CRITICO] JWT_OR_SECRET_LITERAL
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/src/auth/auth.service.ts`
- linha: `341`
- achado: possível segredo/credencial em texto claro
- amostra: `    return { token: '***REDACTED***' };`

### [CRITICO] JWT_OR_SECRET_LITERAL
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/test/e2e/bank-ledger.e2e-spec.ts`
- linha: `127`
- achado: possível segredo/credencial em texto claro
- amostra: `        idToken: '***REDACTED***',`

### [CRITICO] GOOGLE_API_KEY
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/02-customer-mobile-experience/src/services/firebase.ts`
- linha: `39`
- achado: possível segredo/credencial em texto claro
- amostra: `  apiKey: "AIza***REDACTED***",`

### [CRITICO] JWT_OR_SECRET_LITERAL
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/infra/gcp-cloud-run/deploy-backend.sh`
- linha: `75`
- achado: possível segredo/credencial em texto claro
- amostra: `    --set-secrets="***REDACTED***" \`

### [CRITICO] GOOGLE_API_KEY
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/core/firebase.ts`
- linha: `34`
- achado: possível segredo/credencial em texto claro
- amostra: `  apiKey: "AIza***REDACTED***",`

### [CRITICO] DATABASE_URL_WITH_PASSWORD
- pacote: `PARTE_1_HOMOLOGADA`
- arquivo: `PARTE 1 OK RegeneraBank_ultima_milha_operacao_real (2) 2/.github/workflows/ci.yml`
- linha: `19`
- achado: possível segredo/credencial em texto claro
- amostra: `  TEST_DATABASE_URL: postgres://***REDACTED***`

### [CRITICO] JWT_OR_SECRET_LITERAL
- pacote: `PARTE_1_HOMOLOGADA`
- arquivo: `PARTE 1 OK RegeneraBank_ultima_milha_operacao_real (2) 2/App.tsx`
- linha: `44`
- achado: possível segredo/credencial em texto claro
- amostra: `const DEVICE_SECRET_KEY = '***REDACTED***';`

### [CRITICO] JWT_OR_SECRET_LITERAL
- pacote: `PARTE_1_HOMOLOGADA`
- arquivo: `PARTE 1 OK RegeneraBank_ultima_milha_operacao_real (2) 2/src/auth/session-auth.guard.ts`
- linha: `26`
- achado: possível segredo/credencial em texto claro
- amostra: `const REQUIRE_SESSION_KEY = 'require_session';`

### [CRITICO] JWT_OR_SECRET_LITERAL
- pacote: `PARTE_1_HOMOLOGADA`
- arquivo: `PARTE 1 OK RegeneraBank_ultima_milha_operacao_real (2) 2/src/auth/session.service.ts`
- linha: `25`
- achado: possível segredo/credencial em texto claro
- amostra: `export const SESSION_CONFIG_TOKEN = '***REDACTED***';`

### [CRITICO] PROMETEO_KEY_HINT
- pacote: `PARTE_1_HOMOLOGADA`
- arquivo: `PARTE 1 OK RegeneraBank_ultima_milha_operacao_real (2) 2/src/config/env.schema.ts`
- linha: `58`
- achado: possível segredo/credencial em texto claro
- amostra: `    PROMETEO_API_KEY_REF: nonEmptySecret('PROMETEO_API_KEY_REF'),`

### [CRITICO] JWT_OR_SECRET_LITERAL
- pacote: `PARTE_1_HOMOLOGADA`
- arquivo: `PARTE 1 OK RegeneraBank_ultima_milha_operacao_real (2) 2/test/http-raw-body.integration.test.ts`
- linha: `19`
- achado: possível segredo/credencial em texto claro
- amostra: `    signingSecret: '***REDACTED***',`

### [CRITICO] JWT_OR_SECRET_LITERAL
- pacote: `PARTE_1_HOMOLOGADA`
- arquivo: `PARTE 1 OK RegeneraBank_ultima_milha_operacao_real (2) 2/test/http-raw-body.integration.test.ts`
- linha: `52`
- achado: possível segredo/credencial em texto claro
- amostra: `    signingSecret: '***REDACTED***',`

### [CRITICO] JWT_OR_SECRET_LITERAL
- pacote: `PARTE_1_HOMOLOGADA`
- arquivo: `PARTE 1 OK RegeneraBank_ultima_milha_operacao_real (2) 2/test/session.service.test.ts`
- linha: `8`
- achado: possível segredo/credencial em texto claro
- amostra: `const sessionId = '44444444-4444-4444-8444-444444444444';`

### [CRITICO] DATABASE_URL_WITH_PASSWORD
- pacote: `PARTE_2_ARQUIVO_5`
- arquivo: `README.md`
- linha: `69`
- achado: possível segredo/credencial em texto claro
- amostra: `DATABASE_URL=postgres://***REDACTED***`

### [CRITICO] GOOGLE_API_KEY
- pacote: `PARTE_2_BACKEND`
- arquivo: `1. Backend/.env`
- linha: `2`
- achado: possível segredo/credencial em texto claro
- amostra: `GEMINI_API_KEY=AIza***REDACTED***`

### [CRITICO] GOOGLE_API_KEY
- pacote: `PARTE_2_BACKEND`
- arquivo: `1. Backend/.env`
- linha: `3`
- achado: possível segredo/credencial em texto claro
- amostra: `FIREBASE_API_KEY=AIza***REDACTED***`

### [CRITICO] DATABASE_URL_WITH_PASSWORD
- pacote: `PARTE_2_BACKEND`
- arquivo: `1. Backend/.env`
- linha: `4`
- achado: possível segredo/credencial em texto claro
- amostra: `DATABASE_URL=postgres://***REDACTED***`

### [CRITICO] PROMETEO_KEY_HINT
- pacote: `PARTE_2_BACKEND`
- arquivo: `1. Backend/DEPLOY_BACKEND.sh`
- linha: `38`
- achado: possível segredo/credencial em texto claro
- amostra: `#   gcloud secrets create PROMETEO_API_KEY --data-file=<(echo -n 'YOUR_REAL_KEY') --project=project-93b8df04-72ab-4e44-8a6`

### [CRITICO] PROMETEO_KEY_HINT
- pacote: `PARTE_2_BACKEND`
- arquivo: `1. Backend/DEPLOY_BACKEND.sh`
- linha: `46`
- achado: possível segredo/credencial em texto claro
- amostra: `grep -qF "PROMETEO_API_KEY" .env 2>/dev/null || echo "PROMETEO_API_KEY=PLACEHOLDER_FROM_SM_OR_VAULT" >> .env`

### [CRITICO] JWT_OR_SECRET_LITERAL
- pacote: `PARTE_2_BACKEND`
- arquivo: `1. Backend/FIX_AND_DEPLOY.sh`
- linha: `40`
- achado: possível segredo/credencial em texto claro
- amostra: `  --set-secrets="***REDACTED***" \`

### [CRITICO] DATABASE_URL_WITH_PASSWORD
- pacote: `PARTE_2_BACKEND`
- arquivo: `1. Backend/scripts/run-neon-init.js`
- linha: `27`
- achado: possível segredo/credencial em texto claro
- amostra: `const connectionString = process.env.DATABASE_URL || 'postgres://***REDACTED***';`

### [CRITICO] JWT_OR_SECRET_LITERAL
- pacote: `PARTE_2_BACKEND`
- arquivo: `1. Backend/src/auth/auth.service.ts`
- linha: `322`
- achado: possível segredo/credencial em texto claro
- amostra: `    return { token: '***REDACTED***' };`

### [CRITICO] JWT_OR_SECRET_LITERAL
- pacote: `PARTE_2_BACKEND`
- arquivo: `1. Backend/src/auth/auth.service.ts`
- linha: `341`
- achado: possível segredo/credencial em texto claro
- amostra: `    return { token: '***REDACTED***' };`

### [CRITICO] JWT_OR_SECRET_LITERAL
- pacote: `PARTE_2_BACKEND`
- arquivo: `1. Backend/test/e2e/bank-ledger.e2e-spec.ts`
- linha: `127`
- achado: possível segredo/credencial em texto claro
- amostra: `        idToken: '***REDACTED***',`

### [CRITICO] JWT_OR_SECRET_LITERAL
- pacote: `PARTE_2_FRONTEND`
- arquivo: `3. FrontEnd/.env.local`
- linha: `2`
- achado: possível segredo/credencial em texto claro
- amostra: `VERCEL_OIDC_TOKEN="***REDACTED***"`

### [CRITICO] JWT_OR_SECRET_LITERAL
- pacote: `PARTE_2_FRONTEND`
- arquivo: `3. FrontEnd/infra/gcp-cloud-run/deploy-backend.sh`
- linha: `75`
- achado: possível segredo/credencial em texto claro
- amostra: `    --set-secrets="***REDACTED***" \`

### [CRITICO] GOOGLE_API_KEY
- pacote: `PARTE_2_FRONTEND`
- arquivo: `3. FrontEnd/src/core/firebase.ts`
- linha: `34`
- achado: possível segredo/credencial em texto claro
- amostra: `  apiKey: "AIza***REDACTED***",`

### [CRITICO] GOOGLE_API_KEY
- pacote: `PARTE_2_MOBILE`
- arquivo: `2. Mobile/src/services/firebase.ts`
- linha: `39`
- achado: possível segredo/credencial em texto claro
- amostra: `  apiKey: "AIza***REDACTED***",`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/.github/workflows/ci.yml`
- linha: `21`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `      JWT_NEURAL_SECRET: "***REDACTED***"`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/.github/workflows/ci.yml`
- linha: `22`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `      PROMETEO_API_KEY: "***REDACTED***"`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/.github/workflows/ci.yml`
- linha: `23`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `      GEMINI_API_KEY: "***REDACTED***"`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/.github/workflows/ci.yml`
- linha: `24`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `      FIREBASE_PROJECT_ID: "ci-mock-project"`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/.github/workflows/ci.yml`
- linha: `25`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `      FIREBASE_API_KEY: "***REDACTED***"`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/.github/workflows/ci.yml`
- linha: `26`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `      GCP_PROJECT_ID: "ci-mock-project"`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/package-lock.json`
- linha: `2455`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `        "@jest/fake-timers": "^29.7.0",`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/package-lock.json`
- linha: `2458`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `        "jest-mock": "^29.7.0"`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/package-lock.json`
- linha: `2491`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `    "node_modules/@jest/fake-timers": {`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/package-lock.json`
- linha: `2493`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `      "resolved": "https://registry.npmjs.org/@jest/fake-timers/-/fake-timers-29.7.0.tgz",`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/package-lock.json`
- linha: `2499`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `        "@sinonjs/fake-timers": "^10.0.2",`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/package-lock.json`
- linha: `2502`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `        "jest-mock": "^29.7.0",`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/package-lock.json`
- linha: `2529`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `        "jest-mock": "^29.7.0"`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/package-lock.json`
- linha: `3586`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `    "node_modules/@sinonjs/fake-timers": {`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/package-lock.json`
- linha: `3588`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `      "resolved": "https://registry.npmjs.org/@sinonjs/fake-timers/-/fake-timers-10.3.0.tgz",`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/package-lock.json`
- linha: `3943`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `        "jest-mock": "30.4.1",`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/package-lock.json`
- linha: `4004`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `    "node_modules/@types/jest/node_modules/jest-mock": {`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/package-lock.json`
- linha: `4006`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `      "resolved": "https://registry.npmjs.org/jest-mock/-/jest-mock-30.4.1.tgz",`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/package-lock.json`
- linha: `9557`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `        "@jest/fake-timers": "^29.7.0",`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/package-lock.json`
- linha: `9560`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `        "jest-mock": "^29.7.0",`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/package-lock.json`
- linha: `9654`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `    "node_modules/jest-mock": {`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/package-lock.json`
- linha: `9656`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `      "resolved": "https://registry.npmjs.org/jest-mock/-/jest-mock-29.7.0.tgz",`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/package-lock.json`
- linha: `9773`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `        "@jest/fake-timers": "^29.7.0",`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/package-lock.json`
- linha: `9787`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `        "jest-mock": "^29.7.0",`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/src/auth/auth.service.ts`
- linha: `322`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `    return { token: '***REDACTED***' };`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/src/auth/auth.service.ts`
- linha: `326`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `    return { id: userId, email: 'mock@example.com' };`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/src/auth/auth.service.ts`
- linha: `341`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `    return { token: '***REDACTED***' };`

### [ALTO] jwt_route_without_guard
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/src/compliance/compliance.controller.ts`
- achado: Controller Nest com 1 rota(s) sem @UseGuards aparente

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/src/compliance/compliance.module.ts`
- linha: `52`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `import { MockPepProvider } from './providers/mock-pep.provider';`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/src/compliance/compliance.service.spec.ts`
- linha: `52`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `      // Regra de Mock: CPF terminado em 13 simboliza lista restritiva/PEP`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/src/compliance/security.controller.ts`
- linha: `61`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `   * No fake alert only - motor real.`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/src/core/pix.service.spec.ts`
- linha: `12`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `jest.mock('@google-cloud/pubsub', () => ({`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/src/core/pix.service.ts`
- linha: `192`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `        amount: amount * 100, // mock no test usa * 100`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/src/core/pix.service.ts`
- linha: `226`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `    return { id: 'mock-key-id', type, value };`

### [ALTO] jwt_route_without_guard
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/src/events/webhooks/webhook.controller.ts`
- achado: Controller Nest com 1 rota(s) sem @UseGuards aparente

### [ALTO] jwt_route_without_guard
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/src/health.controller.ts`
- achado: Controller Nest com 1 rota(s) sem @UseGuards aparente

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/src/investments/investments.service.ts`
- linha: `145`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `    // Preços D1 para B3 (Mock seguro)`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/src/investments/investments.service.ts`
- linha: `172`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `    // Basic mock implementation to satisfy build`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/src/investments/open-finance.service.ts`
- linha: `119`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `        logoCode: acc.currency, // Using currency as logo placeholder for raw data`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/src/investments/trading.gateway.ts`
- linha: `67`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `    // Real prices via public API (CoinGecko) - no fake. Expand to Pub/Sub worker for B3/Crypto feeds per MANIFESTE.`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/src/investments/trading.gateway.ts`
- linha: `75`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `        // For demo, push BTC/ETH real; for stocks like PETR4 frontend can use other.`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/src/investments/trading.gateway.ts`
- linha: `84`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `    }, 5000); // real rate, not fake random`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/src/lifestyle/lifestyle.service.spec.ts`
- linha: `33`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `jest.mock('@google-cloud/pubsub', () => {`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/src/lifestyle/lifestyle.service.spec.ts`
- linha: `9`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `jest.mock('firebase-admin', () => {`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/src/lifestyle/lifestyle.service.ts`
- linha: `180`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `    const amountCents = 1500; // Mock amount`

### [ALTO] jwt_route_without_guard
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/src/metrics/metrics.controller.ts`
- achado: Controller Nest com 1 rota(s) sem @UseGuards aparente

### [ALTO] jwt_route_without_guard
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/src/neural-core/neural-core.controller.ts`
- achado: Controller Nest com 4 rota(s) sem @UseGuards aparente

### [ALTO] markdown_fence_in_code
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/src/neural-core/neural-core.service.ts`
- achado: bloco markdown dentro de arquivo executável/config

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/src/neural-core/neural-core.service.ts`
- linha: `240`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `      // Validate to prevent leaking bad/fake data to UI (e.g. false rentability promises)`

### [ALTO] markdown_fence_in_code
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/src/neural/neural.service.ts`
- achado: bloco markdown dentro de arquivo executável/config

### [ALTO] jwt_route_without_guard
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/src/open-finance/open-finance.controller.ts`
- achado: Controller Nest com 8 rota(s) sem @UseGuards aparente

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/src/open-finance/open-finance.service.ts`
- linha: `167`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `    return { token: '***REDACTED***' };`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/src/open-finance/open-finance.service.ts`
- linha: `196`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `    return { link: 'https://pay.regenerabank.app/mock' };`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/src/open-finance/open-finance.service.ts`
- linha: `58`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `   * Camada MTLS Mock: Em produção, todas as chamadas Open Finance exigem certificado x509 cliente.`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/src/reconciliation/reconciliation.service.ts`
- linha: `103`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `      // Mock logic: check if investments match ledger`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/test/e2e/bank-ledger.e2e-spec.ts`
- linha: `123`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `    // Mock fetch for server-side IdentityToolkit validation in login`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/test/e2e/bank-ledger.e2e-spec.ts`
- linha: `127`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `        idToken: '***REDACTED***',`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/test/e2e/bank-ledger.e2e-spec.ts`
- linha: `13`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `jest.mock('@google-cloud/secret-manager', () => ({`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/test/e2e/bank-ledger.e2e-spec.ts`
- linha: `23`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `jest.mock('@google-cloud/vertexai', () => ({`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/test/e2e/bank-ledger.e2e-spec.ts`
- linha: `33`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `jest.mock('@google-cloud/pubsub', () => ({`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/test/e2e/bank-ledger.e2e-spec.ts`
- linha: `47`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `jest.mock('firebase-admin', () => {`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/test/e2e/bank-ledger.e2e-spec.ts`
- linha: `58`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `      if (t === 'mock-id-token') {`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/test/e2e/bank-ledger.e2e-spec.ts`
- linha: `96`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `jest.mock('@google-cloud/vision', () => ({`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/test/ledger-invariants.spec.ts`
- linha: `11`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `jest.mock('@google-cloud/secret-manager', () => ({`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/test/ledger-invariants.spec.ts`
- linha: `21`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `jest.mock('@google-cloud/vertexai', () => ({`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/test/ledger-invariants.spec.ts`
- linha: `31`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `jest.mock('@google-cloud/pubsub', () => ({`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/test/ledger-invariants.spec.ts`
- linha: `45`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `jest.mock('firebase-admin', () => {`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/test/security/security-auth.spec.ts`
- linha: `30`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `jest.mock('@google-cloud/secret-manager', () => ({`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/test/security/security-auth.spec.ts`
- linha: `40`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `jest.mock('@google-cloud/vertexai', () => ({`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/test/security/security-auth.spec.ts`
- linha: `50`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `jest.mock('@google-cloud/pubsub', () => ({`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/test/setup.ts`
- linha: `1`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `jest.mock('@google-cloud/vertexai', () => {`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/01-banking-core-engine/test/setup.ts`
- linha: `9`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `jest.mock('@google-cloud/text-to-speech', () => {`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/02-customer-mobile-experience/src/__tests__/AppRouter.test.tsx`
- linha: `16`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `jest.mock('../screens/HomeScreen', () => {`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/02-customer-mobile-experience/src/__tests__/AppRouter.test.tsx`
- linha: `6`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `// Mock das telas principais para evitar renderização pesada e chamadas nativas`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/02-customer-mobile-experience/src/__tests__/AppRouter.test.tsx`
- linha: `7`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `jest.mock('../screens/LoginScreen', () => {`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/02-customer-mobile-experience/src/features/banking/hooks/useHomeLogic.ts`
- linha: `44`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `    : 247832.90; // Default Mock`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/02-customer-mobile-experience/src/features/banking/ui/NotificationsScreen.tsx`
- linha: `29`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `const MOCK: Notif[] = [`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/02-customer-mobile-experience/src/features/banking/ui/NotificationsScreen.tsx`
- linha: `47`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `  const [items, setItems] = useState(MOCK);`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/02-customer-mobile-experience/src/features/identity/ui/KycScreen.tsx`
- linha: `102`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `            placeholder="000.000.000-00"`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/02-customer-mobile-experience/src/features/openbanking/ui/OpenFinanceScreen.tsx`
- linha: `243`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `          placeholder="Usuário ou CPF"`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/02-customer-mobile-experience/src/features/openbanking/ui/OpenFinanceScreen.tsx`
- linha: `254`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `          placeholder="Senha"`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/02-customer-mobile-experience/src/features/payment-links/ui/PaymentLinksScreen.tsx`
- linha: `119`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `                  placeholder="0,00"`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/02-customer-mobile-experience/src/features/payment-links/ui/PaymentLinksScreen.tsx`
- linha: `130`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `                  placeholder="Ex: Consultoria Financeira"`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/02-customer-mobile-experience/src/features/transfer/ui/TransferScreen.tsx`
- linha: `213`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `              placeholder="Código do Banco (Ex: 341)" `

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/02-customer-mobile-experience/src/features/transfer/ui/TransferScreen.tsx`
- linha: `225`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `                placeholder="Agência" `

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/02-customer-mobile-experience/src/features/transfer/ui/TransferScreen.tsx`
- linha: `235`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `                placeholder="Conta" `

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/02-customer-mobile-experience/src/features/transfer/ui/TransferScreen.tsx`
- linha: `248`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `              placeholder="0,00" `

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/02-customer-mobile-experience/src/features/transfer/ui/TransferScreen.tsx`
- linha: `90`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `      const fakeLivenessFrame = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIy`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/02-customer-mobile-experience/src/screens/ExtratoScreen.tsx`
- linha: `96`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `          placeholder="Buscar transação..."`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/02-customer-mobile-experience/src/screens/KidsScreen.tsx`
- linha: `200`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `              placeholder="O que é poupança? Como funciona o PIX?..."`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/02-customer-mobile-experience/src/screens/NeuralCoreScreen.tsx`
- linha: `158`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `            placeholder="Pergunte à Raphaela..."`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/02-customer-mobile-experience/src/screens/PixScreen.tsx`
- linha: `77`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `          <TextInput style={s.input} value={pixKey} onChangeText={setPixKey} placeholder="CPF, e-mail, telefone ou chave aleatória" placeholderTextColor={colors.textDim} />`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/02-customer-mobile-experience/src/screens/PixScreen.tsx`
- linha: `79`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `          <TextInput style={s.input} value={amount} onChangeText={setAmount} placeholder="0,00" placeholderTextColor={colors.textDim} keyboardType="decimal-pad" />`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/02-customer-mobile-experience/src/screens/PixScreen.tsx`
- linha: `81`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `          <TextInput style={s.input} value={desc} onChangeText={setDesc} placeholder="Referência do pagamento" placeholderTextColor={colors.textDim} />`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/02-customer-mobile-experience/src/screens/RegisterScreen.tsx`
- linha: `109`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `              placeholder="Endereço de E-mail"`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/02-customer-mobile-experience/src/screens/RegisterScreen.tsx`
- linha: `122`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `              placeholder="Senha de Acesso"`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/02-customer-mobile-experience/src/screens/RegisterScreen.tsx`
- linha: `98`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `              placeholder="Nome Completo"`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/debug_deployed_chat.js`
- linha: `78`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `    await page.fill('input[placeholder*="Mensagem"]', 'Analise minha saúde financeira e sugira alocação de ativos');`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/infra/gcp-cloud-run/deploy-backend.sh`
- linha: `35`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `# Compliance: Requires execution auditing (Mock logging)`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/infra/gcp-gke-autopilot/cluster-provision.sh`
- linha: `36`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `# Compliance: Requires execution auditing (Mock logging)`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/mobile/src/features/transfer-flow/PixScreen.tsx`
- linha: `51`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `      <TextInput placeholder="Chave PIX" value={key} onChangeText={setKey} style={{ backgroundColor: '#0d1526', padding: 15, color: '#fff', marginBottom: 15 }} />`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/mobile/src/features/transfer-flow/PixScreen.tsx`
- linha: `52`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `      <TextInput placeholder="Valor" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" style={{ backgroundColor: '#0d1526', padding: 15, color: '#fff', marginBottom: 15 }} />`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/orval.config.ts`
- linha: `53`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `      mock: false,`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/package-lock.json`
- linha: `11427`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `        "@orval/mock": "6.31.0",`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/package-lock.json`
- linha: `1643`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `        "@babel/plugin-proposal-private-property-in-object": "7.21.0-placeholder-for-preset-env.2",`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/package-lock.json`
- linha: `3606`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `    "node_modules/@orval/mock": {`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/package-lock.json`
- linha: `3608`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `      "resolved": "https://registry.npmjs.org/@orval/mock/-/mock-6.31.0.tgz",`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/package-lock.json`
- linha: `709`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `      "version": "7.21.0-placeholder-for-preset-env.2",`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/package-lock.json`
- linha: `710`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `      "resolved": "https://registry.npmjs.org/@babel/plugin-proposal-private-property-in-object/-/plugin-proposal-private-property-in-object-7.21.0-placeholder-for-preset-env.2.tgz",`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/run_audit.js`
- linha: `167`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `    await page.fill('input[placeholder*="Mensagem"]', 'Analise minha saúde financeira e sugira alocação de ativos');`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/run_audit.js`
- linha: `262`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `    console.log("Orb clicked. Speech recognition mock will run for 2s, then send query...");`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/run_audit.js`
- linha: `35`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `  // Inject SpeechRecognition mock`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/run_audit.js`
- linha: `37`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `    console.log("Injecting Mock Speech Recognition...");`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/__tests__/AppRouter.test.tsx`
- linha: `12`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `vi.mock('../features/dashboard/Dashboard', () => ({`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/__tests__/AppRouter.test.tsx`
- linha: `8`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `vi.mock('../features/auth/Login', () => ({`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/__tests__/Dashboard.test.tsx`
- linha: `16`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `vi.mock('../shared/api/generated/default/default', () => ({`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/__tests__/Dashboard.test.tsx`
- linha: `32`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `vi.mock('../shared/ui/AppLayout', () => ({`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/__tests__/Dashboard.test.tsx`
- linha: `8`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `vi.mock('react-router-dom', async () => {`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/__tests__/Login.test.tsx`
- linha: `18`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `vi.mock('../shared/lib/store', () => ({`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/__tests__/Login.test.tsx`
- linha: `30`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `vi.mock('../core/api/client', () => ({`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/__tests__/Login.test.tsx`
- linha: `34`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `    json: vi.fn().mockResolvedValue({ status: 'success', key: 'mock-key' }),`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/__tests__/Login.test.tsx`
- linha: `41`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `vi.mock('../features/auth/api/useAuth', () => ({`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/__tests__/Login.test.tsx`
- linha: `8`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `vi.mock('react-router-dom', async () => {`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/features/auth/ui/LoginPage.tsx`
- linha: `232`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/features/auth/ui/LoginPage.tsx`
- linha: `233`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all" />`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/features/auth/ui/LoginPage.tsx`
- linha: `237`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `              <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Senha" required`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/features/auth/ui/LoginPage.tsx`
- linha: `238`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-10 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all" />`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/features/auth/ui/LoginPage.tsx`
- linha: `261`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nome completo" required`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/features/auth/ui/LoginPage.tsx`
- linha: `262`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all" />`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/features/auth/ui/LoginPage.tsx`
- linha: `266`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `              <input type="text" value={cpf} onChange={e => setCpf(e.target.value.replace(/\D/g, '').slice(0,11))} placeholder="CPF (11 dígitos) - verificação via Prometeo Open Finance BR" required`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/features/auth/ui/LoginPage.tsx`
- linha: `267`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all" />`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/features/auth/ui/LoginPage.tsx`
- linha: `271`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/features/auth/ui/LoginPage.tsx`
- linha: `272`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all" />`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/features/auth/ui/LoginPage.tsx`
- linha: `276`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `              <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Senha (mín. 8 caracteres)" minLength={8} required`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/features/auth/ui/LoginPage.tsx`
- linha: `277`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-10 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all" />`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/features/banking/ui/ProfilePage.tsx`
- linha: `305`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `                  className="w-full bg-[#0a0f1e] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-cyan-500/50 outline-none"`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/features/banking/ui/ProfilePage.tsx`
- linha: `306`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `                  placeholder="Seu nome completo"`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/features/banking/ui/ProfilePage.tsx`
- linha: `316`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `                  className="w-full bg-[#0a0f1e] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-cyan-500/50 outline-none"`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/features/banking/ui/ProfilePage.tsx`
- linha: `317`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `                  placeholder="seu@email.com"`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/features/banking/ui/ProfilePage.tsx`
- linha: `327`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `                  className="w-full bg-[#0a0f1e] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-cyan-500/50 outline-none"`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/features/banking/ui/ProfilePage.tsx`
- linha: `328`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `                  placeholder="+55 (11) 99999-0000"`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/features/cards/ui/CardsPage.tsx`
- linha: `144`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `      showNotification('Aviso de viagem registrado (mock).', 'success');`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/features/careers/ui/EmpregosPage.tsx`
- linha: `81`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `             placeholder="Injetar query: cargo, protocolo ou squad..."`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/features/careers/ui/EmpregosPage.tsx`
- linha: `82`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `             className="bg-transparent border-none text-white outline-none flex-1 text-sm placeholder:text-gray-600 font-medium tracking-wide"`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/features/compliance/ui/OpenFinancePage.tsx`
- linha: `149`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `      const res = await api.url('/open-finance/payment-links').post({ amount: 50, description: 'Open Finance Demo' }).json<any>();`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/features/compliance/ui/OpenFinancePage.tsx`
- linha: `262`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `            {/* Payment links demo */}`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/features/compliance/ui/OpenFinancePage.tsx`
- linha: `267`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `                  <button onClick={createPaymentLink} className="text-cyan-400">+ Create Demo</button>`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/features/compliance/ui/SecurityCenterPage.tsx`
- linha: `163`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://exemplo.com" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm" />`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/features/compliance/ui/SecurityCenterPage.tsx`
- linha: `184`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `                <input type="number" value={equityData.amount} onChange={e => updateEquity('amount', e.target.value)} placeholder="250000" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-2xl font-light mt-1" />`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/features/compliance/ui/SecurityCenterPage.tsx`
- linha: `188`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `                <input type="number" value={equityData.propertyValue} onChange={e => updateEquity('propertyValue', e.target.value)} placeholder="450000" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xl mt-1" `

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/features/compliance/ui/SecurityCenterPage.tsx`
- linha: `192`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `                <input value={equityData.propertyAddress} onChange={e => updateEquity('propertyAddress', e.target.value)} placeholder="Rua Exemplo, 123 - SP" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 mt-1" />`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/features/compliance/ui/SecurityCenterPage.tsx`
- linha: `196`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `                <input value={equityData.cpf} onChange={e => updateEquity('cpf', e.target.value)} placeholder="000.000.000-00" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 mt-1 font-mono" />`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/features/identity/ui/KYCVerificationPanel.tsx`
- linha: `99`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `            placeholder="Digite o CPF (11 dígitos)"`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/features/investments/ui/InvestmentPage.tsx`
- linha: `158`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `              placeholder="Buscar ativo ou cripto..."`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/features/lifestyle/ui/DreamVaultPage.tsx`
- linha: `242`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `                            placeholder="0,00"`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/features/lifestyle/ui/DreamVaultPage.tsx`
- linha: `243`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `                            className="w-full bg-transparent text-white text-2xl font-light focus:outline-none placeholder:text-gray-700"`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/features/lifestyle/ui/MarketplacePage.tsx`
- linha: `60`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `      // Fallback for demo mode`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/features/lifestyle/ui/MarketplacePage.tsx`
- linha: `62`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `      showFeedback(`Compra processada via Demo Fallback (${p.name}).`, 'success');`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/features/lifestyle/ui/VIPLoungesPage.tsx`
- linha: `45`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `        // Fallback mock if backend fails`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/features/payment-links/ui/PaymentLinksPanel.tsx`
- linha: `103`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `            placeholder="0.00"`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/features/payment-links/ui/PaymentLinksPanel.tsx`
- linha: `109`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `            placeholder="Ex: Consultoria Financeira"`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/features/payment-links/ui/PaymentLinksPanel.tsx`
- linha: `67`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `      // Real call to backend (which uses Prometeo via SM key, no fake delay, isPending from await)`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/features/pix/ui/PixKeyForm.tsx`
- linha: `41`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `          <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 focus:ring-1 focus:ring-cyan-500 outline-none" placeholder="000.000.000-00" />`

### [ALTO] mock_fake_demo
- pacote: `GITHUB_PIPELINE_VERDE`
- arquivo: `RegeneraBank-main/03-enterprise-web-platform/src/features/pix/ui/PixPage.tsx`
- linha: `206`
- achado: mock/fake/demo/placeholder encontrado, validar se é teste ou produção
- amostra: `                  placeholder="0,00" className="flex-1 bg-transparent text-3xl font-light text-cyan-400 outline-none placeholder-gray-700 border-b border-white/10 pb-2" />`

