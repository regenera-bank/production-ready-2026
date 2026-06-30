# @regenera/sustainability

ESG and carbon offset programs.

## Activation

| Adapter | Status |
|---------|--------|
| simulator | **ACTIVE** (local CI) |
| sandbox | **ACTIVE** (homolog) |
| production | **EXTERNAL_ACTIVATION_REQUIRED** |

## Usage

```typescript
import { SustainabilityModule } from '@regenera/sustainability';

@Module({
  imports: [SustainabilityModule.register({ adapter: 'simulator' })],
})
export class AppModule {}
```

Environment override: `SUSTAINABILITY_ADAPTER=simulator|sandbox|production`
