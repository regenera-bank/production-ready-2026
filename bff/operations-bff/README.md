# operations-bff (Frente 14)

NestJS BFF for **windows-operations** — RBAC, read-only ledger, case stubs, health.

## Run

```bash
cd bff/operations-bff
npm install
npm run start:dev
```

Default port: **3202**

## Auth headers (dev)

| Header | Example |
|--------|---------|
| `x-operator-id` | `op-supervisor-01` |
| `x-operator-role` | `viewer` \| `analyst` \| `supervisor` \| `admin` |

Or set `OPERATIONS_BFF_DEV_ROLE=supervisor` in `.env`.

## Endpoints

| Method | Path | Permission |
|--------|------|------------|
| GET | `/v1/health` | public |
| GET | `/v1/health/ready` | public |
| GET | `/v1/ledger/accounts` | `ledger:read` |
| GET | `/v1/ledger/accounts/:id/entries` | `ledger:read` |
| GET | `/v1/cases` | `cases:manage` |
| POST | `/v1/cases` | `cases:manage` |
| PATCH | `/v1/cases/:id/assign` | `cases:manage` |
| PATCH | `/v1/cases/:id/escalate` | `cases:manage` |
| PATCH | `/v1/cases/:id/close` | `cases:manage` |

## Tests

```bash
npm test
```