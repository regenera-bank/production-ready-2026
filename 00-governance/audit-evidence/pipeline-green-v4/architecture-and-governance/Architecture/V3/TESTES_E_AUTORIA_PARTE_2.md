# TESTES E AUTORIA — PARTE 2

Parte 2 já funciona.
Agora precisa provar.

## Backend

- teste de rota pública marcada como pública
- teste de rota privada com guard
- teste de idempotência
- teste de Prometeo só via backend
- teste de erro com code estável
- teste de mock proibido em runtime crítico

Controller recebe.
Service decide.
Banco garante.

## Frontend

- teste de API client único
- teste de retry preservando Idempotency-Key
- teste de tela sem saldo fake
- teste de erro vindo do backend sem inventar sucesso
- teste de render sem loop

Tela mostra.
Tela não decide dinheiro.

## Mobile

- teste de SecureStore
- teste de AsyncStorage sem token sensível
- teste de biometria como step-up
- teste de retry com sessão expirada

Mobile é rua.
Rua não manda no dinheiro.

## Infra

- gate sem `.env`
- gate sem `node_modules`
- gate sem segredo literal
- build separado por pacote
- deploy só por pipeline

Pipeline é porteiro.
Porteiro frouxo deixa incidente entrar de crachá.
