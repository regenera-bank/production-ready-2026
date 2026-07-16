# @regenera/fraud

Fraud scoring and decisioning.

## Activation

| Adapter | Status |
|---------|--------|
| simulator | **ACTIVE** (local CI) |
| sandbox | **ACTIVE** (homolog) |
| production | **EXTERNAL_ACTIVATION_REQUIRED** |

## Usage

```typescript
import { FraudModule } from '@regenera/fraud';

@Module({
  imports: [FraudModule.register({ adapter: 'simulator' })],
})
export class AppModule {}
```

Environment override: `FRAUD_ADAPTER=simulator|sandbox|production`
