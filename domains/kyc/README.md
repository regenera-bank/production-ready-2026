# @regenera/kyc

Know-your-customer verification workflows.

## Activation

| Adapter | Status |
|---------|--------|
| simulator | **ACTIVE** (local CI) |
| sandbox | **ACTIVE** (homolog) |
| production | **EXTERNAL_ACTIVATION_REQUIRED** |

## Usage

```typescript
import { KycModule } from '@regenera/kyc';

@Module({
  imports: [KycModule.register({ adapter: 'simulator' })],
})
export class AppModule {}
```

Environment override: `KYC_ADAPTER=simulator|sandbox|production`
