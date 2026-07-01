# 06 — Design System Status

**HEAD:** `FINAL_COMMIT_PENDING`
**Protótipo fonte:** `desing-final-escolhido-geral-index.html` (~4251 linhas)

---

## Tokens canônicos

| Token | Valor | Fonte HTML |
|-------|-------|------------|
| `--primary-color` | `#22d3ee` | `:root` linha 44 |
| `--bg-deep` | `#020617` | `:root` linha 46 |
| `--bg-gradient-start` | `#1e3a8a` | `:root` linha 47 |
| Font | Manrope 300–800 | Google Fonts link linha 11 |
| `--transition-curve` | `cubic-bezier(0.4, 0, 0.2, 1)` | `:root` linha 49 |

**JSON:** `design-system/tokens/color.json`, `typography.json`, `spacing.json`, `radius.json`, `elevation.json`, `motion.json`

---

## Pacotes por canal

| Canal | Path | Status | Evidence |
|-------|------|--------|----------|
| Web Storybook | `design-system/web/` | **ACTIVE_INTERNAL** | `@regenera/design-web`, Storybook 8 |
| Web canal (inline) | `apps/web-banking/src/index.css` | **ACTIVE_SANDBOX** | tokens CSS espelhados |
| Android | `apps/android/core-design/` | **ACTIVE_INTERNAL** | `RegeneraTokens.kt` |
| iOS | `design-system/ios/` | **ACTIVE_INTERNAL** | `Color+Regenera.swift` testado |
| Windows | `design-system/windows/` | **ACTIVE_INTERNAL** | `RegeneraTokens.xaml` |

---

## Componentes financeiros (novos)

| Componente | Path | Storybook |
|------------|------|-----------|
| `MoneyDisplay` | `design-system/web/src/components/MoneyDisplay.tsx` | `Financial/MoneyDisplay` |
| `OperationStatusBadge` | `design-system/web/src/components/OperationStatusBadge.tsx` | `Financial/OperationStatusBadge` |
| `PendingOperationCard` | `design-system/web/src/components/PendingOperationCard.tsx` | `Financial/PendingOperationCard` |

**Regra:** cent strings only — alinhado a `apps/web-banking/src/platform/money.ts` e `domains/core-bank/src/money/money.value-object.ts`.

---

## Componentes obrigatórios (AGENTS.md §7) — gap

| Grupo | Componentes | Status |
|-------|-------------|--------|
| Auth | LoginCard, IntroScreen | **ACTIVE_SANDBOX** em `apps/web-banking/` |
| Nav | BottomNav, SideMenu, HeaderBar | **ACTIVE_SANDBOX** AppShell |
| Home | HeroCard, BalanceDisplay, ActionGrid | **ACTIVE_SANDBOX** (saldo BFF real) |
| Banking | PixSendPanel, TransferForm, etc. | **ACTIVE_SANDBOX** parcial |
| Financial DS | MoneyDisplay, OperationStatusBadge, PendingOperationCard | **ACTIVE_INTERNAL** (Storybook) |
| Assistente | RaphaelaOrb, VoiceChatSheet | **ACTIVE_SANDBOX** (Vertex/Gemini) |

**Pendente:** migrar canal web para importar `@regenera/design-web` em vez de duplicar estilos.

---

## Executar Storybook

```bash
cd design-system/web && npm install && npm run storybook
```
