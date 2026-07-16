# @regenera/transactions

Customer-facing transaction history and receipts.

## Activation

| Adapter | Status |
|---------|--------|
| simulator | **ACTIVE** (local CI) |
| sandbox | **ACTIVE** (homolog) |
| production | **EXTERNAL_ACTIVATION_REQUIRED** |

## Usage

```typescript
import { TransactionsModule } from '@regenera/transactions';

@Module({
  imports: [TransactionsModule.register({ adapter: 'simulator' })],
})
export class AppModule {}
```

Environment override: `TRANSACTIONS_ADAPTER=simulator|sandbox|production`
