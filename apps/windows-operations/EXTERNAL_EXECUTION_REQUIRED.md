# EXTERNAL_EXECUTION_REQUIRED — Regenera Windows Operations

Este ambiente de CI/agente **não possui .NET SDK 8** instalado. O código-fonte WPF está completo; execute o build em **Windows** com .NET 8.

## Pré-requisitos

- **.NET SDK 8.0+**
- **Windows 10/11** (WPF `net8.0-windows`)
- **operations-bff** em `http://localhost:3202`

## Build

```powershell
cd apps/windows-operations
.\scripts\build-debug.ps1
```

Ou manualmente:

```powershell
dotnet restore Regenera.Operations.sln
dotnet build Regenera.Operations.sln -c Debug
dotnet test Regenera.Operations.sln -c Debug
```

## Subir operations-bff

```bash
cd bff/operations-bff
npm install
npm run start:dev
# GET http://localhost:3202/v1/health
```

## Módulos (18)

Clients, KYC, AML, Fraud, Transactions, Pix, Cards, Credit, Disputes, Reconciliation, LedgerReadOnly, Cases, Reports, Integrations, Audit, Users, Permissions, Health

## Testes unitários

- `ClientsModuleTests`
- `KycModuleTests`
- `LedgerReadOnlyModuleTests`

## Resultado esperado

- `src/Regenera.Operations.Desktop/bin/Debug/net8.0-windows/Regenera.Operations.exe`
- Testes xUnit verdes nos 3 módulos acima