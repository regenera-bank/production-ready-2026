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
|  --> CLASSIFICATION: PROPRIETARY // DEVELOPER MAINTAINED // REQUIRES SENIOR REVIEW    |
|---------------------------------------------------------------------------------------|
*/

import http from 'k6/http';
import { check, sleep } from 'k6';
import crypto from 'k6/crypto';

// SLOs (Service Level Objectives) para o BACEN
export let options = {
  stages: [
    { duration: '30s', target: 500 },  // Ramp-up: 500 usuários simultâneos
    { duration: '1m', target: 10000 }, // Load: Picos de 10.000 requisições simulando recebimento em massa
    { duration: '30s', target: 0 },    // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(99)<150'], // 99% das requisições devem retornar em menos de 150ms
    http_req_failed: ['rate<0.001'],  // Taxa de falha máxima aceitável de 0.1%
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3000';
const WEBHOOK_SECRET = __ENV.WEBHOOK_SECRET || 'default-secret-for-dev';

export default function () {
  const eventId = `E2E_${new Date().getTime()}_${__VU}_${__ITER}`;
  
  const payload = JSON.stringify({
    eventId: eventId,
    type: 'PIX_RECEIVED',
    timestamp: new Date().toISOString(),
    data: {
      endToEndId: `E${new Date().getTime()}0001`,
      amountCents: Math.floor(Math.random() * 50000) + 1000,
      receiverKey: '12345678909',
      senderName: 'Simulação Load K6',
      senderIspb: '12345678'
    }
  });

  // Geração do HMAC Dinâmico
  const signature = crypto.hmac('sha256', WEBHOOK_SECRET, payload, 'hex');

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-signature': signature,
    },
  };

  const res = http.post(`${BASE_URL}/webhook/pix`, payload, params);

  check(res, {
    'status é 201 Created ou 200 OK': (r) => r.status === 201 || r.status === 200,
    'tempo de resposta aceitável': (r) => r.timings.duration < 150,
  });

  sleep(0.1); // Pausa de 100ms entre as submissões
}
