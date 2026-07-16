# Regenera Windows Operations (Frente 14)

Desktop back-office console — **.NET 8 WPF**, RBAC, four-eyes badges, read-only ledger.

## Stack

| Camada | Tecnologia |
|--------|------------|
| UI | WPF + `design-system/windows` tokens (`#22d3ee`, `#020617`) |
| Core | `Regenera.Operations.Core` — modules, RBAC, BFF client |
| BFF | `bff/operations-bff` — NestJS, port `3202` |

## Quick start

```powershell
# Terminal 1 — BFF
cd bff/operations-bff && npm install && npm run start:dev

# Terminal 2 — Desktop (Windows)
cd apps/windows-operations && .\scripts\build-debug.ps1
```

Ver `EXTERNAL_EXECUTION_REQUIRED.md` se o SDK .NET não estiver disponível.