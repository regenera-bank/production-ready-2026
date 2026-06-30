# @regenera/suitability

Investor suitability profiling.

## Activation

| Adapter | Status |
|---------|--------|
| simulator | **ACTIVE** (local CI) |
| sandbox | **ACTIVE** (homolog) |
| production | **EXTERNAL_ACTIVATION_REQUIRED** |

## Usage

```typescript
import { SuitabilityModule } from '@regenera/suitability';

@Module({
  imports: [SuitabilityModule.register({ adapter: 'simulator' })],
})
export class AppModule {}
```

Environment override: `SUITABILITY_ADAPTER=simulator|sandbox|production`
