# @regenera/senior

Senior banking adaptations.

## Activation

| Adapter | Status |
|---------|--------|
| simulator | **ACTIVE** (local CI) |
| sandbox | **ACTIVE** (homolog) |
| production | **EXTERNAL_ACTIVATION_REQUIRED** |

## Usage

```typescript
import { SeniorModule } from '@regenera/senior';

@Module({
  imports: [SeniorModule.register({ adapter: 'simulator' })],
})
export class AppModule {}
```

Environment override: `SENIOR_ADAPTER=simulator|sandbox|production`
