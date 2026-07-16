# Partner API Facade

NestJS BFF for Regenera Bank partner integrations.

## Capabilities

- OAuth2 client credentials stub (`POST /v1/oauth/token`)
- mTLS configuration spec (required in production, optional in sandbox)
- Rate limiting middleware
- Idempotency middleware (payload-hash bound)
- Scope-based authorization
- Webhook subscription management with sandbox delivery adapter

## Local development

```bash
pnpm install
cp .env.example .env
pnpm start:dev
```

Facade listens on `http://localhost:3300/v1`.

## Contract

- OpenAPI: `contracts/openapi/partner-api-v1.openapi.yaml`
- AsyncAPI: `contracts/asyncapi/partner-webhooks-v1.asyncapi.yaml`