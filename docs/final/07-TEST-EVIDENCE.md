# 07 — Test Evidence

| Suite | Count | Exit | Log |
|-------|-------|------|-----|
| Core unit | 184 pass | 0 | `full-ci/run1/unit/34-034-unit-test-core-bank.log` |
| Postgres IT | 14 pass | 0 | `full-ci/run1/integration/37-037-integration-test-postgres.log` |
| BFF unit | 35 pass | 0 | `full-ci/run1/unit/35-035-unit-test-web-bff.log` |
| Web unit | 8 pass | 0 | `full-ci/run1/unit/36-036-unit-test-web-banking.log` |
| BullMQ Redis | 5 pass | 0 | `full-ci/run1/queue/38-038-queue-test-redis.log` |
| Outbox Postgres | 3 pass | 0 | `workers/outbox-relay npm run test:postgres` |
| Web E2E Playwright | 4 pass | 0 | `full-ci/run1/e2e/47-047-e2e-playwright.log` |
| Partner contracts | 4 pass | 0 | `quality/contract-tests/partner/` |
| Domain sample (10) | 21 pass | 0 | `domains/*/src/*.spec.ts` |
| iOS Swift | 20 pass | 0 | `apps/ios swift test` |
| Android core | 5 pass | EXTERNAL | `apps/android` |