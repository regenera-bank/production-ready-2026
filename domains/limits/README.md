# @regenera/limits

Transactional and product limits.

## Activation

| Adapter | Status |
|---------|--------|
| simulator | **ACTIVE** (local CI) |
| sandbox | **ACTIVE** (homolog) |
| production | **EXTERNAL_ACTIVATION_REQUIRED** |

## Usage

```typescript
import { LimitsModule } from '@regenera/limits';

@Module({
  imports: [LimitsModule.register({ adapter: 'simulator' })],
})
export class AppModule {}
```

Environment override: `LIMITS_ADAPTER=simulator|sandbox|production`
