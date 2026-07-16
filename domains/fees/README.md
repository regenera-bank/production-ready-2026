# @regenera/fees

Fee schedules and accrual.

## Activation

| Adapter | Status |
|---------|--------|
| simulator | **ACTIVE** (local CI) |
| sandbox | **ACTIVE** (homolog) |
| production | **EXTERNAL_ACTIVATION_REQUIRED** |

## Usage

```typescript
import { FeesModule } from '@regenera/fees';

@Module({
  imports: [FeesModule.register({ adapter: 'simulator' })],
})
export class AppModule {}
```

Environment override: `FEES_ADAPTER=simulator|sandbox|production`
