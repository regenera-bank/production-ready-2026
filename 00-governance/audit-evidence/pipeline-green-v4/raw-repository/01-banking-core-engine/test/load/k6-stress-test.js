import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '15s', target: 50 },  // Ramp-up: 50 usuários simultâneos
    { duration: '30s', target: 50 },   // Carga estável: 50 usuários
    { duration: '15s', target: 200 }, // Spike/Estresse: Pulo para 200 usuários
    { duration: '30s', target: 200 },  // Sustentando spike
    { duration: '15s', target: 0 },   // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% das requisições devem ocorrer em menos de 500ms
    http_req_failed: ['rate<0.01'],   // Taxa de falha deve ser menor que 1%
  },
};

export function setup() {
  const host = 'http://localhost:8080/v1';
  
  // Cria conta do pagador e gera token JWT
  const senderRes = http.post(`${host}/auth/test-token`, JSON.stringify({
    neuralId: 'stress-test-sender',
    email: 'sender@stress.com'
  }), { headers: { 'Content-Type': 'application/json' } });
  
  // Cria conta do recebedor
  http.post(`${host}/auth/test-token`, JSON.stringify({
    neuralId: 'stress-test-receiver',
    email: 'receiver@stress.com'
  }), { headers: { 'Content-Type': 'application/json' } });

  const token = JSON.parse(senderRes.body).accessToken;
  return { token };
}

export default function (data) {
  const host = 'http://localhost:8080/v1';
  const url = `${host}/pix/transfer`;
  
  const idempotencyKey = `k6-key-${__VU}-${__ITER}`;
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token}`,
    'idempotency-key': idempotencyKey,
  };

  const payload = JSON.stringify({
    key: 'stress-test-receiver',
    amount: 1, // R$ 1.00
  });

  // 1. Envio inédito (espera 201 Created)
  const res = http.post(url, payload, { headers });
  check(res, {
    'inbound is status 201': (r) => r.status === 201,
  });

  // 2. Replay idempotente com mesma chave (espera 200 OK)
  const resDup = http.post(url, payload, { headers });
  check(resDup, {
    'replay is status 200': (r) => r.status === 200,
  });

  sleep(0.1);
}
