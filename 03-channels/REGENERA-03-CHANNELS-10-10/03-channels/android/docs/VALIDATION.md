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
