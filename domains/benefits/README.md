# @regenera/benefits

Employee and partner benefits.

## Activation

| Adapter | Status |
|---------|--------|
| simulator | **ACTIVE** (local CI) |
| sandbox | **ACTIVE** (homolog) |
| production | **EXTERNAL_ACTIVATION_REQUIRED** |

## Usage

```typescript
import { BenefitsModule } from '@regenera/benefits';

@Module({
  imports: [BenefitsModule.register({ adapter: 'simulator' })],
})
export class AppModule {}
```

Environment override: `BENEFITS_ADAPTER=simulator|sandbox|production`
