/*
|---------------------------------------------------------------------------------------|
|  --> REGENERA ENTERPRISE SYSTEM v4.0                                                  |
|---------------------------------------------------------------------------------------|

PROJECT:       Regenera Bank
CEO:           Raphaela Cerveski
DEVELOPER:     Don Paulo Ricardo
ID:            2098233287
COPYRIGHT:     Copyright (c) 2026 Regenera Corporate

LICENSE:       EULA (End-User License Agreement)
PROTECTION:    PROPRIEDADE INTELECTUAL RESTRITA

WARNING:       TODOS OS DIREITOS RESERVADOS. Proibida a cópia, distribuição,
               engenharia reversa ou modificação não autorizada.

|---------------------------------------------------------------------------------------|
|  --> CLASSIFICATION: PROPRIETARY // DEVELOPER MAINTAINED // REQUIRES SENIOR REVIEW          |
|---------------------------------------------------------------------------------------|
*/

/**
 * app.module.patch.ts
 * 
 * Instruções para integrar os módulos Open Finance (Prometeo) e Neural Core (Gemini/Raphaela)
 * no AppModule principal do backend NestJS.
 * 
 * Siga estes passos para "patch" o app.module.ts existente:
 * 
 * 1. Importe os módulos no topo:
 *    import { OpenFinanceModule } from './open-finance/open-finance.module';
 *    import { NeuralCoreModule } from './neural-core/neural-core.module';
 * 
 * 2. Adicione ao array `imports` do @Module decorator:
 *    OpenFinanceModule,
 *    NeuralCoreModule,
 * 
 * Exemplo de patch no app.module.ts:
 * 
 * @Module({
 *   imports: [
 *     // ... outros módulos existentes
 *     OpenFinanceModule,
 *     NeuralCoreModule,
 *   ],
 *   // ...
 * })
 * export class AppModule {}
 * 
 * 3. Certifique-se que as variáveis de ambiente estão setadas (PROMETEO_API_KEY, GEMINI_API_KEY, etc.)
 *    via Secret Manager no Cloud Run deploy.
 * 
 * 4. Após patch, rode `npm run start:dev` e teste endpoints /v1/open-finance/* e /v1/neural-core/*
 * 
 * Isso conecta as integrações reais do README com o backend core já existente (ledger, infra, auth, etc.).
 * Mantém todo o trabalho senior anterior no frontend (alinhamentos UX flows, 10/10 architecture deck, real GCP wiring).
 */
