# Fronteiras dos canais

**Documento:** CH-ARCH-001  
**Estado:** controlado

Canal não calcula verdade financeira.
Canal apresenta.
Canal coleta intenção.
Canal prova contexto.

## Web Banking

Usa BFF próprio.
Sessão em cookie `HttpOnly`, `Secure` e `SameSite=Strict`.
Comando mutável exige CSRF, correlation ID e idempotency key.

## Android

Token vive em armazenamento seguro.
Dispositivo precisa estar vinculado.
Operação crítica exige integridade do aplicativo e confirmação local.

## iOS

Token vive no Keychain.
App Attest protege vínculo.
Tela sensível não aparece em snapshot.

## Windows Operations

Operador não aprova a própria ação.
Acesso privilegiado expira.
PII nasce mascarada.

## Partner Portal

Parceiro autentica com mTLS e credencial rotacionável.
Segredo é exibido uma vez.
Webhook leva assinatura, timestamp e nonce.

## Proibições

- banco de dados direto;
- segredo incorporado;
- saldo calculado no cliente;
- retry cego em `UNKNOWN`;
- dependência de arquivo histórico;
- canal genérico embrulhado em WebView.
