# @regenera/investments

Investment positions and orders.

## Activation

| Adapter | Status |
|---------|--------|
| simulator | **ACTIVE** (local CI) |
| sandbox | **ACTIVE** (homolog) |
| production | **EXTERNAL_ACTIVATION_REQUIRED** |

## Usage

```typescript
import { InvestmentsModule } from '@regenera/investments';

@Module({
  imports: [InvestmentsModule.register({ adapter: 'simulator' })],
})
export class AppModule {}
```

Environment override: `INVESTMENTS_ADAPTER=simulator|sandbox|production`
