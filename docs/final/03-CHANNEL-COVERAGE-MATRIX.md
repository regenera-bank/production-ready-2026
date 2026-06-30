# 03 — Channel Coverage Matrix

| Canal | Path | BFF | Status | Testes | Evidência |
|-------|------|-----|--------|--------|-----------|
| Web Banking | `apps/web-banking` | `bff/web-bff` | ACTIVE_SANDBOX | 8 unit + 4 E2E | `artifacts/verification/full-ci/run1/unit/36-036-unit-test-web-banking.log` |
| Android | `apps/android` | `bff/mobile-bff` | EXTERNAL_EXECUTION_REQUIRED (JDK/SDK) | 5 unit core | `apps/android/EXTERNAL_EXECUTION_REQUIRED.md` |
| iOS | `apps/ios` | `bff/mobile-bff` | ACTIVE_INTERNAL (SPM) | 20/20 swift test | `apps/ios/Package.swift` |
| Windows Operations | `apps/windows-operations` | `bff/operations-bff` | EXTERNAL_EXECUTION_REQUIRED (.NET) | 10 BFF + 3 xUnit | `bff/operations-bff` npm test |
| Partner Platform | `apps/partner-developer-portal` | `bff/partner-api-facade` | ACTIVE_SANDBOX | 4 contract + 5 facade + 3 portal | `quality/contract-tests/partner/` |