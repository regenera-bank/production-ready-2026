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

// |---------------------------------------------------------------------------------------|
// |  --> REGENERA ENTERPRISE SYSTEM v4.0                                                  |
// |---------------------------------------------------------------------------------------|
//
// PROJECT:       Regenera Bank
// CEO:           Raphaela Cerveski
// DEVELOPER:     Don Paulo Ricardo
// ID:            2098233287
// COPYRIGHT:     Copyright (c) 2026 Regenera Corporate
//
// LICENSE:       EULA (End-User License Agreement)
// PROTECTION:    PROPRIEDADE INTELECTUAL RESTRITA
//
// WARNING:       TODOS OS DIREITOS RESERVADOS. Proibida a cópia, distribuição,
//                engenharia reversa ou modificação não autorizada.
//
// |---------------------------------------------------------------------------------------|
// |  --> CLASSIFICATION: PROPRIETARY // DEVELOPER MAINTAINED // REQUIRES SENIOR REVIEW          |
// |---------------------------------------------------------------------------------------|

import { http, HttpResponse, delay } from 'msw';

export const handlers = [
  // Neural Insights Mock
  http.get('https://regenera-core-api-vrf2tbmlmq-rj.a.run.app/v1/neural/smart-statement', async () => {
    await delay(1000);
    return HttpResponse.json([
      { type: 'info', message: 'Neural Sync: Your liquidity ratio is optimal.' },
      { type: 'sucesso', message: 'Neural Core: detected 2% increase in yield forecast.' },
      { type: 'alerta', message: 'Security: High-volume transfer detected in sandbox.' }
    ]);
  }),

  // Neural Interaction Mock
  http.post('https://regenera-core-api-vrf2tbmlmq-rj.a.run.app/v1/neural/process', async ({ request }) => {
    const { prompt } = await request.json() as { prompt: string };
    await delay(1500);
    return HttpResponse.json({
      text: `Directive received: "${prompt}". Neural Processor has successfully analyzed the parameters. Operation ready for execution.`,
      audioBase64: null
    });
  }),

  // Dashboard Mock
  http.get('https://regenera-core-api-vrf2tbmlmq-rj.a.run.app/v1/core/dashboard', async () => {
    return HttpResponse.json({
      globalBalanceCents: 24783290,
      monthlyYield: 5.24,
      creditScore: 945,
      recentTransactions: [
        { id: '1', type: 'pix_in', description: 'Neural PIX Sync', party: 'Regenera Core', amount: 500.00, timestamp: '14:30' }
      ]
    });
  })
];
