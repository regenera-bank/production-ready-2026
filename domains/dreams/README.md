# @regenera/dreams

Savings goals (dreams) product.

## Activation

| Adapter | Status |
|---------|--------|
| simulator | **ACTIVE** (local CI) |
| sandbox | **ACTIVE** (homolog) |
| production | **EXTERNAL_ACTIVATION_REQUIRED** |

## Usage

```typescript
import { DreamsModule } from '@regenera/dreams';

@Module({
  imports: [DreamsModule.register({ adapter: 'simulator' })],
})
export class AppModule {}
```

Environment override: `DREAMS_ADAPTER=simulator|sandbox|production`
