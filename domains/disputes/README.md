# @regenera/disputes

Chargeback and dispute cases.

## Activation

| Adapter | Status |
|---------|--------|
| simulator | **ACTIVE** (local CI) |
| sandbox | **ACTIVE** (homolog) |
| production | **EXTERNAL_ACTIVATION_REQUIRED** |

## Usage

```typescript
import { DisputesModule } from '@regenera/disputes';

@Module({
  imports: [DisputesModule.register({ adapter: 'simulator' })],
})
export class AppModule {}
```

Environment override: `DISPUTES_ADAPTER=simulator|sandbox|production`
