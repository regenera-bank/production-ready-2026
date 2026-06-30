# EXTERNAL_EXECUTION_REQUIRED — Regenera Bank Android

Este ambiente de CI/agente **não possui JDK nem Gradle** instalados. O código-fonte modular está completo; execute o build localmente.

## Pré-requisitos

- **JDK 17+** (Android Studio JBR ou Temurin)
- **Android SDK** (API 35) via Android Studio
- **mobile-bff** rodando em `http://localhost:3201` (emulador: `10.0.2.2:3201`)

## Build

```bash
cd apps/android
bash scripts/build-debug.sh
```

Ou manualmente:

```bash
cd apps/android
./gradlew assembleDebug test
```

## Subir mobile-bff

```bash
cd bff/mobile-bff
npm install
npm run start:dev
# GET http://localhost:3201/v1/health → { status: "ok", layer: "mobile-bff", channel: "android" }
```

## Estrutura criada

| Módulo | Responsabilidade |
|--------|------------------|
| `app` | Application shell, Hilt DI, MainActivity Compose |
| `core-design` | Tokens `#22d3ee` / `#020617`, `RegeneraTheme` |
| `core-network` | `MobileBffApi`, Retrofit factory |
| `core-security` | `SessionTokenStore`, `DeviceTrustBffClient` |
| `core-storage` | `UserPreferencesStore`, `ProfileSyncBffClient` |
| `core-observability` | `BffHealthProbe`, logging |
| `feature-*` | BFF client Retrofit por domínio (auth, pix, …) |

## Resultado esperado

- `app/build/outputs/apk/debug/app-debug.apk`
- Testes unitários verdes nos 5 módulos `core-*`