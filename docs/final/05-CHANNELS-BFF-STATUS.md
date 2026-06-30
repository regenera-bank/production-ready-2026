# 05 — Channels & BFF Status

**HEAD:** `44efb4413583bbc7cb108892cd1f060034c2bc19`

---

## Web Banking

| Item | Status | Evidence |
|------|--------|----------|
| React/TypeScript app | **ACTIVE_SANDBOX** | `apps/web-banking/` |
| Vite dev `:5176` | **ACTIVE_INTERNAL** | `vite.config.ts` proxy `/api` → BFF |
| Build | **ACTIVE_INTERNAL** | `artifacts/verification/full-ci/run1/build/44-044-build-web-banking.log` exit 0 |
| Unit tests | **ACTIVE_INTERNAL** | 8 pass — `unit/36-036-unit-test-web-banking.log` |
| Lint | **ACTIVE_INTERNAL** | `lint/30-030-lint-web-banking.log` exit 0 |
| npm audit | **ACTIVE_INTERNAL** | `security/26-026-audit-npm-web-banking.log` — 0 vulnerabilities |
| Paleta/tokens | **ACTIVE_INTERNAL** | `tailwind.config.js`, `index.css` — Manrope, `#22d3ee`, `#020617` |

---

## Web BFF

| Item | Status | Evidence |
|------|--------|----------|
| NestJS BFF | **ACTIVE_SANDBOX** | `bff/web-bff/` |
| Auth + session | **ACTIVE_SANDBOX** | `auth.controller.ts`, e2e login 2 tests |
| Banking (dashboard, pix, transfer) | **ACTIVE_SANDBOX** | `banking.controller.ts`, e2e pix+transfer |
| Onboarding/KYC homolog | **ACTIVE_SANDBOX** | `onboarding.controller.ts`, `KYC_PROVIDER=homolog` guard |
| Unit tests | **ACTIVE_INTERNAL** | 35 pass — `unit/35-035-unit-test-web-bff.log` |
| Build | **ACTIVE_INTERNAL** | `build/42-042-build-web-bff.log` exit 0 |
| npm audit | **FAIL** | `security/22-022-audit-npm-web-bff.log` exit 1 (high/moderate transitive) |

---

## Mobile BFF + Android

| Item | Status | Evidence |
|------|--------|----------|
| mobile-bff | **ACTIVE_INTERNAL** | `bff/mobile-bff/`, health `:3201/v1/health` |
| Android source | **EXTERNAL_ACTIVATION_REQUIRED** | `apps/android/EXTERNAL_EXECUTION_REQUIRED.md` — sem JDK no CI |
| core-design tokens | **ACTIVE_INTERNAL** | `RegeneraTokens.kt` — `#22d3ee`, `#020617` |

---

## iOS

| Item | Status | Evidence |
|------|--------|----------|
| SwiftUI design package | **ACTIVE_INTERNAL** | `design-system/ios/Sources/RegeneraDesign/` |
| Unit tests (colors) | **ACTIVE_INTERNAL** | `design-system/ios/Tests/RegeneraDesignTests/ColorRegeneraTests.swift` |
| App store build | **EXTERNAL_ACTIVATION_REQUIRED** | Xcode toolchain fora do CI |

---

## Windows Operations

| Item | Status | Evidence |
|------|--------|----------|
| XAML tokens | **ACTIVE_INTERNAL** | `design-system/windows/RegeneraTokens.xaml` |
| WinUI app | **EXTERNAL_ACTIVATION_REQUIRED** | não executado no CI |

---

## E2E (quality/e2e-web)

```
4 passed (6.5s)
- login: cadastro + auth
- login: credenciais inválidas
- pix-flow: Pix interno R$1
- transfer-flow: TED entre contas homolog
```

**Log:** `artifacts/verification/full-ci/run1/e2e/47-047-e2e-playwright.log`