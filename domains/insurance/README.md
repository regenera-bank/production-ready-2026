# @regenera/insurance

Insurance policy administration.

## Activation

| Adapter | Status |
|---------|--------|
| simulator | **ACTIVE** (local CI) |
| sandbox | **ACTIVE** (homolog) |
| production | **EXTERNAL_ACTIVATION_REQUIRED** |

## Usage

```typescript
import { InsuranceModule } from '@regenera/insurance';

@Module({
  imports: [InsuranceModule.register({ adapter: 'simulator' })],
})
export class AppModule {}
```

Environment override: `INSURANCE_ADAPTER=simulator|sandbox|production`
