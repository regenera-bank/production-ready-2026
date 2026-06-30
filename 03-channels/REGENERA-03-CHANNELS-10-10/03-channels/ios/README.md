# iOS

Keychain e App Attest protegem sessão. Snapshot sensível não vira fotografia de saldo.

## Responsabilidade

- apresentar estado recebido do BFF;
- criar intenção autenticada;
- carregar correlation ID;
- carregar idempotency key em mutação;
- bloquear repetição em estado desconhecido;
- registrar telemetria sem segredo.

## Proibido

- banco de dados direto;
- chave privada no cliente;
- cálculo final de saldo;
- decisão de fraude local;
- retry cego;
- dependência de `audit-evidence` ou `source-material`.

## Teste

A implementação é compilada e exercitada pelo gate raiz.
