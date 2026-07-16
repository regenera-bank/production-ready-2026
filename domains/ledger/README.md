# @regenera/ledger

Journal entries — delegates to @regenera/core-bank.

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
import { LedgerModule } from '@regenera/ledger';

@Module({
  imports: [LedgerModule.register({ adapter: 'simulator' })],
})
export class AppModule {}
```

Environment override: `LEDGER_ADAPTER=simulator|sandbox|production`
