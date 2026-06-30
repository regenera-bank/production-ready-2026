# @regenera/accounts

Ledger accounts — delegates to @regenera/core-bank.

## Activation

| Adapter | Status |
|---------|--------|
| simulator | **ACTIVE** (local CI) |
| sandbox | **ACTIVE** (homolog) |
| production | **EXTERNAL_ACTIVATION_REQUIRED** |

## Delegation

This domain is a thin boundary over `@regenera/core-bank`. Do not duplicate ledger, payment, or PIX engines here — wire production adapters to core-bank modules when externally activated.

## Usage

```typescript
import { AccountsModule } from '@regenera/accounts';

@Module({
  imports: [AccountsModule.register({ adapter: 'simulator' })],
})
export class AppModule {}
```

Environment override: `ACCOUNTS_ADAPTER=simulator|sandbox|production`
