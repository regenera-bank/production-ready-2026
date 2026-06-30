# Regenera Bank — Entrega dos cinco canais

## Artefatos

- `01-Regenera-Web-Production.zip` — 100013 bytes — SHA-256 `f113ce0447076a9dc43817002dd4a165ec06dd052625ccd2e5405d2c6d6e60e9`;
- `02-Regenera-Android-Production.zip` — 36176 bytes — SHA-256 `ec22fe94515769060d238f1341d832c6d21a530d453603dcca1f86d929246bb1`;
- `03-Regenera-iOS-Production.zip` — 34657 bytes — SHA-256 `9dd459c34031f71804c77eb843bbb88124189341990569abaeee94e0dcdf64d9`;
- `04-Regenera-Windows-Operations-Production.zip` — 33243 bytes — SHA-256 `c16be611d3ed9ed016df73a7016fb97314540cbff810578d975913ae55f1f191`;
- `05-Regenera-Partner-APIs-Production.zip` — 48038 bytes — SHA-256 `ea79863e79f4e862fafc353f01551e4902a020a17b17320583a0fa04b8e90930`;

## Escopo implementado

- contrato canônico compartilhado entre os cinco canais;
- primeira vertical slice: autenticação, conta, saldo, extrato e Pix controlado;
- Web com BFF, sessão opaca server-side, CSRF e OIDC/PKCE;
- Android nativo Kotlin/Compose com AppAuth, Keystore e Play Integrity gateway;
- iOS nativo SwiftUI com OIDC/PKCE, Keychain e App Attest gateway;
- Windows Operations read-only com MSAL, filas de casos e auditoria;
- APIs Parceiros com mTLS, binding de certificado no token, scopes, idempotência Redis e webhooks assinados;
- mapa dos 23 módulos preservado em `docs/MODULE-REGISTRY.json`;
- nenhum segredo, certificado privado, keystore ou credencial real incluído.

## Limite de entrega

Os pacotes são a fundação executável dos canais e da primeira fatia financeira. Não incluem autorização Bacen, certificados SPI/DICT, conta PI, HSM, contratos de bandeira, tenant de identidade, provedores KYC, processador emissor ou homologações externas.

# Relatório de validação da entrega

## Gates executados

| Pacote | Gate | Resultado |
|---|---|---|
| Web | TypeScript, Vitest, Next production build | aprovado |
| Web | npm audit de produção | sem alta/crítica; 2 avisos moderados transitivos do framework/PostCSS |
| Android | estrutura Gradle/Kotlin, XML, invariantes e configuração de release | aprovado estaticamente |
| iOS | parser Swift, plist, entitlements e XcodeGen YAML | aprovado |
| Windows Operations | XML/XAML/csproj, manifest e ativos MSIX | aprovado estaticamente |
| APIs Parceiros | TypeScript, Node test runner, build e npm audit de produção | aprovado; 0 vulnerabilidades |
| Todos | contratos OpenAPI idênticos | aprovado |
| Todos | varredura de segredo e material de assinatura | aprovado |
| Todos | `regenera-agent` com portão code-only | aprovado; nenhuma alteração executável |

## Limites do ambiente de validação

- Android não foi compilado porque o ambiente não possui Android SDK 35/Gradle instalado;
- iOS não foi compilado/assinado porque a validação ocorreu fora de macOS/Xcode;
- Windows não foi compilado/assinado porque o ambiente não possui .NET SDK/Windows SDK;
- integrações com IdP, Redis, core, KMS/HSM, Play Integrity, App Attest e Entra ID exigem endpoints, certificados e tenants reais;
- nenhuma homologação Bacen, SPI, DICT, bandeira ou loja é substituída por este pacote.

## Contagem de arquivos

- `01-Regenera-Web-Production`: 42 arquivos;
- `02-Regenera-Android-Production`: 34 arquivos;
- `03-Regenera-iOS-Production`: 29 arquivos;
- `04-Regenera-Windows-Operations-Production`: 27 arquivos;
- `05-Regenera-Partner-APIs-Production`: 28 arquivos;

## Contrato canônico

SHA-256 do `contracts/openapi.yaml`: `cf56d26d0a7a73c32b66fdca2e24825eabe26dd2966fa38fc4003487347cf94c`.

