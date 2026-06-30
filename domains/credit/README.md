# @regenera/credit

Credit lines and lending products.

## Activation

| Adapter | Status |
|---------|--------|
| simulator | **ACTIVE** (local CI) |
| sandbox | **ACTIVE** (homolog) |
| production | **EXTERNAL_ACTIVATION_REQUIRED** |

## Usage

```typescript
import { CreditModule } from '@regenera/credit';

@Module({
  imports: [CreditModule.register({ adapter: 'simulator' })],
})
export class AppModule {}
```

Environment override: `CREDIT_ADAPTER=simulator|sandbox|production`
