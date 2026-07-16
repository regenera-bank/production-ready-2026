# Regenera Bank — iOS

SwiftUI modular app (Swift Package Manager).

## Módulos

| Camada | Targets |
|--------|---------|
| App | `RegeneraBankApp` |
| Core | `CoreDesign`, `CoreNetworking`, `CoreSecurity`, `CoreStorage`, `CoreObservability` |
| Features | `FeatureAuthentication`, `FeatureOnboarding`, `FeatureHome`, `FeatureAccounts`, `FeatureTransactions`, `FeaturePix`, `FeatureTransfers`, `FeatureCards`, `FeatureCredit`, `FeatureInvestments`, `FeatureProfile`, `FeatureSupport` |

## BFF

Cliente: `MobileBFFClientProtocol` em `CoreNetworking`, contrato espelhado em `bff/mobile-bff/src/contracts/mobile-api.ts`.

```bash
export MOBILE_BFF_URL=http://127.0.0.1:3201
swift build
swift test
```