# @regenera/card-invoices

Card billing cycles and invoices.

## Activation

| Adapter | Status |
|---------|--------|
| simulator | **ACTIVE** (local CI) |
| sandbox | **ACTIVE** (homolog) |
| production | **EXTERNAL_ACTIVATION_REQUIRED** |

## Usage

```typescript
import { CardInvoicesModule } from '@regenera/card-invoices';

@Module({
  imports: [CardInvoicesModule.register({ adapter: 'simulator' })],
})
export class AppModule {}
```

Environment override: `CARD_INVOICES_ADAPTER=simulator|sandbox|production`
