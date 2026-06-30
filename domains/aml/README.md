# @regenera/aml

Anti-money-laundering monitoring.

## Activation

| Adapter | Status |
|---------|--------|
| simulator | **ACTIVE** (local CI) |
| sandbox | **ACTIVE** (homolog) |
| production | **EXTERNAL_ACTIVATION_REQUIRED** |

## Usage

```typescript
import { AmlModule } from '@regenera/aml';

@Module({
  imports: [AmlModule.register({ adapter: 'simulator' })],
})
export class AppModule {}
```

Environment override: `AML_ADAPTER=simulator|sandbox|production`
