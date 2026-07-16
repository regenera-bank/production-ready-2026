# @regenera/accounting

Management accounting and chart of accounts.

## Activation

| Adapter | Status |
|---------|--------|
| simulator | **ACTIVE** (local CI) |
| sandbox | **ACTIVE** (homolog) |
| production | **EXTERNAL_ACTIVATION_REQUIRED** |

## Usage

```typescript
import { AccountingModule } from '@regenera/accounting';

@Module({
  imports: [AccountingModule.register({ adapter: 'simulator' })],
})
export class AppModule {}
```

Environment override: `ACCOUNTING_ADAPTER=simulator|sandbox|production`
