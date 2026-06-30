# @regenera/design-web

Storybook catalog for Regenera Bank web design system.

## Tokens

Extracted from `desing-final-escolhido-geral-index.html`:

| Token | Value |
|-------|-------|
| Primary | `#22d3ee` |
| Background deep | `#020617` |
| Navy gradient | `#1e3a8a` |
| Font | Manrope 300–800 |

Canonical JSON: `design-system/tokens/*.json`

## Financial components

| Component | Purpose |
|-----------|---------|
| `MoneyDisplay` | Ledger-safe cent string formatting (no float) |
| `OperationStatusBadge` | Payment/operation state chip |
| `PendingOperationCard` | Pending operation summary card |

## Run Storybook

```bash
cd design-system/web
npm install
npm run storybook
# → http://localhost:6006
```